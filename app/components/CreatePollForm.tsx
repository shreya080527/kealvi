"use client";
import { useState } from "react";

const CATEGORIES = ["general", "help", "advice", "find"];

type Props = {
  userId: string;
  onCreated: () => void;
};

export default function CreatePollForm({ userId, onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [category, setCategory] = useState("general");
  const [closesAt, setClosesAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function addOption() {
    if (options.length < 8) setOptions([...options, ""]);
  }

  function removeOption(i: number) {
    if (options.length > 2) setOptions(options.filter((_, idx) => idx !== i));
  }

  function updateOption(i: number, val: string) {
    setOptions(options.map((o, idx) => (idx === i ? val : o)));
  }

  async function submit() {
    setError("");
    if (!question.trim()) { setError("Please enter a question."); return; }
    const clean = options.map((o) => o.trim()).filter(Boolean);
    if (clean.length < 2) { setError("Please fill in at least 2 options."); return; }

    setLoading(true);
   console.time("createPoll");
const payload = {
  userId,
  question,
  options: clean,
  category,
  closesAt: closesAt || null,
};

const res = await fetch("/api/polls", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(payload),
});

console.timeEnd("createPoll");

   let data = null;

try {
  data = await res.json();
} catch {
  data = null;
}
    setLoading(false);

    if (!res.ok) { setError(data.error ?? "Failed to create poll."); return; }

    // Reset form
    setQuestion("");
    setOptions(["", ""]);
    setCategory("general");
    setClosesAt("");
    setOpen(false);
    onCreated();
  }

  const CATEGORY_COLORS: Record<string, string> = {
    general: "#6366f1",
    help: "#2563eb",
    advice: "#059669",
    find: "#d97706",
  };

  return (
    <div style={{ marginBottom: "24px" }}>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          style={{
            width: "100%",
            padding: "14px",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            color: "white",
            border: "none",
            borderRadius: "12px",
            fontSize: "16px",
            fontWeight: "700",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            boxShadow: "0 4px 14px rgba(99,102,241,0.4)",
            transition: "transform 0.1s, box-shadow 0.1s",
          }}
          onMouseOver={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
          onMouseOut={(e) => (e.currentTarget.style.transform = "none")}
        >
          <span style={{ fontSize: "20px" }}>＋</span> Create New Poll
        </button>
      ) : (
        <div style={{
          border: "2px solid #6366f1",
          borderRadius: "16px",
          padding: "24px",
          background: "white",
          boxShadow: "0 8px 30px rgba(99,102,241,0.15)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>
              📊 Create a Poll
            </h2>
            <button
              onClick={() => { setOpen(false); setError(""); }}
              style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#94a3b8" }}
            >
              ✕
            </button>
          </div>

          {/* Question */}
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>
              QUESTION
            </label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What do you want to ask?"
              rows={2}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #e2e8f0",
                borderRadius: "10px",
                fontSize: "15px",
                resize: "vertical",
                outline: "none",
                boxSizing: "border-box",
                fontFamily: "inherit",
              }}
            />
          </div>

          {/* Options */}
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#475569", marginBottom: "8px" }}>
              OPTIONS
            </label>
            {options.map((opt, i) => (
              <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                <input
                  value={opt}
                  onChange={(e) => updateOption(i, e.target.value)}
                  placeholder={`Option ${i + 1}`}
                  style={{
                    flex: 1,
                    padding: "9px 12px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    fontSize: "14px",
                    outline: "none",
                    fontFamily: "inherit",
                  }}
                />
                {options.length > 2 && (
                  <button
                    onClick={() => removeOption(i)}
                    style={{
                      padding: "8px 12px",
                      background: "#fee2e2",
                      border: "none",
                      borderRadius: "8px",
                      color: "#ef4444",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "700",
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}

            {options.length < 8 && (
              <button
                onClick={addOption}
                style={{
                  width: "100%",
                  padding: "9px",
                  border: "1px dashed #a5b4fc",
                  borderRadius: "8px",
                  background: "#f5f3ff",
                  color: "#6366f1",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer",
                  marginTop: "4px",
                }}
              >
                + Add Option
              </button>
            )}
          </div>

          {/* Category + Close date row */}
          <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: "140px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>
                CATEGORY
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  fontSize: "14px",
                  outline: "none",
                  background: "white",
                  color: CATEGORY_COLORS[category] ?? "#475569",
                  fontWeight: "600",
                  fontFamily: "inherit",
                }}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>

            <div style={{ flex: 1, minWidth: "180px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>
                CLOSE DATE (optional)
              </label>
              <input
                type="datetime-local"
                value={closesAt}
                onChange={(e) => setClosesAt(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  fontSize: "13px",
                  outline: "none",
                  boxSizing: "border-box",
                  fontFamily: "inherit",
                }}
              />
            </div>
          </div>

          {error && (
            <div style={{
              background: "#fee2e2",
              color: "#ef4444",
              padding: "10px 14px",
              borderRadius: "8px",
              fontSize: "14px",
              marginBottom: "16px",
            }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={() => { setOpen(false); setError(""); }}
              style={{
                flex: 1,
                padding: "12px",
                border: "1px solid #e2e8f0",
                borderRadius: "10px",
                background: "white",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                color: "#64748b",
              }}
            >
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={loading}
              style={{
                flex: 2,
                padding: "12px",
                background: loading ? "#a5b4fc" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                color: "white",
                border: "none",
                borderRadius: "10px",
                fontSize: "15px",
                fontWeight: "700",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Creating…" : "🚀 Create Poll"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
