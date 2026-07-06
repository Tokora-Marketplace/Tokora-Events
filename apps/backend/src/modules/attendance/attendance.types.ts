export interface VerifyAttendanceInput {
  eventId: string;
  attendeeWallet: string;
  qrMessage: string;
  qrSignature: string;
  assetName: string;
  assetUri: string;
}

export interface QRScanInput {
  eventId: string;
  ticketId: string;
  qrMessage: string;
  qrSignature: string;
}

export interface AttendanceResponse {
  id: string;
  userId: string;
  eventId: string;
  verified: boolean;
  verifiedAt: string | null;
  nftMinted: boolean;
  nftMintAddress: string | null;
  reputationPoints: number;
}
