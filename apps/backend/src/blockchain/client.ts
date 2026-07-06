import { Connection, PublicKey } from "@solana/web3.js";
import { AnchorProvider, Program, setProvider } from "@coral-xyz/anchor";
import { env } from "../config/env";
import { createLogger } from "../config/logger";
import idl from "./idl/tokora.json";

const logger = createLogger("blockchain-client");

// Program ID from deployed contract
export const PROGRAM_ID = new PublicKey(env.PROGRAM_ID);

// Solana RPC connection via Helius
export const connection = new Connection(env.SOLANA_RPC_URL, {
  commitment: "confirmed",
});

// Read-only provider for fetching on-chain data
// No wallet needed for reads
export const getReadonlyProvider = (): AnchorProvider => {
  const provider = new AnchorProvider(
    connection,
    {
      publicKey: PublicKey.default,
      signTransaction: async (tx) => tx,
      signAllTransactions: async (txs) => txs,
    },
    { commitment: "confirmed" }
  );
  setProvider(provider);
  return provider;
};

// Get the Anchor program instance
export const getProgram = () => {
  const provider = getReadonlyProvider();
  return new Program(idl as any, provider);
};

// Test RPC connection
export const testConnection = async (): Promise<void> => {
  try {
    const slot = await connection.getSlot();
    logger.info({ slot }, "Solana RPC connected");
  } catch (err) {
    logger.error({ err }, "Solana RPC connection failed");
    throw err;
  }
};
