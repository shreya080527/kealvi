"use client";

import { useEffect, useState } from "react";

export default function QuestionAnswers({
  questionId,
  userId,
}: {
  questionId: string;
  userId: string;
}) {
  const [answers, setAnswers] = useState<any[]>([]);
  const [text, setText] = useState("");

  async function loadAnswers() {
    const res = await fetch(
      `/api/answers?questionId=${questionId}`
    );

    const data = await res.json();

    setAnswers(Array.isArray(data) ? data : []);
  }

  async function addAnswer() {
    if (!text.trim()) return;

    const res = await fetch("/api/answers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        questionId,
        userId,
        answer: text,
      }),
    });

    if (res.ok) {
      setText("");
      loadAnswers();
    }
  }

  useEffect(() => {
    loadAnswers();
  }, [questionId]);

  return (
    <div
      style={{
        marginTop: "12px",
        paddingTop: "10px",
        borderTop: "1px solid var(--border)",
      }}
    >
      <div
        style={{
          fontWeight: "700",
          marginBottom: "10px",
          color: "var(--text-1)",
        }}
      >
        💬 Answers ({answers.length})
      </div>

      {answers.map((a) => (
        <div
          key={a.id}
          style={{
            marginBottom: "8px",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "10px",
            padding: "8px 10px",
          }}
        >
          <div
            style={{
              color: "#60a5fa",
              fontSize: "11px",
              marginBottom: "4px",
              fontWeight: "600",
            }}
          >
            {a.user_id.slice(0, 8)}
          </div>

          <div
            style={{
              color: "var(--text-1)",
              fontSize: "13px",
            }}
          >
            {a.answer}
          </div>
        </div>
      ))}

      <div
        style={{
          display: "flex",
          gap: "8px",
          marginTop: "10px",
        }}
      >
        <input
          value={text}
          onChange={(e) =>
            setText(e.target.value)
          }
          placeholder="Write an answer..."
          style={{
            flex: 1,
            padding: "10px",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "10px",
            color: "var(--text-1)",
            outline: "none",
          }}
        />

        <button
          className="kv-btn"
          onClick={addAnswer}
        >
          Post
        </button>
      </div>
    </div>
  );
}