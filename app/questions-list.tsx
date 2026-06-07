"use client";
import { useState, useEffect } from "react";
import { getVoterId } from "@/lib/voter";
import QuestionAnswers from "./components/QuestionAnswers";
type Question = {
  id: string;
  body: string;
  author: string | null;
  votes: number;
};

export default function QuestionsList({
  initialQuestions,
  initialHasMore,
}: {
  initialQuestions: Question[];
  initialHasMore: boolean;
}) {
  const [questions, setQuestions] = useState(initialQuestions);
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());

  useEffect(() => setHydrated(true), []);

  useEffect(() => {
    const id = setTimeout(async () => {
      const url = query
        ? `/api/questions?q=${encodeURIComponent(query)}`
        : `/api/questions`;
      const res = await fetch(url);
      const data = await res.json();
      setQuestions(data.questions);
      setHasMore(data.hasMore);
    }, 300);
    return () => clearTimeout(id);
  }, [query]);

  async function submit() {
    if (!draft.trim()) return;
    const res = await fetch("/api/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: draft }),
    });
    const created = await res.json();
    if (!res.ok) { alert(created.error); return; }
    setQuestions((qs) => [{ ...created, votes: 0 }, ...qs]);
    setDraft("");
  }

  async function upvote(id: string) {
    if (votedIds.has(id)) return;
    setQuestions((qs) => qs.map((q) => q.id === id ? { ...q, votes: q.votes + 1 } : q));
    const res = await fetch(`/api/questions/${id}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ voterId: getVoterId() }),
    });
    if (!res.ok) {
      setQuestions((qs) => qs.map((q) => q.id === id ? { ...q, votes: q.votes - 1 } : q));
    } else {
      setVotedIds((s) => new Set([...s, id]));
    }
  }

  async function loadMore() {
    setLoading(true);
    const res = await fetch(`/api/questions?offset=${questions.length}`);
    const data = await res.json();
    setQuestions((qs) => [...qs, ...data.questions]);
    setHasMore(data.hasMore);
    setLoading(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* Status indicator */}
      <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
        <span style={{
          width: "7px", height: "7px", borderRadius: "50%",
          background: hydrated ? "var(--green)" : "var(--text-3)",
          display: "inline-block",
          boxShadow: hydrated ? "0 0 6px var(--green)" : "none",
        }} />
        <span style={{ fontSize: "11px", color: "var(--text-3)", fontFamily: "var(--mono)", letterSpacing: "0.05em" }}>
          {hydrated ? "interactive" : "loading…"}
        </span>
      </div>

      {/* Ask + Search row */}
      <div style={{ display: "flex", gap: "10px" }}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Ask a question…"
          style={{
            flex: 1,
            padding: "10px 14px",
            background: "var(--bg-2)",
            border: "1px solid var(--border-2)",
            borderRadius: "var(--r-md)",
            color: "var(--text-1)",
            fontFamily: "var(--font)",
            fontSize: "13px",
            outline: "none",
            transition: "border-color 0.15s, box-shadow 0.15s",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "var(--blue)";
            e.currentTarget.style.boxShadow = "0 0 0 3px var(--blue-dim)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "var(--border-2)";
            e.currentTarget.style.boxShadow = "none";
          }}
        />
        <button
          onClick={submit}
          disabled={!draft.trim()}
          style={{
            padding: "10px 20px",
            background: draft.trim()
              ? "linear-gradient(135deg, var(--blue), var(--violet))"
              : "var(--surface-2)",
            color: draft.trim() ? "white" : "var(--text-3)",
            border: "none",
            borderRadius: "var(--r-md)",
            fontFamily: "var(--font)",
            fontWeight: "600",
            fontSize: "13px",
            cursor: draft.trim() ? "pointer" : "not-allowed",
            transition: "all 0.15s",
            boxShadow: draft.trim() ? "0 3px 12px var(--blue-glow)" : "none",
            whiteSpace: "nowrap",
          }}
        >
          Ask
        </button>
      </div>

      {/* Search */}
      <div style={{ position: "relative" }}>
        <span style={{
          position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)",
          fontSize: "13px", color: "var(--text-3)", pointerEvents: "none",
        }}>
          🔍
        </span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search questions…"
          style={{
            width: "100%",
            padding: "10px 14px 10px 34px",
            background: "var(--bg-2)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-md)",
            color: "var(--text-1)",
            fontFamily: "var(--font)",
            fontSize: "13px",
            outline: "none",
            boxSizing: "border-box",
            transition: "border-color 0.15s",
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "var(--border-2)")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            style={{
              position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", color: "var(--text-3)",
              cursor: "pointer", fontSize: "14px", lineHeight: 1,
            }}
          >✕</button>
        )}
      </div>

      {/* Results count */}
      {query && (
        <div style={{ fontSize: "11px", color: "var(--text-3)", fontFamily: "var(--mono)" }}>
          {questions.length} result{questions.length !== 1 ? "s" : ""} for "{query}"
        </div>
      )}

      {/* Questions list */}
      {questions.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "40px 20px",
          border: "1px dashed var(--border-2)", borderRadius: "var(--r-lg)",
          color: "var(--text-3)",
        }}>
          <div style={{ fontSize: "32px", marginBottom: "10px" }}>❓</div>
          <div style={{ fontWeight: "600", color: "var(--text-2)", marginBottom: "4px" }}>
            {query ? "No matching questions" : "No questions yet"}
          </div>
          <div style={{ fontSize: "12px" }}>
            {query ? "Try a different search" : "Be the first to ask one above"}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {questions.map((q, idx) => {
            const isVoted = votedIds.has(q.id);
            return (
              <div
                key={q.id}
                style={{
                 display: "flex",
flexDirection: "column",
alignItems: "stretch",
                  gap: "12px",
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--r-md)",
                  padding: "12px 16px",
                  transition: "border-color 0.15s, transform 0.15s",
                  animation: `slideUp 0.25s ease ${idx * 0.03}s both`,
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-2)";
                  e.currentTarget.style.transform = "translateX(3px)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.transform = "translateX(0)";
                }}
              >
                {/* Upvote button */}
                <button
                  onClick={() => upvote(q.id)}
                  disabled={isVoted}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "1px",
                    minWidth: "44px",
                    padding: "7px 10px",
                    background: isVoted ? "var(--blue-dim)" : "var(--surface-2)",
                    border: `1px solid ${isVoted ? "var(--blue)" : "var(--border)"}`,
                    borderRadius: "var(--r-sm)",
                    cursor: isVoted ? "default" : "pointer",
                    transition: "all 0.15s",
                    flexShrink: 0,
                  }}
                  onMouseOver={(e) => {
                    if (!isVoted) {
                      e.currentTarget.style.background = "var(--blue-dim)";
                      e.currentTarget.style.borderColor = "var(--blue)";
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!isVoted) {
                      e.currentTarget.style.background = "var(--surface-2)";
                      e.currentTarget.style.borderColor = "var(--border)";
                    }
                  }}
                >
                  <span style={{ fontSize: "10px", color: isVoted ? "#60a5fa" : "var(--text-2)", lineHeight: 1 }}>▲</span>
                  <span style={{
                    fontFamily: "var(--mono)", fontWeight: "700", fontSize: "13px",
                    color: isVoted ? "#93c5fd" : "var(--text-1)", lineHeight: 1,
                  }}>
                    {q.votes}
                  </span>
                </button>

                {/* Question body */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontSize: "14px", color: "var(--text-1)", margin: 0,
                    lineHeight: "1.5", fontWeight: "500",
                  }}>
                    {q.body}
                  </p>
                  {q.author && (
                    <span style={{
                      fontSize: "11px", color: "var(--text-3)",
                      fontFamily: "var(--mono)", marginTop: "3px", display: "block",
                    }}>
                      — {q.author}
                    </span>
                  )}
                </div>

                {/* Vote rank indicator for top questions */}
                {q.votes >= 2 && (
                  <span style={{
                    fontSize: "11px", padding: "2px 8px",
                    background: "var(--blue-dim)", color: "#93c5fd",
                    border: "1px solid rgba(59,130,246,0.2)",
                    borderRadius: "99px", fontFamily: "var(--mono)",
                    fontWeight: "700", flexShrink: 0,
                  }}>
                    🔥 {q.votes}
                  </span>
                )}
                <QuestionAnswers
  questionId={q.id}
  userId={getVoterId()}
/>
              </div>
            );
          })}
        </div>
      )}

      {/* Load more */}
      {hasMore && (
        <button
          onClick={loadMore}
          disabled={loading}
          style={{
            width: "100%",
            padding: "11px",
            background: "var(--surface)",
            border: "1px solid var(--border-2)",
            borderRadius: "var(--r-md)",
            color: loading ? "var(--text-3)" : "var(--text-2)",
            fontFamily: "var(--font)",
            fontWeight: "600",
            fontSize: "13px",
            cursor: loading ? "not-allowed" : "pointer",
            transition: "all 0.15s",
          }}
          onMouseOver={(e) => { if (!loading) e.currentTarget.style.background = "var(--surface-2)"; }}
          onMouseOut={(e) => { if (!loading) e.currentTarget.style.background = "var(--surface)"; }}
        >
          {loading ? "Loading…" : "Load more questions"}
        </button>
      )}
    </div>
  );
}
