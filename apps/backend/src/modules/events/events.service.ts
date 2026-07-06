import { prisma } from "../../db/prisma";
import { createLogger } from "../../config/logger";
import { pdas } from "../../blockchain/pda";
import { PublicKey } from "@solana/web3.js";
import { v4 as uuidv4 } from "uuid";
import type { CreateEventInput, UpdateEventInput } from "./events.types";

const logger = createLogger("events-service");

export const eventsService = {
  // Create event in database before calling on-chain
  createEvent: async (organizerId: string, input: CreateEventInput) => {
    logger.debug({ organizerId, name: input.name }, "Creating event");

    // Get organizer wallet address for PDA derivation
    const organizer = await prisma.user.findUnique({
      where: { id: organizerId },
      select: { walletAddress: true },
    });

    if (!organizer?.walletAddress) {
      throw new Error("Organizer wallet address not found");
    }

    // Generate unique event ID as u64
    const eventId = BigInt(Date.now());

    // Derive on-chain PDAs
    const organizerPublicKey = new PublicKey(organizer.walletAddress);
    const eventAccountPda = pdas.eventAccount(organizerPublicKey, eventId);
    const vaultPda = pdas.organizerVault(eventAccountPda);

    // Create event record in database
    const event = await prisma.event.create({
      data: {
        eventId,
        organizerId,
        name: input.name,
        description: input.description,
        symbol: input.symbol,
        ticketPrice: BigInt(input.ticketPrice),
        totalSupply: input.totalSupply,
        mode: input.mode,
        eventDate: new Date(input.eventDate),
        location: input.location,
        eventAccountPda: eventAccountPda.toBase58(),
        vaultPda: input.mode === "WEB3" ? vaultPda.toBase58() : null,
        costPerMint: input.costPerMint ? BigInt(input.costPerMint) : null,
      },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            walletAddress: true,
          },
        },
      },
    });

    logger.info({ eventId: event.id, onChainId: eventId.toString() }, "Event created");

    return event;
  },

  // Fetch all active events
  getAllEvents: async (page = 1, limit = 20) => {
    const skip = (page - 1) * limit;

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where: { status: "ACTIVE" },
        include: {
          organizer: {
            select: {
              id: true,
              name: true,
              walletAddress: true,
            },
          },
        },
        orderBy: { eventDate: "asc" },
        skip,
        take: limit,
      }),
      prisma.event.count({ where: { status: "ACTIVE" } }),
    ]);

    return {
      events,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  // Fetch single event by ID
  getEventById: async (eventId: string) => {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            walletAddress: true,
            reputation: {
              select: {
                totalPoints: true,
                eventsOrganized: true,
                avgRating: true,
              },
            },
          },
        },
      },
    });

    if (!event) {
      throw new Error("Event not found");
    }

    return event;
  },

  // Fetch all events by organizer
  getEventsByOrganizer: async (organizerId: string) => {
    return prisma.event.findMany({
      where: { organizerId },
      orderBy: { createdAt: "desc" },
    });
  },

  // Update event metadata
  updateEvent: async (
    eventId: string,
    organizerId: string,
    input: UpdateEventInput
  ) => {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new Error("Event not found");
    }

    if (event.organizerId !== organizerId) {
      throw new Error("Unauthorized — you are not the organizer of this event");
    }

    if (event.status !== "ACTIVE") {
      throw new Error("Cannot update an event that is not active");
    }

    return prisma.event.update({
      where: { id: eventId },
      data: {
        name: input.name,
        description: input.description,
        location: input.location,
        bannerImage: input.bannerImage,
      },
    });
  },

  // Set handler address for QR scanning
  setHandler: async (
    eventId: string,
    organizerId: string,
    handlerAddress: string
  ) => {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new Error("Event not found");
    }

    if (event.organizerId !== organizerId) {
      throw new Error("Unauthorized");
    }

    // Validate handler address is a valid Solana public key
    try {
      new PublicKey(handlerAddress);
    } catch {
      throw new Error("Invalid handler wallet address");
    }

    return prisma.event.update({
      where: { id: eventId },
      data: { handlerAddress },
    });
  },

  // Close event
  closeEvent: async (eventId: string, organizerId: string) => {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new Error("Event not found");
    }

    if (event.organizerId !== organizerId) {
      throw new Error("Unauthorized");
    }

    if (event.status === "ENDED") {
      throw new Error("Event is already ended");
    }

    return prisma.event.update({
      where: { id: eventId },
      data: { status: "ENDED" },
    });
  },
};
