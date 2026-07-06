import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { PROGRAM_ID } from "./client";

export const pdas = {
  // Derives the EventAccount PDA
  eventAccount: (
    organizerPublicKey: PublicKey,
    eventId: bigint
  ): PublicKey => {
    const [pda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("event"),
        organizerPublicKey.toBuffer(),
        new BN(eventId.toString()).toArrayLike(Buffer, "le", 8),
      ],
      PROGRAM_ID
    );
    return pda;
  },

  // Derives the AttendeeRecord PDA
  attendeeRecord: (
    attendeePublicKey: PublicKey,
    eventAccountPda: PublicKey
  ): PublicKey => {
    const [pda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("attendee"),
        attendeePublicKey.toBuffer(),
        eventAccountPda.toBuffer(),
      ],
      PROGRAM_ID
    );
    return pda;
  },

  // Derives the AttendanceRecord PDA
  attendanceRecord: (
    attendeePublicKey: PublicKey,
    eventAccountPda: PublicKey
  ): PublicKey => {
    const [pda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("attendance"),
        attendeePublicKey.toBuffer(),
        eventAccountPda.toBuffer(),
      ],
      PROGRAM_ID
    );
    return pda;
  },

  // Derives the OrganizerVault PDA
  organizerVault: (eventAccountPda: PublicKey): PublicKey => {
    const [pda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("vault"),
        eventAccountPda.toBuffer(),
      ],
      PROGRAM_ID
    );
    return pda;
  },
};
