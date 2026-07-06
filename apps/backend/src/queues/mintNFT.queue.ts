import { mintNFTQueue } from "./index";
import { createLogger } from "../config/logger";

const logger = createLogger("mintNFT-queue");

export interface MintNFTJobData {
  attendanceRecordId: string;
  userId: string;
  eventId: string;
  attendeeWallet: string;
  assetName: string;
  assetUri: string;
  eventAccountPda: string;
  attendeeRecordPda: string;
  vaultPda: string | null;
}

export const addMintNFTJob = async (data: MintNFTJobData): Promise<void> => {
  await mintNFTQueue.add("mintNFT", data, {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: 100,
    removeOnFail: 50,
  });

  logger.info(
    { attendanceRecordId: data.attendanceRecordId },
    "MintNFT job queued"
  );
};
