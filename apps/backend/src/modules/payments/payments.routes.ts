import type { FastifyInstance } from "fastify";
import { paymentsService } from "./payments.service";
import { paymentsWebhook } from "./payments.webhook";
import { authenticate } from "../auth/auth.middleware";
import { createLogger } from "../../config/logger";
import type { RecordPaymentInput } from "./payments.types";
import type { FastifyRequest, FastifyReply } from "fastify";

const logger = createLogger("payments-routes");

export const paymentsRoutes = async (app: FastifyInstance): Promise<void> => {
  // ─────────────────────────────────────────
  // WEBHOOK — no auth, signature verified internally
  // ─────────────────────────────────────────
  app.post("/webhooks/helius", paymentsWebhook.handleHelius);

  // ─────────────────────────────────────────
  // PROTECTED ROUTES
  // ─────────────────────────────────────────

  // POST /payments/record — record confirmed on-chain payment
  app.post(
    "/payments/record",
    { preHandler: authenticate },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = request.authUser?.userId;

        if (!userId) {
          return reply.status(401).send({
            error: "Unauthorized",
            message: "Authentication required",
          });
        }

        const input = request.body as RecordPaymentInput;

        if (!input.eventId || !input.txSignature || !input.idempotencyKey) {
          return reply.status(400).send({
            error: "Bad Request",
            message: "eventId, txSignature and idempotencyKey are required",
          });
        }

        const transaction = await paymentsService.recordPayment(userId, input);

        return reply.status(201).send(transaction);
      } catch (err: any) {
        logger.error({ err }, "Failed to record payment");

        if (
          err.message === "Transaction not found on-chain — may not be confirmed yet" ||
          err.message === "Transaction failed on-chain"
        ) {
          return reply.status(400).send({
            error: "Bad Request",
            message: err.message,
          });
        }

        return reply.status(500).send({
          error: "Internal Server Error",
          message: err.message || "Failed to record payment",
        });
      }
    }
  ),

  // GET /payments — get user transactions
  app.get(
    "/payments",
    { preHandler: authenticate },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = request.authUser?.userId;

        if (!userId) {
          return reply.status(401).send({
            error: "Unauthorized",
            message: "Authentication required",
          });
        }

        const transactions = await paymentsService.getUserTransactions(userId);

        return reply.status(200).send(transactions);
      } catch (err: any) {
        logger.error({ err }, "Failed to fetch transactions");
        return reply.status(500).send({
          error: "Internal Server Error",
          message: "Failed to fetch transactions",
        });
      }
    }
  ),

  // GET /payments/:id — get single transaction
  app.get(
    "/payments/:id",
    { preHandler: authenticate },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = request.authUser?.userId;
        const { id } = request.params as { id: string };

        if (!userId) {
          return reply.status(401).send({
            error: "Unauthorized",
            message: "Authentication required",
          });
        }

        const transaction = await paymentsService.getTransactionById(id, userId);

        return reply.status(200).send(transaction);
      } catch (err: any) {
        logger.error({ err }, "Failed to fetch transaction");

        if (err.message === "Transaction not found") {
          return reply.status(404).send({
            error: "Not Found",
            message: "Transaction not found",
          });
        }

        return reply.status(500).send({
          error: "Internal Server Error",
          message: "Failed to fetch transaction",
        });
      }
    }
  ),

  // GET /events/:id/transactions — organizer view
  app.get(
    "/events/:id/transactions",
    { preHandler: authenticate },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const organizerId = request.authUser?.userId;
        const { id } = request.params as { id: string };

        if (!organizerId) {
          return reply.status(401).send({
            error: "Unauthorized",
            message: "Authentication required",
          });
        }

        const transactions = await paymentsService.getEventTransactions(
          id,
          organizerId
        );

        return reply.status(200).send(transactions);
      } catch (err: any) {
        logger.error({ err }, "Failed to fetch event transactions");

        if (err.message.includes("Unauthorized")) {
          return reply.status(403).send({
            error: "Forbidden",
            message: err.message,
          });
        }

        return reply.status(500).send({
          error: "Internal Server Error",
          message: "Failed to fetch transactions",
        });
      }
    }
  ),

  // POST /payments/verify — verify transaction on-chain
  app.post(
    "/payments/verify",
    { preHandler: authenticate },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { txSignature } = request.body as { txSignature: string };

        if (!txSignature) {
          return reply.status(400).send({
            error: "Bad Request",
            message: "txSignature is required",
          });
        }

        const result = await paymentsService.verifyTransaction(txSignature);

        return reply.status(200).send(result);
      } catch (err: any) {
        logger.error({ err }, "Failed to verify transaction");
        return reply.status(500).send({
          error: "Internal Server Error",
          message: "Failed to verify transaction",
        });
      }
    }
  );
};
