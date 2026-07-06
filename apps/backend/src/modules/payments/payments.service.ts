import { prisma } from "../../db/prisma";
import { connection } from "../../blockchain/client";
import { createLogger } from "../../config/logger";
import type { RecordPaymentInput } from "./payments.types";

const logger = createLogger("payments-service");

const TICKET_PRICE_MULTIPLIER: Record<number, bigint> = {
  0: BigInt(1),
  1: BigInt(3),
  2: BigInt(6),
};

export const paymentsService = {
  // Record a confirmed on-chain payment in the database
  recordPayment: async (userId: string, input: RecordPaymentInput) => {
    logger.debug({ userId, eventId: input.eventId }, "Recording payment");

    // Idempotency check — never record same transaction twice
    const existing = await prisma.transaction.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
    });

    if (existing) {
      logger.info({ idempotencyKey: input.idempotencyKey }, "Duplicate payment record — returning existing");
      return existing;
    }

    // Check transaction signature not already recorded
    const existingTx = await prisma.transaction.findUnique({
      where: { txSignature: input.txSignature },
    });

    if (existingTx) {
      logger.warn({ txSignature: input.txSignature }, "Transaction signature already recorded");
      return existingTx;
    }

    // Fetch event for price calculation
    const event = await prisma.event.findUnique({
      where: { id: input.eventId },
    });

    if (!event) {
      throw new Error("Event not found");
    }

    // Verify transaction actually exists on-chain
    const txInfo = await connection.getTransaction(input.txSignature, {
      commitment: "confirmed",
    });

    if (!txInfo) {
      throw new Error("Transaction not found on-chain — may not be confirmed yet");
    }

    if (txInfo.meta?.err) {
      throw new Error("Transaction failed on-chain");
    }

    // Calculate amount
    const multiplier = TICKET_PRICE_MULTIPLIER[input.ticketType];
    const amountLamports = BigInt(event.ticketPrice) * multiplier;

    // Record confirmed payment
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        eventId: input.eventId,
        type: "TICKET_PURCHASE",
        status: "CONFIRMED",
        amountLamports,
        txSignature: input.txSignature,
        idempotencyKey: input.idempotencyKey,
        metadata: {
          ticketType: input.ticketType,
          eventName: event.name,
          slot: txInfo.slot,
        },
      },
    });

    logger.info(
      { transactionId: transaction.id, txSignature: input.txSignature },
      "On-chain payment recorded"
    );

    return transaction;
  },

  // Get all transactions for a user
  getUserTransactions: async (userId: string) => {
    return prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            eventDate: true,
          },
        },
      },
    });
  },

  // Get single transaction
  getTransactionById: async (transactionId: string, userId: string) => {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            eventDate: true,
          },
        },
      },
    });

    if (!transaction) {
      throw new Error("Transaction not found");
    }

    if (transaction.userId !== userId) {
      throw new Error("Unauthorized");
    }

    return transaction;
  },

  // Get all transactions for an event (organizer only)
  getEventTransactions: async (eventId: string, organizerId: string) => {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new Error("Event not found");
    }

    if (event.organizerId !== organizerId) {
      throw new Error("Unauthorized");
    }

    return prisma.transaction.findMany({
      where: { eventId, status: "CONFIRMED" },
      orderBy: { createdAt: "desc" },
    });
  },

  // Verify a transaction signature on-chain
  verifyTransaction: async (txSignature: string) => {
    const txInfo = await connection.getTransaction(txSignature, {
      commitment: "confirmed",
    });

    if (!txInfo) {
      return { verified: false, reason: "Transaction not found on-chain" };
    }

    if (txInfo.meta?.err) {
      return { verified: false, reason: "Transaction failed on-chain" };
    }

    return {
      verified: true,
      slot: txInfo.slot,
      blockTime: txInfo.blockTime,
    };
  },
};
