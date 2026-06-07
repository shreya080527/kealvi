"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import QuestionsList from "./questions-list";
import UserPollCard from "./components/UserPollCard";
import ReputationCard from "./components/ReputationCard";
import CreatePollForm from "./components/CreatePollForm";

function getUserId(): string {
  if (typeof window === "undefined") return "anon";
  let id = localStorage.getItem("kealvi_uid");
  if (!id) {
    id = "u_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem("kealvi_uid", id);
  }
  return id;
}

type Tab = "polls" | "questions";

export default function Home() {
  const [polls, setPolls] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [userId, setUserId] = useState("anon");
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [loadingPolls, setLoadingPolls] = useState(true);
  const [tab, setTab] = useState<Tab>("polls");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [mounted, setMounted] = useState(false);
  const [sortType, setSortType] = useState<
  "trending" | "new" | "top"
>("trending");
 useEffect(() => {
  setUserId(getUserId());
  setMounted(true);
}, []);

const loadPolls = useCallback(async () => {
  try {
const res = await fetch("/api/polls", {
  cache: "no-store",
});

    if (!res.ok) {
      console.error("Poll API error", res.status);
      return;
    }

    const data = await res.json();

    setPolls(Array.isArray(data) ? data : []);
    setLastRefresh(new Date());
  } catch (err) {
    console.error("loadPolls failed", err);
  } finally {
    setLoadingPolls(false);
  }
}, []);

  const loadQuestions = useCallback(async () => {
    const res = await fetch("/api/questions");
    const data = await res.json();
    setQuestions(data.questions || []);
    setHasMore(data.hasMore || false);
  }, []);

useEffect(() => {
  loadPolls();
  loadQuestions();

  return () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };
}, [loadPolls, loadQuestions]);

 const totalVotes = polls.reduce(
  (s, p) =>
    s +
    (p.poll_options?.reduce(
      (ss: number, o: any) => ss + (o.vote_count ?? 0),
      0
    ) ?? 0),
  0
);

const topPolls = [...polls]
  .sort((a, b) => {
    const aVotes =
      a.poll_options?.reduce(
        (s: number, o: any) => s + (o.vote_count || 0),
        0
      ) || 0;

    const bVotes =
      b.poll_options?.reduce(
        (s: number, o: any) => s + (o.vote_count || 0),
        0
      ) || 0;

    return bVotes - aVotes;
  })
  .slice(0, 3);

const displayedPolls = [...polls].sort((a, b) => {
  const votesA =
    a.poll_options?.reduce(
      (s: number, o: any) => s + (o.vote_count || 0),
      0
    ) || 0;

  const votesB =
    b.poll_options?.reduce(
      (s: number, o: any) => s + (o.vote_count || 0),
      0
    ) || 0;

  if (sortType === "top") {
    return votesB - votesA;
  }

  if (sortType === "new") {
    return (
      new Date(b.created_at).getTime() -
      new Date(a.created_at).getTime()
    );
  }

  return votesB - votesA;
});
  return (
    <div className="kv-shell">
      {/* ── TOPBAR ── */}
      <header className="kv-topbar">
        <div className="kv-logo">
          <span className="kv-logo-dot" />
          Kealvi
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div className="kv-live-badge">
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--green)", display: "inline-block", boxShadow: "0 0 6px var(--green)" }} />
     live · {mounted ? lastRefresh.toLocaleTimeString() : "--:--:--"}
          </div>
        </div>
      </header>

      {/* ── SIDEBAR ── */}
      <aside className="kv-sidebar">
        {userId !== "anon" && <ReputationCard userId={userId} compact />}

        <div className="kv-nav-label">Navigate</div>

        {(["polls", "questions"] as Tab[]).map((t) => (
          <div
            key={t}
            className={`kv-nav-item ${tab === t ? "kv-nav-item--active" : ""}`}
            onClick={() => setTab(t)}
          >
            <span>{t === "polls" ? "📊" : "❓"}</span>
            <span style={{ textTransform: "capitalize" }}>{t}</span>
            {t === "polls" && (
              <span style={{ marginLeft: "auto", fontSize: "11px", color: "var(--text-3)", fontFamily: "var(--mono)" }}>
                {polls.length}
              </span>
            )}
          </div>
        ))}

        <div className="kv-nav-label" style={{ marginTop: "8px" }}>Stats</div>
         <div
  style={{
    marginTop: "20px",
    padding: "12px",
    border: "1px solid var(--border)",
    borderRadius: "12px",
    background: "var(--surface)",
  }}
>
  <div
    style={{
      fontWeight: "700",
      marginBottom: "10px",
      color: "gold",
    }}
  >
    🏆 Top Polls
  </div>

  {topPolls.map((poll, index) => {
    const votes =
      poll.poll_options?.reduce(
        (s: number, o: any) => s + (o.vote_count || 0),
        0
      ) || 0;

    return (
      <div
        key={poll.id}
        style={{
          marginBottom: "8px",
          fontSize: "12px",
        }}
      >
        {index + 1}. {poll.question}
        <br />
        <span style={{ color: "#999" }}>
          {votes} votes
        </span>
      </div>
    );
  })}
</div>
        {[
          { label: "Total Polls", val: polls.length, icon: "📊" },
          { label: "Total Votes", val: totalVotes, icon: "🗳" },
          { label: "Questions", val: questions.length, icon: "❓" },
        ].map((s) => (
          <div key={s.label} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "8px 12px", borderRadius: "var(--r-md)",
            background: "var(--surface)", border: "1px solid var(--border)",
            marginBottom: "4px",
          }}>
            <span style={{ fontSize: "12px", color: "var(--text-2)", display: "flex", alignItems: "center", gap: "6px" }}>
              {s.icon} {s.label}
            </span>
            <span style={{ fontFamily: "var(--mono)", fontSize: "13px", fontWeight: "700", color: "var(--text-1)" }}>
              {s.val}
            </span>
          </div>
        ))}
      </aside>

      {/* ── MAIN ── */}
      <main className="kv-main">
        {tab === "polls" && (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <h1 style={{ fontSize: "22px", fontWeight: "700", color: "var(--text-1)", letterSpacing: "-0.02em" }}>
                Polls
              </h1>
              <div
  style={{
    display: "flex",
    gap: "8px",
    marginTop: "10px",
  }}
>
  <button
    className="kv-btn"
    onClick={() => setSortType("trending")}
  >
    🔥 Trending
  </button>

  <button
    className="kv-btn"
    onClick={() => setSortType("new")}
  >
    🆕 New
  </button>

  <button
    className="kv-btn"
    onClick={() => setSortType("top")}
  >
    🏆 Top
  </button>
</div>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <span className="kv-pill kv-pill--blue">{polls.length} active</span>
                <span className="kv-pill kv-pill--slate">{totalVotes} votes</span>
              </div>
            </div>

            {userId !== "anon" && (
              <CreatePollForm userId={userId} onCreated={loadPolls} />
            )}

            {loadingPolls ? (
              <div style={{ textAlign: "center", padding: "60px", color: "var(--text-3)", fontFamily: "var(--mono)", fontSize: "13px" }}>
                loading polls…
              </div>
            ) : polls.length === 0 ? (
              <div className="kv-empty">
                <div style={{ fontSize: "40px", marginBottom: "12px" }}>📊</div>
                <div style={{ fontWeight: "700", color: "var(--text-1)", marginBottom: "6px" }}>No polls yet</div>
                <div style={{ fontSize: "13px", color: "var(--text-3)" }}>Create the first one above</div>
              </div>
            ) : (
              <div className="kv-poll-grid">
                {displayedPolls.map((poll) => (
                  <UserPollCard key={poll.id} poll={poll} userId={userId} onVoteChange={loadPolls} />
                ))}
              </div>
            )}
          </>
        )}

        {tab === "questions" && (
          <>
            <div style={{ marginBottom: "20px" }}>
              <h1 style={{ fontSize: "22px", fontWeight: "700", color: "var(--text-1)", letterSpacing: "-0.02em" }}>
                Questions
              </h1>
            </div>
            <QuestionsList initialQuestions={questions} initialHasMore={hasMore} />
          </>
        )}
      </main>
    </div>
  );
}
