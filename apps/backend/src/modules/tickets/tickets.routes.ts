import type { FastifyInstance } from "fastify";
import { ticketsController } from "./tickets.controller";
import { authenticate } from "../auth/auth.middleware";

export const ticketsRoutes = async (app: FastifyInstance): Promise<void> => {
  // All ticket routes require authentication
  app.post("/tickets", { preHandler: authenticate }, ticketsController.purchaseTicket);
  app.get("/tickets", { preHandler: authenticate }, ticketsController.getUserTickets);
  app.get("/tickets/:id", { preHandler: authenticate }, ticketsController.getTicketById);

  // Event attendees — organizer only
  app.get(
    "/events/:id/attendees",
    { preHandler: authenticate },
    ticketsController.getEventAttendees
  );
};
