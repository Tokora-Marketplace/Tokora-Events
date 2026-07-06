import { redis } from "./redis";
import { createLogger } from "../config/logger";

const logger = createLogger("session-cache");

// Session TTL mirrors refresh token expiry (7 days in seconds)
const SESSION_TTL = 60 * 60 * 24 * 7;

export interface SessionData {
  userId: string;
  walletAddress: string;
  email: string;
  role: "attendee" | "organizer" | "admin";
  createdAt: number;
}

export const sessionCache = {
  // Store a session against a refresh token
  set: async (refreshToken: string, data: SessionData): Promise<void> => {
    const key = `session:${refreshToken}`;
    await redis.set(key, JSON.stringify(data), { EX: SESSION_TTL });
    logger.debug({ userId: data.userId }, "Session stored");
  },

  // Retrieve a session by refresh token
  get: async (refreshToken: string): Promise<SessionData | null> => {
    const key = `session:${refreshToken}`;
    const result = await redis.get(key);

    if (!result) {
      logger.debug({ refreshToken }, "Session not found");
      return null;
    }

    return JSON.parse(result) as SessionData;
  },

  // Delete a session on logout
  delete: async (refreshToken: string): Promise<void> => {
    const key = `session:${refreshToken}`;
    await redis.del(key);
    logger.debug({ refreshToken }, "Session deleted");
  },

  // Rotate refresh token — delete old, store new
  rotate: async (
    oldToken: string,
    newToken: string,
    data: SessionData
  ): Promise<void> => {
    await sessionCache.delete(oldToken);
    await sessionCache.set(newToken, data);
    logger.debug({ userId: data.userId }, "Session rotated");
  },

  // Delete all sessions for a user (force logout everywhere)
  deleteAllForUser: async (userId: string): Promise<void> => {
    const pattern = `session:*`;
    const keys = await redis.keys(pattern);

    for (const key of keys) {
      const raw = await redis.get(key);
      if (!raw) continue;

      const session = JSON.parse(raw) as SessionData;
      if (session.userId === userId) {
        await redis.del(key);
      }
    }

    logger.info({ userId }, "All sessions cleared for user");
  },
};
