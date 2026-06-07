"use client";
import { useEffect, useState, useCallback } from "react";
import PollComments from "./PollComments";
type Option = { id: string; option_text: string; vote_count: number };
type Poll = {
  id: string; question: string; poll_options: Option[];
  closes_at: string | null; is_closed: boolean; is_pinned: boolean;
  category: string; created_at: string;
};

const CAT_PILL: Record<string, string> = {
  help: "kv-pill--blue", advice: "kv-pill--green",
  find: "kv-pill--amber", general: "kv-pill--slate",
};

function Countdown({ closesAt, isClosed }: { closesAt: string | null; isClosed: boolean }) {
  const [label, setLabel] = useState("");
  useEffect(() => {
    if (!closesAt || isClosed) return;
    const tick = () => {
      const diff = new Date(closesAt).getTime() - Date.now();
      if (diff <= 0) { setLabel("Closing…"); return; }
      const h = Math.floor(diff / 3600000), m = Math.floor((diff % 3600000) / 60000), s = Math.floor((diff % 60000) / 1000);
      setLabel(h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${s}s` : `${s}s`);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [closesAt, isClosed]);
  if (!label) return null;
  return <span className="kv-pill kv-pill--rose" style={{ fontSize: "9px" }}>⏰ {label}</span>;
}

export default function UserPollCard({ poll, userId, onVoteChange }: { poll: Poll; userId: string; onVoteChange: () => void }) {
  const [currentVote, setCurrentVote] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<string | null>(null);
  const [predCounts, setPredCounts] = useState<Record<string, number>>({});
  const [predTotal, setPredTotal] = useState(0);
  const [showPred, setShowPred] = useState(false);
  const [voting, setVoting] = useState(false);
  const [predicting, setPredicting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const isClosed = poll.is_closed || (poll.closes_at ? new Date(poll.closes_at) < new Date() : false);
  const totalVotes = poll.poll_options.reduce((s, o) => s + (o.vote_count ?? 0), 0);
async function sharePoll() {
  try {
    await navigator.clipboard.writeText(
      `${window.location.origin}/?poll=${poll.id}`
    );

    alert("Poll link copied!");
  } catch {
    alert("Failed to copy link");
  }
}
  const load = useCallback(async () => {
    const [vr, pr] = await Promise.all([
  fetch(`/api/vote?pollId=${poll.id}&voterId=${userId}`),
  fetch(`/api/prediction?pollId=${poll.id}&userId=${userId}`),
]);
let vd: any = {};
let pd: any = {};

try {
  vd = await vr.json();
} catch {}

try {
  pd = await pr.json();
} catch {}
    setCurrentVote(vd.currentVote ?? null);
    setPrediction(pd.userPrediction?.predicted_option_id ?? null);
    setPredCounts(pd.counts ?? {});
    setPredTotal(pd.total ?? 0);
  }, [poll.id, userId]);

  useEffect(() => { load(); }, [load]);

  function flash(msg: string) { setToast(msg); setTimeout(() => setToast(null), 2200); }

  async function vote(optionId: string) {
    if (voting || isClosed) return;
    setVoting(true);
    const prev = currentVote;
    setCurrentVote(optionId === currentVote ? null : optionId);
    const res = await fetch("/api/vote", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ optionId, pollId: poll.id, voterId: userId }),
    });
    const d = await res.json();
    if (!res.ok) { setCurrentVote(prev); }
    else flash(d.action === "voted" ? "✓ +2 XP" : d.action === "switched" ? "↩ Switched" : "✗ Removed");
    onVoteChange();
    setVoting(false);
  }

  async function predict(optionId: string) {
    if (predicting || isClosed || prediction) return;
    setPredicting(true);
    const res = await fetch("/api/prediction", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pollId: poll.id, userId, optionId }),
    });
    if (res.ok) { setPrediction(optionId); flash("🔮 +5 XP"); await load(); }
    setPredicting(false);
  }

  return (
    <div className="kv-card" style={{ display: "flex", flexDirection: "column", gap: "0" }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: "absolute", top: "10px", right: "10px",
          background: "var(--surface-3)", border: "1px solid var(--border-2)",
          color: "var(--text-1)", fontSize: "11px", fontWeight: "700",
          padding: "3px 10px", borderRadius: "99px", zIndex: 5,
          fontFamily: "var(--mono)", animation: "fadeUp 2.2s ease forwards",
        }}>{toast}</div>
      )}

      {/* Header */}
      <div style={{ marginBottom: "12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px", marginBottom: "8px" }}>
          <h3 style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-1)", lineHeight: "1.4", flex: 1, margin: 0 }}>
            {poll.question}
          </h3>
          {poll.is_pinned && <span style={{ fontSize: "14px", flexShrink: 0 }}>📌</span>}
        </div>
        <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", alignItems: "center" }}>
          <span className={`kv-pill ${CAT_PILL[poll.category] ?? "kv-pill--slate"}`}>{poll.category}</span>
          <Countdown closesAt={poll.closes_at} isClosed={isClosed} />
          {isClosed && <span className="kv-pill kv-pill--rose">Closed</span>}
        </div>
      </div>

      {/* Options */}
      <div style={{ flex: 1 }}>
        {poll.poll_options?.map((opt) => {
          const pct = totalVotes > 0 ? Math.round((opt.vote_count / totalVotes) * 100) : 0;
          const isMyVote = currentVote === opt.id;
          const isMyPred = prediction === opt.id;
          const predCount = predCounts[opt.id] ?? 0;
          const predPct = predTotal > 0 ? Math.round((predCount / predTotal) * 100) : 0;

          return (
            <button
              key={opt.id}
              onClick={() => vote(opt.id)}
              disabled={isClosed || voting}
              className={`kv-option ${isMyVote ? "kv-option--voted" : ""}`}
            >
              <div
                className={`kv-option__bar ${isMyVote ? "" : "kv-option__bar--neutral"}`}
                style={{ width: `${pct}%` }}
              />
              <div className="kv-option__row">
                <span className="kv-option__text">
                  {isMyVote && <span style={{ color: "#60a5fa", marginRight: "5px" }}>✓</span>}
                  {opt.option_text}
                  {isMyPred && <span style={{ marginLeft: "5px" }}>🔮</span>}
                </span>
                <div className="kv-option__meta">
                  <span className="kv-option__votes">{opt.vote_count}v</span>
                  <span className="kv-option__pct">{pct}%</span>
                </div>
              </div>
              {showPred && predTotal > 0 && (
                <div style={{ padding: "0 12px 8px", position: "relative" }}>
                  <div className="kv-progress">
                    <div className="kv-progress__fill kv-progress__fill--amber" style={{ width: `${predPct}%` }} />
                  </div>
                  <span style={{ fontSize: "10px", color: "var(--amber)", marginTop: "2px", display: "block", fontFamily: "var(--mono)" }}>
                    {predCount} pred ({predPct}%)
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px", flexWrap: "wrap" }}>
        <span style={{ fontSize: "11px", color: "var(--text-3)", fontFamily: "var(--mono)" }}>
          {totalVotes} votes
        </span>
        <div style={{ display: "flex", gap: "5px", alignItems: "center", flexWrap: "wrap" }}>
          <button onClick={() => setShowPred(!showPred)} className="kv-btn kv-btn--ghost"
            style={{ fontSize: "11px", padding: "3px 9px", color: showPred ? "var(--amber)" : undefined, borderColor: showPred ? "var(--amber)" : undefined }}>
            🔮 {predTotal}
          </button>
          <button
  onClick={sharePoll}
  className="kv-btn kv-btn--ghost"
>
  📤 Share
</button>
          {!isClosed && !prediction && poll.poll_options?.map((opt) => (
            <button key={opt.id} onClick={() => predict(opt.id)} disabled={predicting}
              className="kv-btn kv-btn--amber"
              style={{ fontSize: "10px", padding: "3px 8px", maxWidth: "80px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
              title={`Predict: ${opt.option_text}`}>
              {opt.option_text.length > 10 ? opt.option_text.slice(0, 8) + "…" : opt.option_text}
            </button>
          ))}
          {prediction && (
            <span className="kv-pill kv-pill--amber">
              🔮 {poll.poll_options.find((o) => o.id === prediction)?.option_text?.slice(0, 12)}
            </span>
          )}
        </div>
      </div>

      <div style={{ marginTop: "8px", fontSize: "10px", color: "var(--text-3)", fontFamily: "var(--mono)" }}>
        {new Date(poll.created_at).toLocaleDateString()}
      </div>
      <PollComments
  pollId={poll.id}
  userId={userId}
/>
    </div>
  );
}
