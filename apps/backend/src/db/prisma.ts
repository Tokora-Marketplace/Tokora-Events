import { PrismaClient } from "@prisma/client";
import { createLogger } from "../config/logger";

const logger = createLogger("prisma");

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV !== "production"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export const connectDB = async (): Promise<void> => {
  await prisma.$connect();
  logger.info("Database connected");
};

export const disconnectDB = async (): Promise<void> => {
  await prisma.$disconnect();
  logger.info("Database disconnected");
};
