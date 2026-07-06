import type { FastifyRequest, FastifyReply } from "fastify";
import { ticketsService } from "./tickets.service";
import { createLogger } from "../../config/logger";
import type { PurchaseTicketInput } from "./tickets.types";

const logger = createLogger("tickets-controller");

export const ticketsController = {
  // POST /tickets
  purchaseTicket: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.authUser?.userId;

      if (!userId) {
        return reply.status(401).send({
          error: "Unauthorized",
          message: "Authentication required",
        });
      }

      const input = request.body as PurchaseTicketInput;

      if (!input.eventId || input.ticketType === undefined || !input.idempotencyKey) {
        return reply.status(400).send({
          error: "Bad Request",
          message: "eventId, ticketType and idempotencyKey are required",
        });
      }

      if (![0, 1, 2].includes(input.ticketType)) {
        return reply.status(400).send({
          error: "Bad Request",
          message: "ticketType must be 0 (General), 1 (VIP), or 2 (Speaker)",
        });
      }

      const ticket = await ticketsService.purchaseTicket(userId, input);

      return reply.status(201).send(ticket);
    } catch (err: any) {
      logger.error({ err }, "Failed to purchase ticket");

      if (
        err.message === "Event not found" ||
        err.message === "Event is not active" ||
        err.message === "Event is at full capacity" ||
        err.message === "You are already registered for this event"
      ) {
        return reply.status(400).send({
          error: "Bad Request",
          message: err.message,
        });
      }

      return reply.status(500).send({
        error: "Internal Server Error",
        message: err.message || "Failed to purchase ticket",
      });
    }
  },

  // GET /tickets
  getUserTickets: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.authUser?.userId;

      if (!userId) {
        return reply.status(401).send({
          error: "Unauthorized",
          message: "Authentication required",
        });
      }

      const tickets = await ticketsService.getUserTickets(userId);

      return reply.status(200).send(tickets);
    } catch (err: any) {
      logger.error({ err }, "Failed to fetch tickets");
      return reply.status(500).send({
        error: "Internal Server Error",
        message: "Failed to fetch tickets",
      });
    }
  },

  // GET /tickets/:id
  getTicketById: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.authUser?.userId;
      const { id } = request.params as { id: string };

      if (!userId) {
        return reply.status(401).send({
          error: "Unauthorized",
          message: "Authentication required",
        });
      }

      const ticket = await ticketsService.getTicketById(id, userId);

      return reply.status(200).send(ticket);
    } catch (err: any) {
      logger.error({ err }, "Failed to fetch ticket");

      if (err.message === "Ticket not found") {
        return reply.status(404).send({
          error: "Not Found",
          message: "Ticket not found",
        });
      }

      if (err.message.includes("Unauthorized")) {
        return reply.status(403).send({
          error: "Forbidden",
          message: err.message,
        });
      }

      return reply.status(500).send({
        error: "Internal Server Error",
        message: "Failed to fetch ticket",
      });
    }
  },

  // GET /events/:id/attendees
  getEventAttendees: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const organizerId = request.authUser?.userId;
      const { id } = request.params as { id: string };

      if (!organizerId) {
        return reply.status(401).send({
          error: "Unauthorized",
          message: "Authentication required",
        });
      }

      const attendees = await ticketsService.getEventAttendees(id, organizerId);

      return reply.status(200).send(attendees);
    } catch (err: any) {
      logger.error({ err }, "Failed to fetch attendees");

      if (err.message === "Event not found") {
        return reply.status(404).send({
          error: "Not Found",
          message: "Event not found",
        });
      }

      if (err.message.includes("Unauthorized")) {
        return reply.status(403).send({
          error: "Forbidden",
          message: err.message,
        });
      }

      return reply.status(500).send({
        error: "Internal Server Error",
        message: "Failed to fetch attendees",
      });
    }
  },
};
