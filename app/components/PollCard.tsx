"use client";
import { useEffect, useState, useCallback } from "react";

type Option = {
  id: string;
  option_text: string;
  vote_count: number;
};

type Poll = {
  id: string;
  question: string;
  poll_options: Option[];
  closes_at: string | null;
  is_closed: boolean;
  is_pinned: boolean;
  category: string;
};

const CATEGORY_COLORS: Record<string, string> = {
  help: "#dbeafe",
  advice: "#d1fae5",
  find: "#fef3c7",
  general: "#f1f5f9",
};

const CATEGORY_TEXT: Record<string, string> = {
  help: "#1d4ed8",
  advice: "#065f46",
  find: "#92400e",
  general: "#475569",
};

function useCountdown(closesAt: string | null, isClosed: boolean) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (!closesAt || isClosed) return;
    const tick = () => {
      const diff = new Date(closesAt).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft("Closing..."); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(h > 0 ? `${h}h ${m}m left` : m > 0 ? `${m}m ${s}s left` : `${s}s left`);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [closesAt, isClosed]);

  return timeLeft;
}

export default function PollCard({
  poll,
  userId,
  onVoteChange,
}: {
  poll: Poll;
  userId: string;
  onVoteChange: () => void;
}) {
  const [currentVote, setCurrentVote] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<string | null>(null);
  const [predictionCounts, setPredictionCounts] = useState<Record<string, number>>({});
  const [predictionTotal, setPredictionTotal] = useState(0);
  const [isVoting, setIsVoting] = useState(false);
  const [isPredicting, setIsPredicting] = useState(false);
  const [showPredictions, setShowPredictions] = useState(false);
  const [justEarned, setJustEarned] = useState<string | null>(null);

  const isClosed =
    poll.is_closed ||
    (poll.closes_at ? new Date(poll.closes_at) < new Date() : false);

  const timeLeft = useCountdown(poll.closes_at, isClosed);

  const totalVotes = poll.poll_options.reduce((s, o) => s + (o.vote_count ?? 0), 0);

  const loadVoteAndPrediction = useCallback(async () => {
    const [voteRes, predRes] = await Promise.all([
      fetch(`/api/vote?pollId=${poll.id}&voterId=${userId}`),
      fetch(`/api/predictions?pollId=${poll.id}&userId=${userId}`),
    ]);
  let voteData: any = {};
let predData: any = {};

try {
  voteData = await voteRes.json();
} catch (e) {
  voteData = { currentVote: null };
}

try {
  predData = await predRes.json();
} catch (e) {
  predData = {
    counts: {},
    userPrediction: null,
    total: 0,
  };
}
    setCurrentVote(voteData.currentVote ?? null);
    setPrediction(predData.userPrediction?.predicted_option_id ?? null);
    setPredictionCounts(predData.counts ?? {});
    setPredictionTotal(predData.total ?? 0);
  }, [poll.id, userId]);

  useEffect(() => { loadVoteAndPrediction(); }, [loadVoteAndPrediction]);

  async function handleVote(optionId: string) {
    if (isVoting || isClosed) return;
    setIsVoting(true);

    // Optimistic UI
    const prev = currentVote;
    setCurrentVote(optionId === currentVote ? null : optionId);

    const res = await fetch("/api/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ optionId, pollId: poll.id, voterId: userId }),
    });

let data;

try {
  data = await res.json();
} catch {
  data = { success: false };
}
    if (!res.ok) {
      setCurrentVote(prev); // revert
    } else {
      if (data.action === "voted") {
        setJustEarned("+2 XP");
        setTimeout(() => setJustEarned(null), 2000);
      }
    }
    onVoteChange();
    setIsVoting(false);
  }

  async function handlePredict(optionId: string) {
    if (isPredicting || isClosed) return;
    setIsPredicting(true);

    const res = await fetch("/api/predictions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pollId: poll.id, userId, optionId }),
    });

    if (res.ok) {
      setPrediction(optionId);
      setJustEarned("+5 XP 🔮");
      setTimeout(() => setJustEarned(null), 2000);
      await loadVoteAndPrediction();
    }
    setIsPredicting(false);
  }

  return (
    <div style={{
      border: poll.is_pinned ? "2px solid #6366f1" : "1px solid #e2e8f0",
      borderRadius: "16px",
      padding: "20px",
      marginBottom: "16px",
      background: "white",
      boxShadow: poll.is_pinned ? "0 4px 20px rgba(99,102,241,0.15)" : "0 1px 4px rgba(0,0,0,0.05)",
      position: "relative",
    }}>
      {/* Pinned badge */}
      {poll.is_pinned && (
        <div style={{
          position: "absolute", top: "-10px", left: "16px",
          background: "#6366f1", color: "white",
          fontSize: "11px", fontWeight: "700",
          padding: "2px 10px", borderRadius: "999px",
        }}>
          📌 PINNED
        </div>
      )}

      {/* XP earned toast */}
      {justEarned && (
        <div style={{
          position: "absolute", top: "12px", right: "12px",
          background: "#16a34a", color: "white",
          fontSize: "13px", fontWeight: "700",
          padding: "4px 10px", borderRadius: "999px",
          animation: "fadeUp 2s ease forwards",
        }}>
          {justEarned}
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: "14px" }}>
        <h2 style={{ margin: 0, fontSize: "17px", fontWeight: "700", color: "#0f172a", lineHeight: "1.4" }}>
          {poll.question}
        </h2>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px", flexShrink: 0 }}>
          {/* Category tag */}
          <span style={{
            background: CATEGORY_COLORS[poll.category] ?? "#f1f5f9",
            color: CATEGORY_TEXT[poll.category] ?? "#475569",
            fontSize: "11px", fontWeight: "600",
            padding: "3px 9px", borderRadius: "999px",
            textTransform: "uppercase",
          }}>
            {poll.category ?? "general"}
          </span>
          {/* Countdown */}
          {timeLeft && (
            <span style={{ fontSize: "11px", color: "#ef4444", fontWeight: "600" }}>
              ⏰ {timeLeft}
            </span>
          )}
          {isClosed && (
            <span style={{
              background: "#fee2e2", color: "#ef4444",
              fontSize: "11px", fontWeight: "700",
              padding: "3px 9px", borderRadius: "999px",
            }}>
              CLOSED
            </span>
          )}
        </div>
      </div>

      {/* Vote options */}
      {poll.poll_options?.map((option) => {
        const pct = totalVotes > 0 ? Math.round((option.vote_count / totalVotes) * 100) : 0;
        const isMyVote = currentVote === option.id;
        const isMyPred = prediction === option.id;
        const predCount = predictionCounts[option.id] ?? 0;
        const predPct = predictionTotal > 0 ? Math.round((predCount / predictionTotal) * 100) : 0;

        return (
          <div key={option.id} style={{ marginTop: "10px" }}>
            <button
              onClick={() => handleVote(option.id)}
              disabled={isClosed || isVoting}
              style={{
                width: "100%",
                padding: "12px 14px",
                border: isMyVote ? "2px solid #6366f1" : "1px solid #e2e8f0",
                borderRadius: "10px",
                cursor: isClosed ? "default" : "pointer",
                background: "white",
                position: "relative",
                overflow: "hidden",
                textAlign: "left",
                transition: "border-color 0.15s",
              }}
            >
              {/* Vote fill bar */}
              <div style={{
                position: "absolute", top: 0, left: 0,
                height: "100%", width: `${pct}%`,
                background: isMyVote ? "rgba(99,102,241,0.1)" : "rgba(226,232,240,0.5)",
                transition: "width 0.4s ease",
                pointerEvents: "none",
              }} />
              <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: isMyVote ? "700" : "500", color: isMyVote ? "#4338ca" : "#374151", fontSize: "15px" }}>
                  {isMyVote && "✓ "}{option.option_text}
                  {isMyPred && " 🔮"}
                </span>
                <span style={{ fontSize: "13px", color: "#64748b", fontWeight: "600" }}>
                  {option.vote_count ?? 0} votes · {pct}%
                </span>
              </div>
              {/* Prediction bar under vote bar */}
              {showPredictions && predictionTotal > 0 && (
                <div style={{ marginTop: "6px", position: "relative" }}>
                  <div style={{ height: "3px", background: "#f1f5f9", borderRadius: "999px" }}>
                    <div style={{
                      height: "100%", width: `${predPct}%`,
                      background: "#f59e0b", borderRadius: "999px",
                    }} />
                  </div>
                  <span style={{ fontSize: "11px", color: "#b45309" }}>
                    {predCount} predicted ({predPct}%)
                  </span>
                </div>
              )}
            </button>
          </div>
        );
      })}

      {/* Footer actions */}
      <div style={{ marginTop: "14px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
        <span style={{ fontSize: "13px", color: "#94a3b8" }}>
          {totalVotes} total vote{totalVotes !== 1 ? "s" : ""}
          {currentVote && !isClosed && (
            <span style={{ color: "#6366f1", marginLeft: "8px" }}>· tap another option to switch</span>
          )}
        </span>

        <div style={{ display: "flex", gap: "8px" }}>
          {/* Predictions toggle */}
          <button
            onClick={() => setShowPredictions(!showPredictions)}
            style={{
              fontSize: "12px", padding: "5px 10px",
              border: "1px solid #e2e8f0", borderRadius: "8px",
              background: showPredictions ? "#fef3c7" : "white",
              cursor: "pointer", color: "#92400e",
            }}
          >
            🔮 {predictionTotal} prediction{predictionTotal !== 1 ? "s" : ""}
          </button>

          {/* Predict button (only before voting, only when open) */}
          {!isClosed && !prediction && (
            <div style={{ display: "flex", gap: "4px" }}>
              <span style={{ fontSize: "12px", color: "#64748b", alignSelf: "center" }}>Predict winner:</span>
              {poll.poll_options?.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handlePredict(opt.id)}
                  disabled={isPredicting}
                  style={{
                    fontSize: "11px", padding: "4px 8px",
                    border: "1px solid #fed7aa", borderRadius: "6px",
                    background: "#fff7ed", cursor: "pointer", color: "#92400e",
                  }}
                  title={`Predict: ${opt.option_text}`}
                >
                  {opt.option_text.slice(0, 12)}{opt.option_text.length > 12 ? "…" : ""}
                </button>
              ))}
            </div>
          )}

          {prediction && (
            <span style={{ fontSize: "12px", color: "#92400e", background: "#fff7ed", padding: "5px 10px", borderRadius: "8px" }}>
              🔮 You predicted:{" "}
              {poll.poll_options.find((o) => o.id === prediction)?.option_text?.slice(0, 20)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
