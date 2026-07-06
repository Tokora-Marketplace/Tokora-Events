import { Worker } from "bullmq";
import { prisma } from "../db/prisma";
import { env } from "../config/env";
import { createLogger } from "../config/logger";
import { addNotificationJob } from "../queues/notification.queue";
import { addReputationJob } from "../queues/reputation.queue";
import type { MintNFTJobData } from "../queues/mintNFT.queue";

const logger = createLogger("mintNFT-worker");

export const mintNFTWorker = new Worker(
  "mintNFT",
  async (job) => {
    const data = job.data as MintNFTJobData;

    logger.info(
      { attendanceRecordId: data.attendanceRecordId },
      "Processing NFT mint job"
    );

    // Check if already minted — idempotency
    const attendanceRecord = await prisma.attendanceRecord.findUnique({
      where: { id: data.attendanceRecordId },
      include: {
        attendeeRecord: {
          select: { ticketType: true },
        },
      },
    });

    if (!attendanceRecord) {
      throw new Error("Attendance record not found");
    }

    if (attendanceRecord.nftMinted) {
      logger.info(
        { attendanceRecordId: data.attendanceRecordId },
        "NFT already minted — skipping"
      );
      return;
    }

    // Get event to check mode
    const event = await prisma.event.findUnique({
      where: { id: data.eventId },
      select: { mode: true, name: true },
    });

    if (!event) {
      throw new Error("Event not found");
    }

    if (event.mode !== "WEB3") {
      logger.info({ eventId: data.eventId }, "Web2 event — no NFT minting");
      return;
    }

    // Queue reputation update
    await addReputationJob({
      userId: data.userId,
      eventId: data.eventId,
      attendanceRecordId: data.attendanceRecordId,
      reputationPoints: attendanceRecord.reputationPoints,
      ticketType: attendanceRecord.attendeeRecord.ticketType,
    });

    // Queue notification
    await addNotificationJob({
      userId: data.userId,
      type: "NFT_MINTED",
      payload: {
        eventName: event.name,
        nftMintAddress: attendanceRecord.nftMintAddress,
      },
    });

    logger.info(
      { attendanceRecordId: data.attendanceRecordId },
      "NFT mint post-processing complete"
    );
  },
  {
    connection: { url: env.REDIS_URL },
    concurrency: 3,
  }
);

mintNFTWorker.on("completed", (job) => {
  logger.debug({ jobId: job.id }, "MintNFT job completed");
});

mintNFTWorker.on("failed", (job, err) => {
  logger.error({ jobId: job?.id, err }, "MintNFT job failed");
});
