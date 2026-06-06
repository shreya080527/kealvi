"use client";
import React from "react";
export default function UserPollCard({
  poll,
  userId,
  onVoteChange,
}: any) {
  const options = poll.poll_options || [];
async function handleVote(optionId: string) {
  try {
    const res = await fetch("/api/vote", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        optionId,
        pollId: poll.id,
        voterId: userId,
      }),
    });

    const data = await res.json();

    console.log(data);

    if (onVoteChange) {
      onVoteChange();
    }
  } catch (err) {
    console.error(err);
  }
}
  const totalVotes = options.reduce(
    (sum: number, opt: any) => sum + (opt.vote_count || 0),
    0
  );
const rankedOptions = [...options].sort(
  (a: any, b: any) => b.vote_count - a.vote_count
);

const winner =
  totalVotes > 0
    ? rankedOptions[0]
    : null;
const prediction =
  winner && totalVotes > 0
    ? Math.round((winner.vote_count / totalVotes) * 100)
    : 0;
let timeRemaining = "No end date";

if (poll.closes_at) {
  const end = new Date(poll.closes_at).getTime();
  const now = Date.now();

  const diff = end - now;

  if (diff > 0) {
    const days = Math.floor(
      diff / (1000 * 60 * 60 * 24)
    );

    const hours = Math.floor(
      (diff % (1000 * 60 * 60 * 24)) /
      (1000 * 60 * 60)
    );

    timeRemaining = `${days}d ${hours}h`;
  } else {
    timeRemaining = "Poll Closed";
  }
}

  return (
    <div
      style={{
        border: "1px solid #ddd",
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
      }}
    >
      <h3>{poll.question}</h3>

    <p>
  👥 Total Participants: {totalVotes}
</p>

     {rankedOptions.map((opt: any, index: number) => {
        const percent =
          totalVotes > 0
            ? Math.round((opt.vote_count / totalVotes) * 100)
            : 0;

        return (
          <div key={opt.id} style={{ marginBottom: 10 }}>
           <button
  onClick={() => handleVote(opt.id)}
  style={{
    width: "100%",
    padding: "12px",
    border: "1px solid #ddd",
    borderRadius: "10px",
    cursor: "pointer",
    textAlign: "left",
    background: "#fff",
  }}
>
  ▲ {opt.option_text}
</button>

            <div
              style={{
                background: "#eee",
                height: 10,
                borderRadius: 10,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${percent}%`,
                  background: "#4f46e5",
                  height: "100%",
                }}
              />
            </div>

           <div>
  👥 {opt.vote_count} votes ({percent}%)
</div>

<div style={{ color: "#666" }}>
  ▼
</div>
          </div>
        );
      })}

     {winner && (
  <div
    style={{
      marginTop: 15,
      paddingTop: 10,
      borderTop: "1px solid #eee",
    }}
  >
    <div style={{ fontWeight: "bold", color: "green" }}>
      🏆 Leading: {winner.option_text}
    </div>

    <div>
      📈 Prediction: {winner.option_text} likely to win ({prediction}%)
    </div>

    <div>
      ⏳ Ends in: {timeRemaining}
    </div>
  </div>
)}

</div>
);
}