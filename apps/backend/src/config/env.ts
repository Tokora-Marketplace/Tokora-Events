import dotenv from "dotenv";

dotenv.config();

const required = [
  "DATABASE_URL",
  "REDIS_URL",
  "JWT_SECRET",
  "SOLANA_RPC_URL",
  "PROGRAM_ID",
  "MPL_CORE_PROGRAM",
  "HELIUS_API_KEY",
  "HELIUS_WEBHOOK_SECRET",
  "FLUTTERWAVE_SECRET_KEY",
  "FLUTTERWAVE_WEBHOOK_SECRET",
];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const env = {
  // Database
  DATABASE_URL: process.env.DATABASE_URL!,

  // Redis
  REDIS_URL: process.env.REDIS_URL!,

  // Auth
  JWT_SECRET: process.env.JWT_SECRET!,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "15m",
  REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",

  // Solana
  SOLANA_NETWORK: process.env.SOLANA_NETWORK || "devnet",
  SOLANA_RPC_URL: process.env.SOLANA_RPC_URL!,
  PROGRAM_ID: process.env.PROGRAM_ID!,

  // Metaplex
  MPL_CORE_PROGRAM: process.env.MPL_CORE_PROGRAM!,

  // Helius
  HELIUS_API_KEY: process.env.HELIUS_API_KEY!,
  HELIUS_WEBHOOK_SECRET: process.env.HELIUS_WEBHOOK_SECRET!,

  // Payment
  FLUTTERWAVE_SECRET_KEY: process.env.FLUTTERWAVE_SECRET_KEY!,
  FLUTTERWAVE_WEBHOOK_SECRET: process.env.FLUTTERWAVE_WEBHOOK_SECRET!,

  // App
  PORT: parseInt(process.env.PORT || "3000"),
  NODE_ENV: process.env.NODE_ENV || "development",
  IS_PRODUCTION: process.env.NODE_ENV === "production",
};
