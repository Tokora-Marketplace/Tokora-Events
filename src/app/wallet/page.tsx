"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

// Types

interface WalletBalance {
  totalUSD: number;
  sol: number;
  usdc: number;
}

interface MyTicket {
  id: string;
  eventTitle: string;
  date: string;
  imageUrl?: string;
  status: "Active" | "Used" | "Expired";
  ticketId: string;
}

type TxType = "debit" | "credit" | "free";

interface Transaction {
  id: string;
  title: string;
  subtitle: string;
  amount: string;
  amountType: TxType;
  date: string;
  avatarColor: string;
}

interface WalletData {
  balance: WalletBalance;
  tickets: MyTicket[];
  transactions: Transaction[];
}

// Mock data

const MOCK_WALLET: WalletData = {
  balance: { totalUSD: 842.5, sol: 0.35, usdc: 120.0 },
  tickets: [
    {
      id: "t1",
      eventTitle: "Web3 Lagos Summit 2025",
      date: "Jun 14, 2025",
      status: "Active",
      ticketId: "tk_8821",
    },
    {
      id: "t2",
      eventTitle: "Afrobeats Underground Night",
      date: "Jun 20, 2025",
      status: "Active",
      ticketId: "tk_8822",
    },
    {
      id: "t3",
      eventTitle: "Founders & Funders Mixer",
      date: "Jul 2, 2025",
      status: "Used",
      ticketId: "tk_8823",
    },
  ],
  transactions: [
    {
      id: "x1",
      title: "Web3 Lagos Summit",
      subtitle: "Ticket purchase",
      amount: "-0.05 SOL",
      amountType: "debit",
      date: "Today",
      avatarColor: "#FF6B2C",
    },
    {
      id: "x2",
      title: "Afrobeats Night",
      subtitle: "Free entry",
      amount: "Free",
      amountType: "free",
      date: "Jun 3",
      avatarColor: "#a78bfa",
    },
    {
      id: "x3",
      title: "Tokora Pay Top-up",
      subtitle: "Added from wallet",
      amount: "+50 USDC",
      amountType: "credit",
      date: "May 30",
      avatarColor: "#34d399",
    },
  ],
};

// API hook

function useWallet() {
  const [data, setData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWallet = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    // Replace with API call
    // fetch("/api/wallet")
    //   .then(r => { if (!r.ok) throw new Error(r.statusText); return r.json(); })
    //   .then(d => { if (!cancelled) setData(d); })
    //   .catch(() => { if (!cancelled) setError("Failed to load wallet."); })
    //   .finally(() => { if (!cancelled) setLoading(false); });
    // return () => { cancelled = true; };
    //

    const timer = setTimeout(() => {
      if (cancelled) return;
      setData(MOCK_WALLET);
      setLoading(false);
    }, 550);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => fetchWallet(), [fetchWallet]);
  return { data, loading, error, refetch: fetchWallet };
}

// ─── Skeleton

function WalletSkeleton() {
  return (
    <div className="px-4 pt-12 space-y-6">
      <div className="h-7 w-24 bg-[#1e1e1e] rounded-lg animate-pulse" />
      <div className="h-42 rounded-3xl bg-[#2a1a00] animate-pulse" />
      <div className="space-y-3">
        <div className="h-4 w-28 bg-[#1e1e1e] rounded-full animate-pulse" />
        <div className="flex gap-3">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="shrink-0 w-40 h-37.5 bg-[#1e1e1e] rounded-2xl animate-pulse"
            />
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <div className="h-4 w-20 bg-[#1e1e1e] rounded-full animate-pulse" />
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-14 bg-[#1e1e1e] rounded-2xl animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}

// Error state

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

// Image placeholder

function ImgPlaceholder() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-[#2a2a2a]">
      <svg
        width="26"
        height="26"
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
    </div>
  );
}

// Action button

function ActionBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex-1 py-2.5 rounded-full bg-black/25 border border-white/15 text-white text-[13px] font-semibold active:scale-95 transition-transform duration-150"
    >
      {label}
    </button>
  );
}

// Page

export default function WalletPage() {
  const router = useRouter();
  const { data, loading, error, refetch } = useWallet();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleAction = async (action: string) => {
    setActionLoading(action);
    setActionError(null);
    try {
      // ── Replace with  wallet action calls
      // if (action === "send")    await router.push("/wallet/send");
      // if (action === "receive") await router.push("/wallet/receive");
      // if (action === "pay")     await router.push("/wallet/pay");
      // if (action === "convert") await router.push("/wallet/convert");
      //
      await new Promise((r) => setTimeout(r, 400));
      console.log("Wallet action:", action);
    } catch {
      setActionError(`${action} failed. Please try again.`);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading)
    return (
      <div className="fixed inset-0 w-full overflow-x-hidden overflow-y-auto bg-[#0f0f0f] text-white pb-20 [-webkit-overflow-scrolling:touch]">
        <WalletSkeleton />
      </div>
    );

  if (error)
    return (
      <div className="fixed inset-0 w-full overflow-y-auto bg-[#0f0f0f] text-white pb-20">
        <ErrorState message={error} onRetry={refetch} />
      </div>
    );

  if (!data) return null;

  const { balance, tickets, transactions } = data;

  return (
    <div
      className="
      fixed inset-0 w-full overflow-x-hidden overflow-y-auto
      bg-[#0f0f0f] text-white pb-22.5
      font-[system-ui,-apple-system,'Helvetica_Neue',sans-serif]
      [-webkit-overflow-scrolling:touch]
    "
    >
      <div className="px-4 pt-12">
        {/* ── Page title ── */}
        <h1 className="text-[22px] font-extrabold tracking-tight mb-5 animate-headerIn">
          Wallet
        </h1>

        {/* ── Balance card (orange) ── */}
        <div
          className="rounded-3xl p-5 mb-6 animate-slideUpFade"
          style={{
            background: "linear-gradient(135deg, #FF6B2C 0%, #e85a1f 100%)",
            animationDelay: "40ms",
          }}
        >
          <p className="text-white/70 text-[11px] font-semibold uppercase tracking-wider mb-1">
            Total Balance
          </p>
          <p className="text-white text-[36px] font-extrabold leading-tight tracking-tight">
            $
            {balance.totalUSD.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
          <p className="text-white/70 text-[12px] mt-0.5 mb-5">
            {balance.sol} SOL · {balance.usdc.toFixed(2)} USDC
          </p>

          {/* Action buttons */}
          <div className="flex gap-2">
            {["Send", "Receive", "Pay", "Convert"].map((label) => (
              <ActionBtn
                key={label}
                label={actionLoading === label.toLowerCase() ? "…" : label}
                onClick={() => handleAction(label.toLowerCase())}
              />
            ))}
          </div>

          {actionError && (
            <p className="text-white/70 text-[11px] mt-3">{actionError}</p>
          )}
        </div>

        {/* ── My Tickets ── */}
        <section
          className="mb-7 animate-slideUpFade"
          style={{ animationDelay: "80ms" }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white text-[15px] font-bold">My Tickets</h2>
            <button
              onClick={() => router.push("/tickets")}
              className="text-[#FF6B2C] text-xs font-semibold active:opacity-70 transition-opacity"
            >
              See all
            </button>
          </div>

          {tickets.length === 0 ? (
            <div className="flex flex-col items-center py-8 gap-2 rounded-2xl border border-dashed border-white/8">
              <p className="text-[#555] text-xs">
                No tickets yet. Attend an event!
              </p>
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
              {tickets.map((ticket, i) => (
                <button
                  key={ticket.id}
                  onClick={() => router.push(`/tickets/${ticket.ticketId}`)}
                  style={{ animationDelay: `${i * 60}ms` }}
                  className="animate-cardIn shrink-0 w-40 h-37.5 bg-[#1a1a1a] border border-white/6 rounded-2xl overflow-hidden text-left active:scale-[0.97] transition-transform duration-150"
                >
                  {/* Image */}
                  <div className="w-full h-22.5 overflow-hidden">
                    {ticket.imageUrl ? (
                      <Image
                        src={ticket.imageUrl}
                        alt={ticket.eventTitle}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImgPlaceholder />
                    )}
                  </div>
                  {/* Info */}
                  <div className="px-3 py-2.5">
                    <p className="text-white text-[12px] font-semibold leading-snug line-clamp-2 mb-1">
                      {ticket.eventTitle}
                    </p>
                    <p className="text-[#6b6b6b] text-[10px] mb-2">
                      {ticket.date}
                    </p>
                    <span
                      className={`
                      inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold
                      ${
                        ticket.status === "Active"
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
                          : ticket.status === "Used"
                            ? "bg-[#2a2a2a] text-[#6b6b6b] border border-white/8"
                            : "bg-red-500/10 text-red-400 border border-red-500/20"
                      }
                    `}
                    >
                      {ticket.status === "Active" && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      )}
                      {ticket.status}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* ── Recent transactions ── */}
        <section
          className="animate-slideUpFade"
          style={{ animationDelay: "120ms" }}
        >
          <h2 className="text-white text-[15px] font-bold mb-3">Recent</h2>

          {transactions.length === 0 ? (
            <div className="flex flex-col items-center py-8 gap-2">
              <p className="text-[#555] text-xs">No transactions yet.</p>
            </div>
          ) : (
            <div className="space-y-0">
              {transactions.map((tx, i) => (
                <div
                  key={tx.id}
                  style={{ animationDelay: `${120 + i * 50}ms` }}
                  className="animate-slideUpFade flex items-center gap-3 py-3.5 border-b border-white/5 last:border-0"
                >
                  {/* Avatar dot */}
                  <span
                    className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-white text-[13px] font-bold"
                    style={{ background: tx.avatarColor }}
                  >
                    {tx.title.charAt(0)}
                  </span>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-[13px] font-semibold truncate">
                      {tx.title}
                    </p>
                    <p className="text-[#6b6b6b] text-[11px]">{tx.subtitle}</p>
                  </div>

                  {/* Amount + date */}
                  <div className="shrink-0 text-right">
                    <p
                      className={`text-[13px] font-bold ${
                        tx.amountType === "credit"
                          ? "text-emerald-400"
                          : tx.amountType === "debit"
                            ? "text-white"
                            : "text-[#6b6b6b]"
                      }`}
                    >
                      {tx.amount}
                    </p>
                    <p className="text-[#6b6b6b] text-[10px] mt-0.5">
                      {tx.date}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
