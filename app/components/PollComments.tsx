"use client";

import { useEffect, useState } from "react";

export default function PollComments({
  pollId,
  userId,
}: {
  pollId: string;
  userId: string;
}) {
  const [comments, setComments] = useState<any[]>([]);
  const [text, setText] = useState("");

  async function loadComments() {
    const res = await fetch(
      `/api/comments?pollId=${pollId}`
    );

    const data = await res.json();

    setComments(data);
  }

  async function addComment() {
    if (!text.trim()) return;

    const res = await fetch("/api/comments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        pollId,
        userId,
        comment: text,
      }),
    });

    if (res.ok) {
      setText("");
      loadComments();
    }
  }

  useEffect(() => {
    loadComments();
  }, [pollId]);

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
          marginBottom: "8px",
        }}
      >
        💬 Comments
      </div>

      {comments.map((c) => (
        <div
  key={c.id}
  style={{
    marginBottom: "8px",
    fontSize: "12px",
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "10px",
    padding: "8px 10px",
  }}
>
         <b
  style={{
    color: "#60a5fa",
    fontSize: "11px",
  }}
>
  {c.user_id.slice(0, 8)}
</b>
          <div>{c.comment}</div>
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
  onChange={(e) => setText(e.target.value)}
  placeholder="Write a comment..."
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
          onClick={addComment}
        >
          Send
        </button>
      </div>
    </div>
  );
}