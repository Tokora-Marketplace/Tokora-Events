import { reputationQueue } from "./index";
import { createLogger } from "../config/logger";

const logger = createLogger("reputation-queue");

export interface ReputationJobData {
  userId: string;
  eventId: string;
  attendanceRecordId: string;
  reputationPoints: number;
  ticketType: string;
}

export const addReputationJob = async (
  data: ReputationJobData
): Promise<void> => {
  await reputationQueue.add("updateReputation", data, {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: 100,
    removeOnFail: 50,
  });

  logger.info({ userId: data.userId, points: data.reputationPoints }, "Reputation job queued");
};
