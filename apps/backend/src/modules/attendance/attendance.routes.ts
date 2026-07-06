import type { FastifyInstance } from "fastify";
import { attendanceController } from "./attendance.controller";
import { authenticate } from "../auth/auth.middleware";

export const attendanceRoutes = async (app: FastifyInstance): Promise<void> => {
  // Load event tickets into scanner cache — organizer only
  app.post(
    "/attendance/load/:eventId",
    { preHandler: authenticate },
    attendanceController.loadEvent
  );

  // QR scan endpoint — called by handler device at venue
  // No auth required — handler device uses its own signing key
  app.post("/attendance/scan", attendanceController.scanQR);

  // Get user attendance history — protected
  app.get(
    "/attendance/history",
    { preHandler: authenticate },
    attendanceController.getHistory
  );

  // Get attendance record for specific event — protected
  app.get(
    "/attendance/:eventId",
    { preHandler: authenticate },
    attendanceController.getAttendanceRecord
  );

  // Get all attendances for an event — organizer only
  app.get(
    "/events/:id/attendances",
    { preHandler: authenticate },
    attendanceController.getEventAttendances
  );
};
