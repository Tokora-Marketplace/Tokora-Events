import { uploadMetadataQueue } from "./index";
import { createLogger } from "../config/logger";

const logger = createLogger("metadata-queue");

export interface UploadMetadataJobData {
  eventId: string;
  type: "EVENT" | "NFT";
  metadata: Record<string, any>;
}

export const addUploadMetadataJob = async (
  data: UploadMetadataJobData
): Promise<void> => {
  await uploadMetadataQueue.add("uploadMetadata", data, {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 3000,
    },
    removeOnComplete: 100,
    removeOnFail: 50,
  });

  logger.info({ eventId: data.eventId, type: data.type }, "Metadata upload job queued");
};
