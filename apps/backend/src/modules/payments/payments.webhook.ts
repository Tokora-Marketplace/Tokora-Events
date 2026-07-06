import type { FastifyRequest, FastifyReply } from "fastify";
import { paymentsService } from "./payments.service";
import { createLogger } from "../../config/logger";
import { env } from "../../config/env";
import crypto from "crypto";

const logger = createLogger("payments-webhook");

// Verify Helius webhook signature
const verifyHeliusSignature = (
  payload: string,
  signature: string
): boolean => {
  const expectedSignature = crypto
    .createHmac("sha256", env.HELIUS_WEBHOOK_SECRET)
    .update(payload)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
};

export const paymentsWebhook = {
  // POST /webhooks/helius
  // Helius sends this when verify_attendance transaction confirms on-chain
  handleHelius: async (request: FastifyRequest, reply: FastifyReply) => {
    // Step 1 — verify signature before reading payload
    const signature = request.headers["helius-signature"] as string;

    if (!signature) {
      logger.warn("Helius webhook received without signature");
      return reply.status(401).send({ error: "Missing signature" });
    }

    const rawBody = JSON.stringify(request.body);
    const isValid = verifyHeliusSignature(rawBody, signature);

    if (!isValid) {
      logger.warn("Helius webhook signature verification failed");
      return reply.status(401).send({ error: "Invalid signature" });
    }

    // Step 2 — parse and log
    const payload = request.body as any[];

    logger.info(
      { count: payload?.length },
      "Helius webhook received and verified"
    );

    // Step 3 — process each transaction event
    try {
      for (const event of payload) {
        const txSignature = event?.signature;
        const txType = event?.type;

        logger.info({ txSignature, txType }, "Processing Helius transaction event");

        // Further processing will be handled by job queues
        // For now log and acknowledge
      }

      // Always return 200 immediately
      return reply.status(200).send({ received: true });
    } catch (err) {
      logger.error({ err }, "Helius webhook processing error");
      return reply.status(200).send({ received: true });
    }
  },
};
