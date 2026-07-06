import { Worker } from "bullmq";
import { prisma } from "../db/prisma";
import { env } from "../config/env";
import { createLogger } from "../config/logger";
import type { ReputationJobData } from "../queues/reputation.queue";

const logger = createLogger("reputation-worker");

export const reputationWorker = new Worker(
  "reputation",
  async (job) => {
    const data = job.data as ReputationJobData;

    logger.info(
      { userId: data.userId, points: data.reputationPoints },
      "Processing reputation update"
    );

    // Update reputation atomically
    await prisma.$transaction([
      prisma.reputation.upsert({
        where: { userId: data.userId },
        update: {
          totalPoints: { increment: data.reputationPoints },
          eventsAttended: { increment: 1 },
        },
        create: {
          userId: data.userId,
          totalPoints: data.reputationPoints,
          eventsAttended: 1,
        },
      }),
    ]);

    // Recalculate average rating
    const ratings = await prisma.rating.findMany({
      where: { ratedId: data.userId },
      select: { score: true },
    });

    if (ratings.length > 0) {
      const avg =
        ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length;

      await prisma.reputation.update({
        where: { userId: data.userId },
        data: { avgRating: avg },
      });
    }

    logger.info({ userId: data.userId }, "Reputation updated successfully");
  },
  {
    connection: { url: env.REDIS_URL },
    concurrency: 5,
  }
);

reputationWorker.on("completed", (job) => {
  logger.debug({ jobId: job.id }, "Reputation job completed");
});

reputationWorker.on("failed", (job, err) => {
  logger.error({ jobId: job?.id, err }, "Reputation job failed");
});
