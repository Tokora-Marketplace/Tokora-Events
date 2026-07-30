"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface AttendanceNFT {
  id: string;
  eventTitle: string;
  imageUrl?: string;
  verified: boolean;
  ticketId: string;
}

interface ConnectedWallet {
  address: string;
  shortAddress: string;
  type: string;
  active: boolean;
}

interface UserProfile {
  id: string;
  displayName: string;
  username: string;
  location: string;
  avatarUrl?: string;
  badges: string[]; // e.g. ["Web3 Builder", "Top Attendee"]
  eventsAttended: number;
  rating: number;
  eventsOrganized: number;
  nfts: AttendanceNFT[];
  wallet: ConnectedWallet | null;
}

// ─── Mock data (replace with real API) ────────────────────────────────────────

const MOCK_PROFILE: UserProfile = {
  id: "u1",
  displayName: "Godknows Ukari",
  username: "godknowsukari",
  location: "Port Harcourt, NG",
  badges: ["Web3 Builder", "Top Attendee"],
  eventsAttended: 24,
  rating: 4.9,
  eventsOrganized: 3,
  nfts: [
    {
      id: "n1",
      eventTitle: "Web3 Lagos Summit",
      verified: true,
      ticketId: "tk_8821",
    },
    {
      id: "n2",
      eventTitle: "Afrobeats Underground Night",
      verified: true,
      ticketId: "tk_8822",
    },
    {
      id: "n3",
      eventTitle: "Founders & Funders",
      verified: true,
      ticketId: "tk_8823",
    },
  ],
  wallet: {
    address: "0x3a4f7c2d9e1b5a8f3c2d9e1b5a8f3c2d",
    shortAddress: "0x3a4f...7c2d",
    type: "Embedded Wallet",
    active: true,
  },
};

// ─── API hook ──────────────────────────────────────────────────────────────────

function useProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    // ── Replace with your real API call ──────────────────────────────────────
    // fetch("/api/profile")
    //   .then(r => { if (!r.ok) throw new Error(r.statusText); return r.json(); })
    //   .then(data => { if (!cancelled) setProfile(data); })
    //   .catch(e => { if (!cancelled) setError("Failed to load profile."); })
    //   .finally(() => { if (!cancelled) setLoading(false); });
    // return () => { cancelled = true; };
    // ──────────────────────────────────────────────────────────────────────────

    const timer = setTimeout(() => {
      if (cancelled) return;
      setProfile(MOCK_PROFILE);
      setLoading(false);
    }, 500);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => fetchProfile(), [fetchProfile]);

  return { profile, loading, error, refetch: fetchProfile };
}

// Skeleton

function ProfileSkeleton() {
  return (
    <div className="px-4 pt-12 space-y-6">
      {/* Avatar + info */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-[#1e1e1e] animate-pulse shrink-0" />
        <div className="space-y-2 flex-1">
          <div className="h-4 w-36 bg-[#1e1e1e] rounded-full animate-pulse" />
          <div className="h-3 w-28 bg-[#1e1e1e] rounded-full animate-pulse" />
          <div className="flex gap-2 mt-1">
            <div className="h-5 w-20 bg-[#1e1e1e] rounded-full animate-pulse" />
            <div className="h-5 w-24 bg-[#1e1e1e] rounded-full animate-pulse" />
          </div>
        </div>
      </div>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="bg-[#1e1e1e] rounded-2xl h-20 animate-pulse"
          />
        ))}
      </div>
      {/* NFTs */}
      <div className="space-y-3">
        <div className="h-4 w-32 bg-[#1e1e1e] rounded-full animate-pulse" />
        <div className="flex gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="shrink-0 w-25 h-22.5">
              <div className="w-full h-full bg-[#1e1e1e] rounded-2xl animate-pulse" />
              <div className="h-3 w-16 bg-[#1e1e1e] rounded-full animate-pulse mt-2" />
            </div>
          ))}
        </div>
      </div>
      {/* Wallet */}
      <div className="h-20 bg-[#1e1e1e] rounded-2xl animate-pulse" />
    </div>
  );
}

// ─── Error state ───────────────────────────────────────────────────────────────

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-32 gap-4 px-8 animate-fadeIn">
      <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#ef4444"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <p className="text-[#6b6b6b] text-sm text-center">{message}</p>
      <button
        onClick={onRetry}
        className="px-5 py-2.5 rounded-full bg-[#FF6B2C] text-white text-sm font-semibold active:scale-95 transition-transform"
      >
        Try Again
      </button>
    </div>
  );
}

// ─── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({ profile }: { profile: UserProfile }) {
  if (profile.avatarUrl) {
    return (
      <Image
        src={profile.avatarUrl}
        alt={profile.displayName}
        className="w-16 h-16 rounded-full object-cover ring-2 ring-[#FF6B2C]/30 shrink-0"
      />
    );
  }
  return (
    <div className="w-16 h-16 rounded-full bg-[#2a2520] flex items-center justify-center shrink-0 ring-2 ring-[#FF6B2C]/20">
      <svg
        width="30"
        height="30"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#FF6B2C"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    </div>
  );
}

// ─── NFT card ──────────────────────────────────────────────────────────────────

function NFTCard({
  nft,
  onClick,
  delay,
}: {
  nft: AttendanceNFT;
  onClick: () => void;
  delay: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{ animationDelay: delay }}
      className="shrink-0 w-25 h-22.5 text-left animate-cardIn active:scale-[0.96] transition-transform duration-150"
    >
      <div className="w-full h-full rounded-2xl bg-[#1e1e1e] border border-white/5 flex items-center justify-center overflow-hidden">
        {nft.imageUrl ? (
          <Image
            src={nft.imageUrl}
            alt={nft.eventTitle}
            className="w-full h-full object-cover"
          />
        ) : (
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#FF6B2C"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.7"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
        )}
      </div>
      <p className="text-white text-[11px] font-semibold mt-2 leading-snug line-clamp-2">
        {nft.eventTitle}
      </p>
      {nft.verified && (
        <div className="flex items-center gap-1 mt-1">
          <span className="w-3 h-3 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
            <svg
              width="7"
              height="7"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
          <span className="text-emerald-400 text-[10px] font-semibold">
            Verified
          </span>
        </div>
      )}
    </button>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const router = useRouter();
  const { profile, loading, error, refetch } = useProfile();
  const [disconnecting, setDisconnecting] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);

  const handleDisconnectWallet = async () => {
    setDisconnecting(true);
    setWalletError(null);
    try {
      // ── Replace with your real wallet disconnect call ────────────────────
      // await fetch("/api/wallet/disconnect", { method: "POST" });
      // ────────────────────────────────────────────────────────────────────
      await new Promise((r) => setTimeout(r, 700));
      console.log("Wallet disconnected");
    } catch {
      setWalletError("Failed to disconnect. Please try again.");
    } finally {
      setDisconnecting(false);
    }
  };

  if (loading)
    return (
      <div className="fixed inset-0 w-full overflow-x-hidden overflow-y-auto bg-[#0f0f0f] text-white pb-20 [-webkit-overflow-scrolling:touch]">
        <ProfileSkeleton />
      </div>
    );

  if (error)
    return (
      <div className="fixed inset-0 w-full overflow-y-auto bg-[#0f0f0f] text-white pb-20">
        <ErrorState message={error} onRetry={refetch} />
      </div>
    );

  if (!profile) return null;

  return (
    <div
      className="
      fixed inset-0 w-full overflow-x-hidden overflow-y-auto
      bg-[#0f0f0f] text-white pb-22.5
      font-[system-ui,-apple-system,'Helvetica_Neue',sans-serif]
      [-webkit-overflow-scrolling:touch]
    "
    >
      <div className="px-4 pt-12 pb-4">
        {/* ── Header row ── */}
        <div className="flex items-center justify-between mb-5 animate-headerIn">
          <h1 className="text-[22px] font-extrabold tracking-tight">Profile</h1>
          {/* Settings / Edit */}
          <button
            onClick={() => router.push("/profile/edit")}
            className="w-9 h-9 rounded-full bg-[#1e1e1e] border border-white/8 flex items-center justify-center active:scale-90 transition-transform"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        </div>

        {/* ── Avatar + name + badges ── */}
        <div
          className="flex items-center gap-4 mb-6 animate-slideUpFade"
          style={{ animationDelay: "40ms" }}
        >
          <Avatar profile={profile} />
          <div className="min-w-0">
            <h2 className="text-white text-[17px] font-bold leading-tight">
              {profile.displayName}
            </h2>
            <p className="text-[#6b6b6b] text-[12px] mt-0.5">
              @{profile.username}
              {profile.location && (
                <span className="text-[#6b6b6b]"> · {profile.location}</span>
              )}
            </p>
            {/* Badges */}
            {profile.badges.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {profile.badges.map((badge) => (
                  <span
                    key={badge}
                    className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold border border-[#FF6B2C]/40 text-[#FF6B2C] bg-[#FF6B2C]/8"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Stats row ── */}
        <div
          className="grid grid-cols-3 gap-3 mb-7 animate-slideUpFade"
          style={{ animationDelay: "80ms" }}
        >
          {[
            { value: profile.eventsAttended, label: "Events" },
            { value: profile.rating.toFixed(1), label: "Rating" },
            { value: profile.eventsOrganized, label: "Organized" },
          ].map(({ value, label }) => (
            <div
              key={label}
              className="bg-[#1a1a1a] border border-white/6 rounded-2xl flex flex-col items-center justify-center py-4 gap-0.5"
            >
              <span className="text-white text-[22px] font-extrabold">
                {value}
              </span>
              <span className="text-[#6b6b6b] text-[11px]">{label}</span>
            </div>
          ))}
        </div>

        {/* ── Attendance NFTs ── */}
        <div
          className="mb-7 animate-slideUpFade"
          style={{ animationDelay: "120ms" }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white text-[15px] font-bold">
              Attendance NFTs
            </h3>
            {profile.nfts.length > 3 && (
              <button className="text-[#FF6B2C] text-xs font-semibold active:opacity-70 transition-opacity">
                See all
              </button>
            )}
          </div>

          {profile.nfts.length === 0 ? (
            <div className="flex flex-col items-center py-10 gap-2 rounded-2xl border border-dashed border-white/8">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#555"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
              <p className="text-[#555] text-xs text-center">
                No NFTs yet.
                <br />
                Attend an event to earn one.
              </p>
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
              {profile.nfts.map((nft, i) => (
                <NFTCard
                  key={nft.id}
                  nft={nft}
                  delay={`${i * 60}ms`}
                  onClick={() => router.push(`/tickets/${nft.ticketId}`)}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Connected Wallet ── */}
        <div
          className="animate-slideUpFade"
          style={{ animationDelay: "160ms" }}
        >
          <h3 className="text-white text-[15px] font-bold mb-3">
            Connected Wallet
          </h3>

          {profile.wallet ? (
            <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl px-4 py-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Wallet colour dot */}
                  <span
                    className={`
                    w-8 h-8 rounded-full flex items-center justify-center shrink-0
                    ${profile.wallet.active ? "bg-emerald-500/20" : "bg-[#2a2a2a]"}
                  `}
                  >
                    <span
                      className={`w-3 h-3 rounded-full ${profile.wallet.active ? "bg-emerald-400" : "bg-[#555]"}`}
                    />
                  </span>
                  <div className="min-w-0">
                    <p className="text-white text-[13px] font-semibold truncate">
                      {profile.wallet.shortAddress}
                    </p>
                    <p
                      className={`text-[11px] ${profile.wallet.active ? "text-emerald-400" : "text-[#6b6b6b]"}`}
                    >
                      {profile.wallet.type} ·{" "}
                      {profile.wallet.active ? "Active" : "Inactive"}
                    </p>
                  </div>
                </div>

                {/* Disconnect button */}
                <button
                  onClick={handleDisconnectWallet}
                  disabled={disconnecting}
                  className="shrink-0 ml-3 px-3 py-1.5 rounded-full border border-white/10 text-[#6b6b6b] text-[11px] font-semibold active:scale-95 transition-all disabled:opacity-50"
                >
                  {disconnecting ? (
                    <span className="w-3 h-3 border-2 border-[#6b6b6b]/40 border-t-[#6b6b6b] rounded-full animate-spin inline-block" />
                  ) : (
                    "Disconnect"
                  )}
                </button>
              </div>

              {walletError && (
                <p className="text-red-400 text-[11px] mt-2">{walletError}</p>
              )}
            </div>
          ) : (
            /* Connect wallet CTA */
            <button
              onClick={() => {
                // Replace with your real wallet connect flow
                console.log("Connect wallet");
              }}
              className="w-full py-3.5 rounded-2xl border border-dashed border-[#FF6B2C]/40 text-[#FF6B2C] text-[13px] font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all hover:bg-[#FF6B2C]/5"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <path d="M2 10h20" />
              </svg>
              Connect Wallet
            </button>
          )}
        </div>

        {/* ── Sign out ── */}
        <div
          className="mt-8 animate-slideUpFade"
          style={{ animationDelay: "200ms" }}
        >
          <button
            onClick={() => {
              // Replace with your real sign-out logic
              // e.g. signOut({ callbackUrl: "/" })
              console.log("Sign out");
            }}
            className="w-full py-3.5 rounded-2xl border border-red-500/20 text-red-400 text-[13px] font-semibold active:scale-[0.98] transition-all hover:bg-red-500/5"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
