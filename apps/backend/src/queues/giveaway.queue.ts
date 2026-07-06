import { giveawayQueue } from "./index";
import { createLogger } from "../config/logger";

const logger = createLogger("giveaway-queue");

export interface GiveawayJobData {
  eventId: string;
  organizerId: string;
  prizeDescription: string;
}

export const addGiveawayJob = async (
  data: GiveawayJobData
): Promise<void> => {
  await giveawayQueue.add("runGiveaway", data, {
    attempts: 2,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: 50,
    removeOnFail: 50,
  });

  logger.info({ eventId: data.eventId }, "Giveaway job queued");
};
