import { prisma } from "../../db/prisma";
import { createLogger } from "../../config/logger";
import { qrCache } from "../../cache/qr.cache";
import { pdas } from "../../blockchain/pda";
import { connection } from "../../blockchain/client";
import { parseContractError } from "../../blockchain/errors";
import { PublicKey, Keypair, Transaction } from "@solana/web3.js";
import type { VerifyAttendanceInput, QRScanInput } from "./attendance.types";

const logger = createLogger("attendance-service");

export const attendanceService = {
  // Load all valid tickets for an event into Redis cache
  // Called when event starts — enables fast QR scanning
  loadEventIntoCache: async (eventId: string): Promise<void> => {
    const tickets = await prisma.attendeeRecord.findMany({
      where: {
        eventId,
        status: "PENDING",
      },
      select: { id: true },
    });

    const ticketIds = tickets.map((t) => t.id);
    await qrCache.loadEventTickets(eventId, ticketIds);

    logger.info({ eventId, count: ticketIds.length }, "Event loaded into QR cache");
  },

  // Validate QR scan — fast path via Redis
  validateQRScan: async (input: QRScanInput): Promise<{
    valid: boolean;
    reason?: string;
    attendeeRecord?: any;
  }> => {
    logger.debug({ eventId: input.eventId, ticketId: input.ticketId }, "Validating QR scan");

    // Step 1 — check ticket is valid for this event via Redis cache
    const isValidTicket = await qrCache.isValidTicket(
      input.ticketId,
      input.eventId
    );

    if (!isValidTicket) {
      return { valid: false, reason: "Invalid ticket for this event" };
    }

    // Step 2 — check ticket hasn't already been scanned
    const alreadyUsed = await qrCache.isUsed(input.ticketId, input.eventId);

    if (alreadyUsed) {
      return { valid: false, reason: "Ticket has already been scanned" };
    }

    // Step 3 — fetch attendee record from database
    const attendeeRecord = await prisma.attendeeRecord.findUnique({
      where: { id: input.ticketId },
      include: {
        user: {
          select: {
            walletAddress: true,
            name: true,
            email: true,
          },
        },
        event: {
          select: {
            id: true,
            name: true,
            mode: true,
            eventAccountPda: true,
            handlerAddress: true,
          },
        },
      },
    });

    if (!attendeeRecord) {
      return { valid: false, reason: "Ticket record not found" };
    }

    if (attendeeRecord.status !== "PENDING") {
      return { valid: false, reason: "Ticket is not in valid state for scanning" };
    }

    // Step 4 — atomically mark as used in Redis
    const marked = await qrCache.markAsUsed(input.ticketId, input.eventId);

    if (!marked) {
      return { valid: false, reason: "Ticket has already been scanned" };
    }

    logger.info(
      { ticketId: input.ticketId, eventId: input.eventId },
      "QR scan validated"
    );

    return { valid: true, attendeeRecord };
  },

  // Record attendance in database after successful QR scan
  recordAttendance: async (
    attendeeRecordId: string,
    eventId: string,
    userId: string
  ): Promise<any> => {
    // Get attendee record for PDA derivation
    const attendeeRecord = await prisma.attendeeRecord.findUnique({
      where: { id: attendeeRecordId },
      include: {
        user: { select: { walletAddress: true } },
        event: { select: { eventAccountPda: true, mode: true } },
      },
    });

    if (!attendeeRecord) {
      throw new Error("Attendee record not found");
    }

    // Derive attendance record PDA
    const attendeePublicKey = new PublicKey(attendeeRecord.user.walletAddress!);
    const eventAccountPda = new PublicKey(attendeeRecord.event.eventAccountPda!);
    const attendanceRecordPda = pdas.attendanceRecord(attendeePublicKey, eventAccountPda);

    // Determine reputation points based on ticket type
    const reputationPoints =
      attendeeRecord.ticketType === "GENERAL"
        ? 10
        : attendeeRecord.ticketType === "VIP"
        ? 25
        : 50;

    // Create attendance record and update attendee status atomically
    const [attendanceRecord] = await prisma.$transaction([
      prisma.attendanceRecord.create({
        data: {
          userId,
          eventId,
          attendeeRecordId,
          verified: true,
          verifiedAt: new Date(),
          reputationPoints,
          attendanceRecordPda: attendanceRecordPda.toBase58(),
        },
      }),
      prisma.attendeeRecord.update({
        where: { id: attendeeRecordId },
        data: { status: "APPROVED" },
      }),
      prisma.event.update({
        where: { id: eventId },
        data: { ticketsVerified: { increment: 1 } },
      }),
    ]);

    logger.info(
      { attendeeRecordId, userId, reputationPoints },
      "Attendance recorded"
    );

    return attendanceRecord;
  },

  // Update attendance record with NFT mint address after minting
  updateNFTMint: async (
    attendanceRecordId: string,
    nftMintAddress: string
  ): Promise<void> => {
    await prisma.attendanceRecord.update({
      where: { id: attendanceRecordId },
      data: {
        nftMinted: true,
        nftMintAddress,
      },
    });

    logger.info({ attendanceRecordId, nftMintAddress }, "NFT mint address recorded");
  },

  // Get attendance record for a user and event
  getAttendanceRecord: async (userId: string, eventId: string) => {
    return prisma.attendanceRecord.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            eventDate: true,
            mode: true,
          },
        },
      },
    });
  },

  // Get all attendance records for a user
  getUserAttendanceHistory: async (userId: string) => {
    return prisma.attendanceRecord.findMany({
      where: { userId, verified: true },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            eventDate: true,
            location: true,
            mode: true,
          },
        },
      },
      orderBy: { verifiedAt: "desc" },
    });
  },

  // Get all verified attendances for an event
  getEventAttendances: async (eventId: string, organizerId: string) => {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new Error("Event not found");
    }

    if (event.organizerId !== organizerId) {
      throw new Error("Unauthorized");
    }

    return prisma.attendanceRecord.findMany({
      where: { eventId, verified: true },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            walletAddress: true,
          },
        },
      },
      orderBy: { verifiedAt: "asc" },
    });
  },
};
