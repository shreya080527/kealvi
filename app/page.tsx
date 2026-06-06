"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import UserPollCard from "./components/UserPollCard";
import QuestionsList from "./questions-list";
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

export default function Home() {
  const [polls, setPolls] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [userId, setUserId] = useState<string>("anon");
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [loadingPolls, setLoadingPolls] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
const [mounted, setMounted] = useState(false);

useEffect(() => {
  setMounted(true);
}, []);
  useEffect(() => {
    setUserId(getUserId());
  }, []);

 const loadPolls = useCallback(async () => {
  try {
    const res = await fetch("/api/polls");

    if (!res.ok) return;

    const data = await res.json();

    setPolls(Array.isArray(data) ? data : []);
    setLastRefresh(new Date());
    setLoadingPolls(false);
  } catch (err) {
    console.error("Fetch failed:", err);
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

  const id = setInterval(() => {
    loadPolls();
  }, 10000);

  intervalRef.current = id;

  return () => clearInterval(id);
}, [loadPolls, loadQuestions]);
  return (
    <main style={{ maxWidth: "700px", margin: "40px auto", padding: "20px" }}>
      <style>{`
        @keyframes fadeUp {
          0% { opacity: 1; transform: translateY(0); }
          80% { opacity: 1; transform: translateY(-8px); }
          100% { opacity: 0; transform: translateY(-16px); }
        }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <h1 style={{ margin: 0, fontSize: "28px", fontWeight: "800", color: "#0f172a" }}>
          Live Q&amp;A
        </h1>
        <span style={{ fontSize: "11px", color: "#94a3b8" }}>
          🔄 auto-refresh 10s · {mounted ? lastRefresh.toLocaleTimeString() : ""}
        </span>
      </div>

      {/* Reputation card */}
      {userId !== "anon" && <ReputationCard userId={userId} />}

      {/* ── POLLS SECTION ── */}
      <div style={{ marginBottom: "32px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "800", color: "#1e293b" }}>
            Polls
          </h2>
          <span style={{ fontSize: "13px", color: "#94a3b8" }}>
            {polls.length} poll{polls.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Create Poll Form */}
        {userId !== "anon" && (
          <CreatePollForm userId={userId} onCreated={loadPolls} />
        )}

        {/* Poll list */}
        {loadingPolls ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8", fontSize: "14px" }}>
            Loading polls…
          </div>
        ) : polls.length === 0 ? (
          <div style={{
            textAlign: "center",
            padding: "40px 20px",
            border: "2px dashed #e2e8f0",
            borderRadius: "16px",
            color: "#94a3b8",
          }}>
            <div style={{ fontSize: "40px", marginBottom: "12px" }}>📊</div>
            <div style={{ fontWeight: "600", marginBottom: "6px" }}>No polls yet</div>
            <div style={{ fontSize: "13px" }}>Be the first to create one!</div>
          </div>
        ) : (
          polls.map((poll) => (
            <UserPollCard
              key={poll.id}
              poll={poll}
              userId={userId}
              onVoteChange={loadPolls}
            />
          ))
        )}
      </div>

      {/* ── QUESTIONS SECTION ── */}
      <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#1e293b", margin: "0 0 12px" }}>
        Questions
      </h2>
      <QuestionsList initialQuestions={questions} initialHasMore={hasMore} />
    </main>
  );
}
