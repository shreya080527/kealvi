"use client";

import { useEffect, useState } from "react";
import QuestionsList from "./questions-list";

export default function Home() {
  const [polls, setPolls] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    loadPolls();
    loadQuestions();
  }, []);

  async function loadPolls() {
    const res = await fetch("/api/polls");
    const data = await res.json();
    setPolls(data);
  }

  async function loadQuestions() {
    const res = await fetch("/api/questions");
    const data = await res.json();

    setQuestions(data.questions || []);
    setHasMore(data.hasMore || false);
  }

  async function vote(optionId: string) {
    const res = await fetch("/api/vote", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ optionId }),
    });

    if (res.ok) {
      await loadPolls();
    }
  }

  return (
    <main
      style={{
        maxWidth: "700px",
        margin: "40px auto",
        padding: "20px",
      }}
    >
      <h1>Live Q&A</h1>

      {/* Poll Section */}
      {polls.map((poll) => (
        <div
          key={poll.id}
          style={{
            border: "1px solid #ccc",
            borderRadius: "10px",
            padding: "20px",
            marginBottom: "20px",
          }}
        >
          <h2>{poll.question}</h2>

          {poll.poll_options?.map((option: any) => (
            <button
              key={option.id}
              onClick={() => vote(option.id)}
              style={{
                width: "100%",
                padding: "15px",
                marginTop: "10px",
                textAlign: "left",
                border: "1px solid #ccc",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              {option.option_text} — {option.vote_count ?? 0} votes
            </button>
          ))}
        </div>
      ))}

      {/* Existing Questions Section */}
      <QuestionsList
        initialQuestions={questions}
        initialHasMore={hasMore}
      />
    </main>
  );
}