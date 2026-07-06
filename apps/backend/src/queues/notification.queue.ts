import { notificationQueue } from "./index";
import { createLogger } from "../config/logger";

const logger = createLogger("notification-queue");

export interface NotificationJobData {
  userId: string;
  type: "TICKET_PURCHASED" | "ATTENDANCE_VERIFIED" | "NFT_MINTED" | "GIVEAWAY_WON";
  payload: Record<string, any>;
}

export const addNotificationJob = async (
  data: NotificationJobData
): Promise<void> => {
  await notificationQueue.add("sendNotification", data, {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: 100,
    removeOnFail: 50,
  });

  logger.info({ userId: data.userId, type: data.type }, "Notification job queued");
};
