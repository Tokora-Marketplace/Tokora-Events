import type { FastifyInstance } from "fastify";
import { eventsController } from "./events.controller";
import { authenticate } from "../auth/auth.middleware";

export const eventsRoutes = async (app: FastifyInstance): Promise<void> => {
  // PUBLIC
  app.get("/events", eventsController.getAllEvents);
  app.get("/events/:id", eventsController.getEventById);

  // PROTECTED
  app.get("/events/my", { preHandler: authenticate }, eventsController.getMyEvents);
  app.post("/events", { preHandler: authenticate }, eventsController.createEvent);
  app.patch("/events/:id", { preHandler: authenticate }, eventsController.updateEvent);
  app.patch("/events/:id/handler", { preHandler: authenticate }, eventsController.setHandler);
  app.post("/events/:id/close", { preHandler: authenticate }, eventsController.closeEvent);
};
