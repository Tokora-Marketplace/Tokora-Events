import { createLogger } from "../config/logger";

const logger = createLogger("blockchain-errors");

// Maps Anchor error codes from the contract to readable messages
const CONTRACT_ERRORS: Record<string, string> = {
  EventNotActive: "This event is no longer active.",
  CapacityReached: "This event has reached maximum capacity.",
  AlreadyRegistered: "This wallet is already registered for this event.",
  AlreadyAttended: "Attendance has already been recorded for this wallet.",
  UnauthorizedHandler: "This wallet is not authorized to scan tickets for this event.",
  InsufficientVaultBalance: "The organizer has not deposited enough SOL to cover attendance verification. Contact the event organizer.",
  InvalidQRSignature: "QR code signature verification failed. The code may be invalid or tampered with.",
  MintingNotEnabled: "NFT minting is not enabled for this event.",
  NameTooLong: "Event name exceeds the maximum allowed length of 100 characters.",
  UriTooLong: "Metadata URI exceeds the maximum allowed length of 200 characters.",
  InvalidTicketPrice: "The ticket price provided is invalid.",
  UnauthorizedOrganizer: "This wallet is not the organizer of this event.",
  EventAlreadyEnded: "This event has already ended.",
  VaultAlreadyFunded: "The vault for this event has already been funded.",
};

export class BlockchainError extends Error {
  public readonly code: string;
  public readonly userMessage: string;

  constructor(code: string, userMessage: string) {
    super(userMessage);
    this.name = "BlockchainError";
    this.code = code;
    this.userMessage = userMessage;
  }
}

// Parses an Anchor error and returns a clean BlockchainError
export const parseContractError = (err: unknown): BlockchainError => {
  const errorString = String(err);

  for (const [code, message] of Object.entries(CONTRACT_ERRORS)) {
    if (errorString.includes(code)) {
      logger.warn({ code }, "Contract error caught");
      return new BlockchainError(code, message);
    }
  }

  // Unknown error — log full error for debugging
  logger.error({ err }, "Unknown blockchain error");
  return new BlockchainError(
    "UnknownError",
    "An unexpected blockchain error occurred. Please try again."
  );
};

// Check if an error is a specific contract error
export const isContractError = (err: unknown, code: string): boolean => {
  return String(err).includes(code);
};
