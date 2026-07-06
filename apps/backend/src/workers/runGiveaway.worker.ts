import { Worker } from "bullmq";
import { prisma } from "../db/prisma";
import { env } from "../config/env";
import { createLogger } from "../config/logger";
import { addNotificationJob } from "../queues/notification.queue";
import type { GiveawayJobData } from "../queues/giveaway.queue";

const logger = createLogger("giveaway-worker");

export const giveawayWorker = new Worker(
  "giveaway",
  async (job) => {
    const data = job.data as GiveawayJobData;

    logger.info({ eventId: data.eventId }, "Running giveaway draw");

    // Get all verified attendees for this event
    const attendances = await prisma.attendanceRecord.findMany({
      where: {
        eventId: data.eventId,
        verified: true,
      },
      select: {
        userId: true,
        user: {
          select: { name: true },
        },
      },
    });

    if (attendances.length === 0) {
      logger.warn({ eventId: data.eventId }, "No verified attendees for giveaway");
      return;
    }

    // Randomly select winner
    const winnerIndex = Math.floor(Math.random() * attendances.length);
    const winner = attendances[winnerIndex];

    logger.info(
      { eventId: data.eventId, winnerId: winner.userId },
      "Giveaway winner selected"
    );

    // Get event details
    const event = await prisma.event.findUnique({
      where: { id: data.eventId },
      select: { name: true },
    });

    // Notify winner
    await addNotificationJob({
      userId: winner.userId,
      type: "GIVEAWAY_WON",
      payload: {
        eventName: event?.name,
        prize: data.prizeDescription,
      },
    });

    logger.info({ winnerId: winner.userId }, "Giveaway complete");
  },
  {
    connection: { url: env.REDIS_URL },
    concurrency: 1,
  }
);

giveawayWorker.on("completed", (job) => {
  logger.debug({ jobId: job.id }, "Giveaway job completed");
});

giveawayWorker.on("failed", (job, err) => {
  logger.error({ jobId: job?.id, err }, "Giveaway job failed");
});
