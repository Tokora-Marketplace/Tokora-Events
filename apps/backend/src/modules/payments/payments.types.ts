export interface RecordPaymentInput {
  eventId: string;
  ticketType: 0 | 1 | 2;
  txSignature: string;
  idempotencyKey: string;
}

export interface PaymentStatusResponse {
  id: string;
  status: string;
  amountLamports: string;
  txSignature: string | null;
  type: string;
  createdAt: string;
}
