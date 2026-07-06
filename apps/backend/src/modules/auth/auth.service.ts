import { prisma } from "../../db/prisma";
import { redis } from "../../cache/redis";
import { sessionCache } from "../../cache/session.cache";
import { createLogger } from "../../config/logger";
import { env } from "../../config/env";
import { SignJWT, jwtVerify } from "jose";
import { v4 as uuidv4 } from "uuid";
import { Keypair } from "@solana/web3.js";
import type {
  GoogleUser,
  JwtPayload,
  TokenPair,
  AuthResponse,
} from "./auth.types";

const logger = createLogger("auth-service");

const JWT_SECRET = new TextEncoder().encode(env.JWT_SECRET);

export const authService = {
  // Find or create user from Google OAuth data
  findOrCreateUser: async (googleUser: GoogleUser) => {
    logger.debug({ email: googleUser.email }, "Finding or creating user");

    let user = await prisma.user.findUnique({
      where: { email: googleUser.email },
    });

    if (!user) {
      // Generate embedded wallet for new user
      const wallet = Keypair.generate();
      const walletAddress = wallet.publicKey.toBase58();

      // In production: encrypt and store private key in vault
      // For now: log warning that key management is needed
      logger.warn(
        { walletAddress },
        "New wallet generated — private key management required for production"
      );

      user = await prisma.user.create({
        data: {
          email: googleUser.email,
          name: googleUser.name,
          avatar: googleUser.avatar,
          walletAddress,
          walletType: "embedded",
          isVerified: true,
        },
      });

      // Create reputation record for new user
      await prisma.reputation.create({
        data: { userId: user.id },
      });

      logger.info({ userId: user.id }, "New user created with embedded wallet");
    }

    return user;
  },

  // Generate access + refresh token pair
  generateTokens: async (user: {
    id: string;
    email: string;
    role: string;
    walletAddress: string | null;
  }): Promise<TokenPair> => {
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      walletAddress: user.walletAddress,
    };

    // Access token — short lived
    const accessToken = await new SignJWT(payload)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(env.JWT_EXPIRES_IN)
      .sign(JWT_SECRET);

    // Refresh token — long lived, stored in Redis
    const refreshToken = uuidv4();

    await sessionCache.set(refreshToken, {
      userId: user.id,
      email: user.email,
      role: user.role as "attendee" | "organizer" | "admin",
      walletAddress: user.walletAddress || "",
      createdAt: Date.now(),
    });

    logger.debug({ userId: user.id }, "Token pair generated");

    return { accessToken, refreshToken };
  },

  // Verify access token
  verifyAccessToken: async (token: string): Promise<JwtPayload> => {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JwtPayload;
  },

  // Refresh token rotation
  refreshTokens: async (refreshToken: string): Promise<TokenPair> => {
    const session = await sessionCache.get(refreshToken);

    if (!session) {
      throw new Error("Invalid or expired refresh token");
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Generate new token pair
    const newTokens = await authService.generateTokens(user);

    // Rotate refresh token — invalidate old, store new
    await sessionCache.rotate(refreshToken, newTokens.refreshToken, {
      userId: user.id,
      email: user.email,
      role: user.role as "attendee" | "organizer" | "admin",
      walletAddress: user.walletAddress || "",
      createdAt: Date.now(),
    });

    logger.info({ userId: user.id }, "Tokens refreshed");

    return newTokens;
  },

  // Logout — delete session
  logout: async (refreshToken: string): Promise<void> => {
    await sessionCache.delete(refreshToken);
    logger.info("User logged out");
  },

  // Build auth response
  buildAuthResponse: async (user: {
    id: string;
    email: string;
    name: string | null;
    avatar: string | null;
    walletAddress: string | null;
    role: string;
  }): Promise<AuthResponse> => {
    const tokens = await authService.generateTokens(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        walletAddress: user.walletAddress,
        role: user.role,
      },
      tokens,
    };
  },
};
