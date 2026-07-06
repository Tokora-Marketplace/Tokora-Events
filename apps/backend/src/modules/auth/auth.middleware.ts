import type { FastifyRequest, FastifyReply } from "fastify";
import { authService } from "./auth.service";
import { createLogger } from "../../config/logger";

const logger = createLogger("auth-middleware");

export interface AuthUser {
  userId: string;
  email: string;
  role: string;
  walletAddress: string | null;
}

// Extend FastifyRequest to include user
declare module "fastify" {
  interface FastifyRequest {
    authUser?: AuthUser;
  }
}

// Verify JWT on every protected request
export const authenticate = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  try {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return reply.status(401).send({
        error: "Unauthorized",
        message: "Missing or invalid authorization header",
      });
    }

    const token = authHeader.split(" ")[1];
    const payload = await authService.verifyAccessToken(token);

    request.authUser = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      walletAddress: payload.walletAddress,
    };

    logger.debug({ userId: payload.userId }, "Request authenticated");
  } catch (err) {
    logger.warn({ err }, "Authentication failed");
    return reply.status(401).send({
      error: "Unauthorized",
      message: "Invalid or expired token",
    });
  }
};

// Role guard
export const requireRole = (roles: string[]) => {
  return async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> => {
    if (!request.authUser) {
      return reply.status(401).send({
        error: "Unauthorized",
        message: "Authentication required",
      });
    }

    if (!roles.includes(request.authUser.role)) {
      logger.warn(
        { userId: request.authUser.userId, role: request.authUser.role, required: roles },
        "Access denied — insufficient role"
      );
      return reply.status(403).send({
        error: "Forbidden",
        message: "You do not have permission to access this resource",
      });
    }
  };
};
