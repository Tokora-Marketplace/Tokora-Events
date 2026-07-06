export interface CreateEventInput {
  name: string;
  description?: string;
  symbol: string;
  ticketPrice: number;
  totalSupply: number;
  eventDate: string;
  location?: string;
  mode: "WEB2" | "WEB3";
  costPerMint?: number;
}

export interface UpdateEventInput {
  name?: string;
  description?: string;
  location?: string;
  bannerImage?: string;
}

export interface EventResponse {
  id: string;
  eventId: string;
  name: string;
  description: string | null;
  symbol: string;
  ticketPrice: string;
  totalSupply: number;
  ticketsSold: number;
  ticketsVerified: number;
  mode: string;
  status: string;
  eventDate: string;
  location: string | null;
  bannerImage: string | null;
  handlerAddress: string | null;
  eventAccountPda: string | null;
  organizer: {
    id: string;
    name: string | null;
    walletAddress: string | null;
  };
  createdAt: string;
}
