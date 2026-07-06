import { redis } from "./redis";
import { createLogger } from "../config/logger";

const logger = createLogger("qr-cache");

const QR_USED_TTL = 60 * 60 * 24;
const EVENT_TICKETS_TTL = 60 * 60 * 12;

export const qrCache = {
  markAsUsed: async (ticketId: string, eventId: string): Promise<boolean> => {
    const key = `qr:used:${eventId}:${ticketId}`;
    const result = await redis.set(key, "1", {
      NX: true,
      EX: QR_USED_TTL,
    });
    const success = result === "OK";
    if (!success) {
      logger.warn({ ticketId, eventId }, "Duplicate QR scan detected");
    }
    return success;
  },

  isUsed: async (ticketId: string, eventId: string): Promise<boolean> => {
    const key = `qr:used:${eventId}:${ticketId}`;
    const result = await redis.get(key);
    return result !== null;
  },

  loadEventTickets: async (
    eventId: string,
    ticketIds: string[]
  ): Promise<void> => {
    const key = `qr:tickets:${eventId}`;
    if (ticketIds.length === 0) return;
    await redis.sAdd(key, ticketIds);
    await redis.expire(key, EVENT_TICKETS_TTL);
    logger.info({ eventId, count: ticketIds.length }, "Event tickets loaded into cache");
  },

  isValidTicket: async (ticketId: string, eventId: string): Promise<boolean> => {
    const key = `qr:tickets:${eventId}`;
    const result = await redis.sIsMember(key, ticketId);
    return Boolean(result);
  },

  clearEvent: async (eventId: string): Promise<void> => {
    const ticketsKey = `qr:tickets:${eventId}`;
    await redis.del(ticketsKey);
    logger.info({ eventId }, "Event QR cache cleared");
  },
};
