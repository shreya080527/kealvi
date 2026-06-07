"use client";
import { useState } from "react";

const CATEGORIES = ["general", "help", "advice", "find"];

export default function CreatePollForm({ userId, onCreated }: { userId: string; onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [category, setCategory] = useState("general");
  const [closesAt, setClosesAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const addOption = () => { if (options.length < 8) setOptions([...options, ""]); };
  const removeOption = (i: number) => { if (options.length > 2) setOptions(options.filter((_, idx) => idx !== i)); };
  const updateOption = (i: number, v: string) => setOptions(options.map((o, idx) => idx === i ? v : o));

  async function submit() {
    setError("");
    if (!question.trim()) { setError("Enter a question."); return; }
    const clean = options.map((o) => o.trim()).filter(Boolean);
    if (clean.length < 2) { setError("Fill in at least 2 options."); return; }
    setLoading(true);
    const res = await fetch("/api/polls", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, options: clean, category, closes_at: closesAt || null, creator_id: userId }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Failed."); return; }
    setQuestion(""); setOptions(["", ""]); setCategory("general"); setClosesAt(""); setOpen(false);
    onCreated();
  }

  if (!open) {
    return (
      <button className="kv-btn kv-btn--primary" onClick={() => setOpen(true)}
        style={{ width: "100%", marginBottom: "18px", padding: "12px", fontSize: "14px" }}>
        <span style={{ fontSize: "16px" }}>＋</span> Create New Poll
      </button>
    );
  }

  return (
    <div className="kv-form-panel" style={{ marginBottom: "18px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
        <h3 style={{ fontSize: "15px", fontWeight: "700", color: "var(--text-1)", margin: 0 }}>
          New Poll
        </h3>
        <button onClick={() => { setOpen(false); setError(""); }}
          style={{ background: "none", border: "none", color: "var(--text-3)", fontSize: "18px", cursor: "pointer" }}>
          ✕
        </button>
      </div>

      <div style={{ marginBottom: "14px" }}>
        <label className="kv-label">Question</label>
        <textarea className="kv-textarea" value={question} onChange={(e) => setQuestion(e.target.value)}
          placeholder="What do you want to ask?" rows={2} />
      </div>

      <div style={{ marginBottom: "14px" }}>
        <label className="kv-label">Options</label>
        {options.map((opt, i) => (
          <div key={i} style={{ display: "flex", gap: "7px", marginBottom: "7px" }}>
            <input className="kv-input" value={opt} onChange={(e) => updateOption(i, e.target.value)} placeholder={`Option ${i + 1}`} />
            {options.length > 2 && (
              <button className="kv-btn kv-btn--danger" onClick={() => removeOption(i)} style={{ padding: "8px 12px", flexShrink: 0 }}>✕</button>
            )}
          </div>
        ))}
        {options.length < 8 && (
          <button onClick={addOption} style={{
            width: "100%", padding: "8px", border: "1px dashed var(--border-2)",
            borderRadius: "var(--r-md)", background: "transparent",
            color: "var(--blue)", fontSize: "12px", fontWeight: "600", cursor: "pointer",
            marginTop: "2px", fontFamily: "var(--font)", transition: "background 0.15s",
          }}
            onMouseOver={(e) => (e.currentTarget.style.background = "var(--blue-dim)")}
            onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
          >
            + Add Option
          </button>
        )}
      </div>

      <div style={{ display: "flex", gap: "10px", marginBottom: "18px", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: "120px" }}>
          <label className="kv-label">Category</label>
          <select className="kv-select" value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </select>
        </div>
        <div style={{ flex: 1, minWidth: "160px" }}>
          <label className="kv-label">Close Date (optional)</label>
          <input type="datetime-local" className="kv-input" value={closesAt} onChange={(e) => setClosesAt(e.target.value)} />
        </div>
      </div>

      {error && (
        <div style={{ background: "var(--rose-dim)", border: "1px solid rgba(244,63,94,0.25)", color: "#fda4af", padding: "9px 13px", borderRadius: "var(--r-md)", fontSize: "13px", marginBottom: "14px" }}>
          ⚠ {error}
        </div>
      )}

      <div style={{ display: "flex", gap: "9px" }}>
        <button className="kv-btn kv-btn--ghost" onClick={() => { setOpen(false); setError(""); }} style={{ flex: 1 }}>Cancel</button>
        <button className="kv-btn kv-btn--primary" onClick={submit} disabled={loading} style={{ flex: 2 }}>
          {loading ? "Creating…" : "🚀 Create Poll"}
        </button>
      </div>
    </div>
  );
}
