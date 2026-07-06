import { Worker } from "bullmq";
import { prisma } from "../db/prisma";
import { env } from "../config/env";
import { createLogger } from "../config/logger";
import type { UploadMetadataJobData } from "../queues/metadata.queue";

const logger = createLogger("metadata-worker");

export const uploadMetadataWorker = new Worker(
  "uploadMetadata",
  async (job) => {
    const data = job.data as UploadMetadataJobData;

    logger.info(
      { eventId: data.eventId, type: data.type },
      "Processing metadata upload"
    );

    // For now store metadata as JSON string
    // In production: upload to Arweave or IPFS and get back a URI
    const metadataJson = JSON.stringify(data.metadata);
    const placeholderUri = `https://metadata.tokora.xyz/${data.eventId}/${data.type.toLowerCase()}.json`;

    // Store upload record
    await prisma.metadataUpload.create({
      data: {
        eventId: data.eventId,
        type: data.type,
        uri: placeholderUri,
      },
    });

    logger.info(
      { eventId: data.eventId, uri: placeholderUri },
      "Metadata upload recorded"
    );

    return { uri: placeholderUri };
  },
  {
    connection: { url: env.REDIS_URL },
    concurrency: 3,
  }
);

uploadMetadataWorker.on("completed", (job) => {
  logger.debug({ jobId: job.id }, "Metadata upload job completed");
});

uploadMetadataWorker.on("failed", (job, err) => {
  logger.error({ jobId: job?.id, err }, "Metadata upload job failed");
});
