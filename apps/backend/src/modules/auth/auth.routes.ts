import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../db/prisma";
import { authService } from "./auth.service";
import { authenticate } from "./auth.middleware";
import { createLogger } from "../../config/logger";

const logger = createLogger("auth-routes");

export const authRoutes = async (app: FastifyInstance): Promise<void> => {
  // ─────────────────────────────────────────
  // GOOGLE OAUTH — Initiate login
  // GET /auth/google
  // ─────────────────────────────────────────
  app.get("/auth/google", async (request: FastifyRequest, reply: FastifyReply) => {
    const googleAuthUrl = new URL(
      "https://accounts.google.com/o/oauth2/v2/auth"
    );
    googleAuthUrl.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID || "");
    googleAuthUrl.searchParams.set(
      "redirect_uri",
      process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/auth/google/callback"
    );
    googleAuthUrl.searchParams.set("response_type", "code");
    googleAuthUrl.searchParams.set("scope", "openid email profile");
    googleAuthUrl.searchParams.set("access_type", "offline");

    return reply.redirect(googleAuthUrl.toString());
  });

  // ─────────────────────────────────────────
  // GOOGLE OAUTH — Callback
  // GET /auth/google/callback
  // ─────────────────────────────────────────
  app.get("/auth/google/callback", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { code } = request.query as { code: string };

      if (!code) {
        return reply.status(400).send({
          error: "Bad Request",
          message: "Authorization code missing",
        });
      }

      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: process.env.GOOGLE_CLIENT_ID || "",
          client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
          redirect_uri:
            process.env.GOOGLE_REDIRECT_URI ||
            "http://localhost:3000/auth/google/callback",
          grant_type: "authorization_code",
        }),
      });

      const googleTokens = (await tokenResponse.json()) as any;

      if (!googleTokens.access_token) {
        logger.error({ googleTokens }, "Failed to get Google access token");
        return reply.status(400).send({
          error: "Bad Request",
          message: "Failed to authenticate with Google",
        });
      }

      const profileResponse = await fetch(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        {
          headers: { Authorization: `Bearer ${googleTokens.access_token}` },
        }
      );

      const googleUser = (await profileResponse.json()) as any;

      const user = await authService.findOrCreateUser({
        id: googleUser.id,
        email: googleUser.email,
        name: googleUser.name,
        avatar: googleUser.picture,
      });

      const authResponse = await authService.buildAuthResponse(user);

      logger.info({ userId: user.id }, "User authenticated via Google");

      return reply.status(200).send(authResponse);
    } catch (err) {
      logger.error({ err }, "Google OAuth callback failed");
      return reply.status(500).send({
        error: "Internal Server Error",
        message: "Authentication failed",
      });
    }
  });

  // ─────────────────────────────────────────
  // REFRESH TOKENS
  // POST /auth/refresh
  // ─────────────────────────────────────────
  app.post("/auth/refresh", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { refreshToken } = request.body as { refreshToken: string };

      if (!refreshToken) {
        return reply.status(400).send({
          error: "Bad Request",
          message: "Refresh token required",
        });
      }

      const tokens = await authService.refreshTokens(refreshToken);

      return reply.status(200).send(tokens);
    } catch (err) {
      logger.warn({ err }, "Token refresh failed");
      return reply.status(401).send({
        error: "Unauthorized",
        message: "Invalid or expired refresh token",
      });
    }
  });

  // ─────────────────────────────────────────
  // LOGOUT
  // POST /auth/logout
  // ─────────────────────────────────────────
  app.post(
    "/auth/logout",
    { preHandler: authenticate },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { refreshToken } = request.body as { refreshToken: string };

        if (refreshToken) {
          await authService.logout(refreshToken);
        }

        return reply.status(200).send({
          message: "Logged out successfully",
        });
      } catch (err) {
        logger.error({ err }, "Logout failed");
        return reply.status(500).send({
          error: "Internal Server Error",
          message: "Logout failed",
        });
      }
    }
  );

  // ─────────────────────────────────────────
  // GET CURRENT USER
  // GET /auth/me
  // ─────────────────────────────────────────
  app.get(
    "/auth/me",
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

        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
            walletAddress: true,
            role: true,
            isVerified: true,
            createdAt: true,
            reputation: {
              select: {
                totalPoints: true,
                eventsAttended: true,
                eventsOrganized: true,
                avgRating: true,
              },
            },
          },
        });

        if (!user) {
          return reply.status(404).send({
            error: "Not Found",
            message: "User not found",
          });
        }

        return reply.status(200).send(user);
      } catch (err) {
        logger.error({ err }, "Failed to fetch current user");
        return reply.status(500).send({
          error: "Internal Server Error",
          message: "Failed to fetch user",
        });
      }
    }
  );
};
