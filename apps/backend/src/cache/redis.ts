import { createClient } from "redis";
import { env } from "../config/env";
import { createLogger } from "../config/logger";

const logger = createLogger("redis");

export const redis = createClient({
  url: env.REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        logger.error("Redis reconnection failed after 10 attempts");
        return new Error("Redis max retries reached");
      }
      const delay = Math.min(retries * 100, 3000);
      logger.warn({ retries, delay }, "Redis reconnecting");
      return delay;
    },
  },
});

redis.on("connect", () => {
  logger.info("Redis connected");
});

redis.on("error", (err) => {
  logger.error({ err }, "Redis error");
});

redis.on("reconnecting", () => {
  logger.warn("Redis reconnecting");
});

redis.on("end", () => {
  logger.warn("Redis connection closed");
});

export const connectRedis = async (): Promise<void> => {
  await redis.connect();
};

export const disconnectRedis = async (): Promise<void> => {
  await redis.disconnect();
};
