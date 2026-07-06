import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import { env } from "./config/env";
import { createLogger } from "./config/logger";
import { connectDB, disconnectDB } from "./db/prisma";
import { connectRedis, disconnectRedis } from "./cache/redis";
import { testConnection } from "./blockchain/client";
import { authRoutes } from "./modules/auth/auth.routes";
import { eventsRoutes } from "./modules/events/events.routes";
import { ticketsRoutes } from "./modules/tickets/tickets.routes";
import { attendanceRoutes } from "./modules/attendance/attendance.routes";
import { paymentsRoutes } from "./modules/payments/payments.routes";
import { reputationWorker } from "./workers/updateReputation.worker";
import { notificationWorker } from "./workers/sendNotification.worker";
import { giveawayWorker } from "./workers/runGiveaway.worker";
import { uploadMetadataWorker } from "./workers/uploadMetadata.worker";
import { mintNFTWorker } from "./workers/mintNFT.worker";

const logger = createLogger("server");

const app = Fastify({
  logger: false,
});

app.register(cors, {
  origin: true,
  credentials: true,
});

app.register(jwt, {
  secret: env.JWT_SECRET,
  sign: {
    expiresIn: env.JWT_EXPIRES_IN,
  },
});

app.register(authRoutes);
app.register(eventsRoutes);
app.register(ticketsRoutes);
app.register(attendanceRoutes);
app.register(paymentsRoutes);

app.get("/health", async () => {
  return {
    status: "ok",
    service: "tokora-backend",
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    workers: {
      reputation: reputationWorker.isRunning(),
      notification: notificationWorker.isRunning(),
      giveaway: giveawayWorker.isRunning(),
      uploadMetadata: uploadMetadataWorker.isRunning(),
      mintNFT: mintNFTWorker.isRunning(),
    },
  };
});

const start = async (): Promise<void> => {
  try {
    await connectDB();
    logger.info("PostgreSQL connected");

    await connectRedis();
    logger.info("Redis connected");

    await testConnection();
    logger.info("Solana RPC connected");

    await app.listen({
      port: env.PORT,
      host: "0.0.0.0",
    });

    logger.info({ port: env.PORT }, "Tokora backend running");
    logger.info("All workers running");
  } catch (err) {
    logger.error({ err }, "Server failed to start");
    process.exit(1);
  }
};

const shutdown = async (signal: string): Promise<void> => {
  logger.info({ signal }, "Shutdown signal received");

  try {
    await reputationWorker.close();
    await notificationWorker.close();
    await giveawayWorker.close();
    await uploadMetadataWorker.close();
    await mintNFTWorker.close();
    await app.close();
    await disconnectDB();
    await disconnectRedis();
    logger.info("Graceful shutdown complete");
    process.exit(0);
  } catch (err) {
    logger.error({ err }, "Error during shutdown");
    process.exit(1);
  }
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

start();
