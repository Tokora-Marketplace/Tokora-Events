import { prisma } from "../../db/prisma";
import { createLogger } from "../../config/logger";
import { pdas } from "../../blockchain/pda";
import { PublicKey } from "@solana/web3.js";
import type { PurchaseTicketInput } from "./tickets.types";

const logger = createLogger("tickets-service");

const TICKET_TYPE_MAP: Record<number, string> = {
  0: "GENERAL",
  1: "VIP",
  2: "SPEAKER",
};

const TICKET_PRICE_MULTIPLIER: Record<number, number> = {
  0: 1,
  1: 3,
  2: 6,
};

export const ticketsService = {
  // Purchase a ticket — creates attendee record
  purchaseTicket: async (userId: string, input: PurchaseTicketInput) => {
    logger.debug({ userId, eventId: input.eventId }, "Purchasing ticket");

    // Idempotency check — if this key exists return existing record
    const existing = await prisma.attendeeRecord.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
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
    });

    if (existing) {
      logger.info({ idempotencyKey: input.idempotencyKey }, "Duplicate ticket purchase detected — returning existing record");
      return existing;
    }

    // Fetch event
    const event = await prisma.event.findUnique({
      where: { id: input.eventId },
    });

    if (!event) {
      throw new Error("Event not found");
    }

    if (event.status !== "ACTIVE") {
      throw new Error("Event is not active");
    }

    if (event.ticketsSold >= event.totalSupply) {
      throw new Error("Event is at full capacity");
    }

    // Check if user already registered
    const alreadyRegistered = await prisma.attendeeRecord.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId: input.eventId,
        },
      },
    });

    if (alreadyRegistered) {
      throw new Error("You are already registered for this event");
    }

    // Get user wallet for PDA derivation
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { walletAddress: true },
    });

    if (!user?.walletAddress) {
      throw new Error("User wallet address not found");
    }

    // Calculate ticket price
    const multiplier = TICKET_PRICE_MULTIPLIER[input.ticketType];
    const amountPaid = BigInt(event.ticketPrice) * BigInt(multiplier);

    // Derive attendee record PDA
    const attendeePublicKey = new PublicKey(user.walletAddress);
    const eventAccountPda = new PublicKey(event.eventAccountPda!);
    const attendeeRecordPda = pdas.attendeeRecord(attendeePublicKey, eventAccountPda);

    // Create attendee record and update ticket count atomically
    const [attendeeRecord] = await prisma.$transaction([
      prisma.attendeeRecord.create({
        data: {
          userId,
          eventId: input.eventId,
          ticketType: TICKET_TYPE_MAP[input.ticketType] as any,
          amountPaid,
          status: "PENDING",
          attendeeRecordPda: attendeeRecordPda.toBase58(),
          idempotencyKey: input.idempotencyKey,
        },
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
      }),
      prisma.event.update({
        where: { id: input.eventId },
        data: { ticketsSold: { increment: 1 } },
      }),
    ]);

    logger.info(
      { userId, eventId: input.eventId, ticketType: input.ticketType },
      "Ticket purchased"
    );

    return attendeeRecord;
  },

  // Get all tickets for a user
  getUserTickets: async (userId: string) => {
    return prisma.attendeeRecord.findMany({
      where: { userId },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            eventDate: true,
            location: true,
            mode: true,
            status: true,
          },
        },
        attendanceRecord: {
          select: {
            verified: true,
            nftMinted: true,
            nftMintAddress: true,
          },
        },
      },
      orderBy: { registeredAt: "desc" },
    });
  },

  // Get single ticket by ID
  getTicketById: async (ticketId: string, userId: string) => {
    const ticket = await prisma.attendeeRecord.findUnique({
      where: { id: ticketId },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            eventDate: true,
            location: true,
            mode: true,
            status: true,
            organizer: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        attendanceRecord: {
          select: {
            verified: true,
            nftMinted: true,
            nftMintAddress: true,
            verifiedAt: true,
          },
        },
      },
    });

    if (!ticket) {
      throw new Error("Ticket not found");
    }

    if (ticket.userId !== userId) {
      throw new Error("Unauthorized — this ticket does not belong to you");
    }

    return ticket;
  },

  // Get all attendees for an event (organizer only)
  getEventAttendees: async (eventId: string, organizerId: string) => {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new Error("Event not found");
    }

    if (event.organizerId !== organizerId) {
      throw new Error("Unauthorized");
    }

    return prisma.attendeeRecord.findMany({
      where: { eventId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            walletAddress: true,
          },
        },
        attendanceRecord: {
          select: {
            verified: true,
            verifiedAt: true,
            nftMinted: true,
          },
        },
      },
      orderBy: { registeredAt: "asc" },
    });
  },
};
