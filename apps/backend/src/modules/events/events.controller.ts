import type { FastifyRequest, FastifyReply } from "fastify";
import { eventsService } from "./events.service";
import { createLogger } from "../../config/logger";
import type { CreateEventInput, UpdateEventInput } from "./events.types";

const logger = createLogger("events-controller");

export const eventsController = {
  // POST /events
  createEvent: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const organizerId = request.authUser?.userId;

      if (!organizerId) {
        return reply.status(401).send({
          error: "Unauthorized",
          message: "Authentication required",
        });
      }

      const input = request.body as CreateEventInput;

      if (!input.name || !input.symbol || !input.eventDate || !input.totalSupply) {
        return reply.status(400).send({
          error: "Bad Request",
          message: "name, symbol, eventDate and totalSupply are required",
        });
      }

      const event = await eventsService.createEvent(organizerId, input);

      return reply.status(201).send(event);
    } catch (err: any) {
      logger.error({ err }, "Failed to create event");
      return reply.status(500).send({
        error: "Internal Server Error",
        message: err.message || "Failed to create event",
      });
    }
  },

  // GET /events
  getAllEvents: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { page, limit } = request.query as {
        page?: string;
        limit?: string;
      };

      const result = await eventsService.getAllEvents(
        page ? parseInt(page) : 1,
        limit ? parseInt(limit) : 20
      );

      return reply.status(200).send(result);
    } catch (err: any) {
      logger.error({ err }, "Failed to fetch events");
      return reply.status(500).send({
        error: "Internal Server Error",
        message: "Failed to fetch events",
      });
    }
  },

  // GET /events/:id
  getEventById: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const event = await eventsService.getEventById(id);

      return reply.status(200).send(event);
    } catch (err: any) {
      logger.error({ err }, "Failed to fetch event");

      if (err.message === "Event not found") {
        return reply.status(404).send({
          error: "Not Found",
          message: "Event not found",
        });
      }

      return reply.status(500).send({
        error: "Internal Server Error",
        message: "Failed to fetch event",
      });
    }
  },

  // GET /events/my
  getMyEvents: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const organizerId = request.authUser?.userId;

      if (!organizerId) {
        return reply.status(401).send({
          error: "Unauthorized",
          message: "Authentication required",
        });
      }

      const events = await eventsService.getEventsByOrganizer(organizerId);

      return reply.status(200).send(events);
    } catch (err: any) {
      logger.error({ err }, "Failed to fetch organizer events");
      return reply.status(500).send({
        error: "Internal Server Error",
        message: "Failed to fetch events",
      });
    }
  },

  // PATCH /events/:id
  updateEvent: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const organizerId = request.authUser?.userId;
      const { id } = request.params as { id: string };
      const input = request.body as UpdateEventInput;

      if (!organizerId) {
        return reply.status(401).send({
          error: "Unauthorized",
          message: "Authentication required",
        });
      }

      const event = await eventsService.updateEvent(id, organizerId, input);

      return reply.status(200).send(event);
    } catch (err: any) {
      logger.error({ err }, "Failed to update event");

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
        message: err.message || "Failed to update event",
      });
    }
  },

  // PATCH /events/:id/handler
  setHandler: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const organizerId = request.authUser?.userId;
      const { id } = request.params as { id: string };
      const { handlerAddress } = request.body as { handlerAddress: string };

      if (!organizerId) {
        return reply.status(401).send({
          error: "Unauthorized",
          message: "Authentication required",
        });
      }

      if (!handlerAddress) {
        return reply.status(400).send({
          error: "Bad Request",
          message: "handlerAddress is required",
        });
      }

      const event = await eventsService.setHandler(id, organizerId, handlerAddress);

      return reply.status(200).send(event);
    } catch (err: any) {
      logger.error({ err }, "Failed to set handler");
      return reply.status(500).send({
        error: "Internal Server Error",
        message: err.message || "Failed to set handler",
      });
    }
  },

  // POST /events/:id/close
  closeEvent: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const organizerId = request.authUser?.userId;
      const { id } = request.params as { id: string };

      if (!organizerId) {
        return reply.status(401).send({
          error: "Unauthorized",
          message: "Authentication required",
        });
      }

      const event = await eventsService.closeEvent(id, organizerId);

      return reply.status(200).send(event);
    } catch (err: any) {
      logger.error({ err }, "Failed to close event");

      if (err.message.includes("Unauthorized")) {
        return reply.status(403).send({
          error: "Forbidden",
          message: err.message,
        });
      }

      return reply.status(500).send({
        error: "Internal Server Error",
        message: err.message || "Failed to close event",
      });
    }
  },
};
