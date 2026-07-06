import { Worker } from "bullmq";
import { env } from "../config/env";
import { createLogger } from "../config/logger";
import type { NotificationJobData } from "../queues/notification.queue";

const logger = createLogger("notification-worker");

const NOTIFICATION_MESSAGES: Record<string, (payload: any) => string> = {
  TICKET_PURCHASED: (p) => `Your ticket for ${p.eventName} has been confirmed.`,
  ATTENDANCE_VERIFIED: (p) => `Your attendance at ${p.eventName} has been verified.`,
  NFT_MINTED: (p) => `Your attendance NFT for ${p.eventName} has been minted.`,
  GIVEAWAY_WON: (p) => `Congratulations! You won the giveaway at ${p.eventName}.`,
};

export const notificationWorker = new Worker(
  "notification",
  async (job) => {
    const data = job.data as NotificationJobData;

    logger.info(
      { userId: data.userId, type: data.type },
      "Processing notification"
    );

    const message = NOTIFICATION_MESSAGES[data.type]?.(data.payload);

    if (!message) {
      logger.warn({ type: data.type }, "Unknown notification type");
      return;
    }

    // For now log the notification
    // In production: integrate email, push notifications, or in-app alerts
    logger.info(
      { userId: data.userId, message },
      "Notification dispatched"
    );
  },
  {
    connection: { url: env.REDIS_URL },
    concurrency: 10,
  }
);

notificationWorker.on("completed", (job) => {
  logger.debug({ jobId: job.id }, "Notification job completed");
});

notificationWorker.on("failed", (job, err) => {
  logger.error({ jobId: job?.id, err }, "Notification job failed");
});
