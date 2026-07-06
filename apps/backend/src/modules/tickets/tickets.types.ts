export interface PurchaseTicketInput {
  eventId: string;
  ticketType: 0 | 1 | 2;
  idempotencyKey: string;
}

export interface TicketResponse {
  id: string;
  eventId: string;
  ticketType: string;
  amountPaid: string;
  status: string;
  attendeeRecordPda: string | null;
  registeredAt: string;
  event: {
    id: string;
    name: string;
    eventDate: string;
    location: string | null;
    mode: string;
  };
}
