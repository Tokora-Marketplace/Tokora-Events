export const CONSTANTS = {
  // Tokora Program
  PROGRAM_ID: "rCLbtzqQ3LW8rr69TMZuCqNacvE5ZK3DxdjBC2T8SYi",

  // Metaplex Core
  MPL_CORE_PROGRAM: "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d",

  // Solana System Programs
  SYSTEM_PROGRAM: "11111111111111111111111111111111",
  INSTRUCTION_SYSVAR: "Sysvar1nstructions1111111111111111111111111111",

  // Ticket Types
  TICKET_TYPE: {
    GENERAL: 0,
    VIP: 1,
    SPEAKER: 2,
  },

  // Reputation Points (mirrors contract values)
  REPUTATION_POINTS: {
    GENERAL: 10,
    VIP: 25,
    SPEAKER: 50,
  },

  // Event Modes
  EVENT_MODE: {
    WEB2: "web2",
    WEB3: "web3",
  },

  // Event Status
  EVENT_STATUS: {
    ACTIVE: "active",
    ENDED: "ended",
    CANCELLED: "cancelled",
  },

  // Attendee Status
  ATTENDEE_STATUS: {
    PENDING: "pending",
    APPROVED: "approved",
    REJECTED: "rejected",
  },

  // Mint cost recommendation from contract (in lamports)
  DEFAULT_COST_PER_MINT: 10000000, // 0.01 SOL
};
