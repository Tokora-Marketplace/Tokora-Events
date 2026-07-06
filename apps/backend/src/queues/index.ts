import { Queue } from "bullmq";
import { env } from "../config/env";

const connection = {
  url: env.REDIS_URL,
};

export const mintNFTQueue = new Queue("mintNFT", { connection });
export const uploadMetadataQueue = new Queue("uploadMetadata", { connection });
export const reputationQueue = new Queue("reputation", { connection });
export const notificationQueue = new Queue("notification", { connection });
export const giveawayQueue = new Queue("giveaway", { connection });

export const queues = {
  mintNFT: mintNFTQueue,
  uploadMetadata: uploadMetadataQueue,
  reputation: reputationQueue,
  notification: notificationQueue,
  giveaway: giveawayQueue,
};
