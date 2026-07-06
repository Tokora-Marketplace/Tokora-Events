import type { FastifyRequest, FastifyReply } from "fastify";
import { attendanceService } from "./attendance.service";
import { createLogger } from "../../config/logger";
import type { QRScanInput } from "./attendance.types";

const logger = createLogger("attendance-controller");

export const attendanceController = {
  // POST /attendance/load/:eventId
  // Called by organizer to load event tickets into Redis before scanning starts
  loadEvent: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const organizerId = request.authUser?.userId;
      const { eventId } = request.params as { eventId: string };

      if (!organizerId) {
        return reply.status(401).send({
          error: "Unauthorized",
          message: "Authentication required",
        });
      }

      await attendanceService.loadEventIntoCache(eventId);

      return reply.status(200).send({
        message: "Event tickets loaded into scanner cache successfully",
      });
    } catch (err: any) {
      logger.error({ err }, "Failed to load event into cache");
      return reply.status(500).send({
        error: "Internal Server Error",
        message: err.message || "Failed to load event",
      });
    }
  },

  // POST /attendance/scan
  // Called by handler device when scanning QR code at venue
  scanQR: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const input = request.body as QRScanInput;

      if (!input.eventId || !input.ticketId || !input.qrMessage || !input.qrSignature) {
        return reply.status(400).send({
          error: "Bad Request",
          message: "eventId, ticketId, qrMessage and qrSignature are required",
        });
      }

      // Validate QR scan via Redis cache
      const validation = await attendanceService.validateQRScan(input);

      if (!validation.valid) {
        return reply.status(400).send({
          error: "Invalid Scan",
          message: validation.reason,
        });
      }

      const attendeeRecord = validation.attendeeRecord;

      // Record attendance in database
      const attendanceRecord = await attendanceService.recordAttendance(
        attendeeRecord.id,
        attendeeRecord.eventId,
        attendeeRecord.userId
      );

      logger.info(
        { ticketId: input.ticketId, eventId: input.eventId },
        "Attendance recorded via QR scan"
      );

      return reply.status(200).send({
        message: "Attendance verified successfully",
        attendanceRecord,
        attendee: {
          name: attendeeRecord.user.name,
          email: attendeeRecord.user.email,
          ticketType: attendeeRecord.ticketType,
          walletAddress: attendeeRecord.user.walletAddress,
        },
        event: {
          name: attendeeRecord.event.name,
          mode: attendeeRecord.event.mode,
        },
      });
    } catch (err: any) {
      logger.error({ err }, "QR scan failed");
      return reply.status(500).send({
        error: "Internal Server Error",
        message: err.message || "QR scan failed",
      });
    }
  },

  // GET /attendance/history
  // Get user's full attendance history
  getHistory: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.authUser?.userId;

      if (!userId) {
        return reply.status(401).send({
          error: "Unauthorized",
          message: "Authentication required",
        });
      }

      const history = await attendanceService.getUserAttendanceHistory(userId);

      return reply.status(200).send(history);
    } catch (err: any) {
      logger.error({ err }, "Failed to fetch attendance history");
      return reply.status(500).send({
        error: "Internal Server Error",
        message: "Failed to fetch attendance history",
      });
    }
  },

  // GET /attendance/:eventId
  // Get user's attendance record for a specific event
  getAttendanceRecord: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.authUser?.userId;
      const { eventId } = request.params as { eventId: string };

      if (!userId) {
        return reply.status(401).send({
          error: "Unauthorized",
          message: "Authentication required",
        });
      }

      const record = await attendanceService.getAttendanceRecord(userId, eventId);

      if (!record) {
        return reply.status(404).send({
          error: "Not Found",
          message: "Attendance record not found",
        });
      }

      return reply.status(200).send(record);
    } catch (err: any) {
      logger.error({ err }, "Failed to fetch attendance record");
      return reply.status(500).send({
        error: "Internal Server Error",
        message: "Failed to fetch attendance record",
      });
    }
  },

  // GET /events/:id/attendances
  // Get all verified attendances for an event (organizer only)
  getEventAttendances: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const organizerId = request.authUser?.userId;
      const { id } = request.params as { id: string };

      if (!organizerId) {
        return reply.status(401).send({
          error: "Unauthorized",
          message: "Authentication required",
        });
      }

      const attendances = await attendanceService.getEventAttendances(
        id,
        organizerId
      );

      return reply.status(200).send(attendances);
    } catch (err: any) {
      logger.error({ err }, "Failed to fetch event attendances");

      if (err.message.includes("Unauthorized")) {
        return reply.status(403).send({
          error: "Forbidden",
          message: err.message,
        });
      }

      return reply.status(500).send({
        error: "Internal Server Error",
        message: "Failed to fetch attendances",
      });
    }
  },
};
