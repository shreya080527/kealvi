"use client";
import { useEffect, useState } from "react";

type Profile = {
  xp: number;
  level: number;
  streak_current: number;
  streak_best: number;
  display_name: string;
};

type Badge = {
  badge_slug: string;
  earned_at: string;
  badges: { name: string; icon: string; description: string };
};

type Progress = {
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  xpInCurrentLevel: number;
  xpNeededForNextLevel: number;
};

type RecentXp = {
  event_type: string;
  xp_delta: number;
  created_at: string;
};

const LEVEL_NAMES: Record<number, string> = {
  1: "Newcomer", 2: "Curious", 3: "Engaged", 4: "Active",
  5: "Contributor", 6: "Veteran", 7: "Expert", 8: "Champion",
  9: "Master", 10: "Legend",
};

const XP_EVENT_LABELS: Record<string, string> = {
  poll_vote_cast: "Voted in poll",
  poll_received_vote: "Poll got a vote",
  correct_prediction: "Correct prediction! 🎯",
  question_upvoted: "Question upvoted",
  first_prediction: "Made a prediction",
  streak_bonus: "Streak bonus",
};

export default function ReputationCard({ userId }: { userId: string }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [recentXp, setRecentXp] = useState<RecentXp[]>([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetch(`/api/reputation?userId=${userId}`)
      .then((r) => r.json())
      .then((d) => {
        setProfile(d.profile);
        setBadges(d.badges);
        setProgress(d.progress);
        setRecentXp(d.recentXp);
      });
  }, [userId]);

  if (!profile || !progress) return null;

  const pct = Math.min(
    100,
    Math.round((progress.xpInCurrentLevel / Math.max(1, progress.xpForNextLevel - progress.xpForCurrentLevel)) * 100)
  );

  return (
    <div style={{
      border: "1px solid #e2e8f0",
      borderRadius: "16px",
      padding: "20px",
      marginBottom: "24px",
      background: "linear-gradient(135deg, #f8faff 0%, #f0f4ff 100%)",
    }}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          {/* Level badge */}
          <div style={{
            width: "52px", height: "52px", borderRadius: "50%",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "20px", fontWeight: "bold", color: "white",
            boxShadow: "0 4px 12px rgba(99,102,241,0.4)",
          }}>
            {profile.level}
          </div>
          <div>
            <div style={{ fontWeight: "700", fontSize: "16px", color: "#1e293b" }}>
              {LEVEL_NAMES[Math.min(profile.level, 10)] ?? "Legend"}
            </div>
            <div style={{ fontSize: "13px", color: "#64748b" }}>
              {profile.xp.toLocaleString()} XP total
            </div>
          </div>
        </div>

        {/* Streak */}
        <div style={{
          display: "flex", alignItems: "center", gap: "6px",
          background: profile.streak_current >= 3 ? "#fff7ed" : "#f8fafc",
          border: `1px solid ${profile.streak_current >= 3 ? "#fed7aa" : "#e2e8f0"}`,
          borderRadius: "24px", padding: "8px 14px",
        }}>
          <span style={{ fontSize: "18px" }}>
            {profile.streak_current >= 7 ? "⚡" : profile.streak_current >= 3 ? "🔥" : "💧"}
          </span>
          <div>
            <div style={{ fontWeight: "700", fontSize: "15px", color: "#92400e" }}>
              {profile.streak_current} day streak
            </div>
            <div style={{ fontSize: "11px", color: "#b45309" }}>Best: {profile.streak_best}</div>
          </div>
        </div>
      </div>

      {/* XP Progress bar */}
      <div style={{ marginTop: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#64748b", marginBottom: "6px" }}>
          <span>Level {profile.level} → {profile.level + 1}</span>
          <span>{progress.xpInCurrentLevel} / {progress.xpForNextLevel - progress.xpForCurrentLevel} XP</span>
        </div>
        <div style={{ height: "8px", background: "#e2e8f0", borderRadius: "999px", overflow: "hidden" }}>
          <div style={{
            height: "100%", width: `${pct}%`,
            background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
            borderRadius: "999px",
            transition: "width 0.6s ease",
          }} />
        </div>
      </div>

      {/* Badges row */}
      {badges.length > 0 && (
        <div style={{ marginTop: "14px" }}>
          <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", marginBottom: "8px" }}>
            BADGES ({badges.length})
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {badges.slice(0, expanded ? undefined : 6).map((b) => (
              <div
                key={b.badge_slug}
                title={b.badges?.description}
                style={{
                  background: "white",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  padding: "6px 10px",
                  fontSize: "13px",
                  display: "flex", alignItems: "center", gap: "5px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                  cursor: "default",
                }}
              >
                <span>{b.badges?.icon}</span>
                <span style={{ color: "#374151", fontWeight: "500" }}>{b.badges?.name}</span>
              </div>
            ))}
            {badges.length > 6 && (
              <button
                onClick={() => setExpanded(!expanded)}
                style={{
                  background: "transparent", border: "1px dashed #cbd5e1",
                  borderRadius: "8px", padding: "6px 10px",
                  fontSize: "13px", color: "#6366f1", cursor: "pointer",
                }}
              >
                {expanded ? "Show less" : `+${badges.length - 6} more`}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Recent XP events */}
      {recentXp.length > 0 && (
        <details style={{ marginTop: "14px" }}>
          <summary style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", cursor: "pointer" }}>
            RECENT ACTIVITY
          </summary>
          <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "4px" }}>
            {recentXp.slice(0, 5).map((e, i) => (
              <div key={i} style={{
                display: "flex", justifyContent: "space-between",
                fontSize: "13px", color: "#374151", padding: "4px 0",
                borderBottom: "1px solid #f1f5f9",
              }}>
                <span>{XP_EVENT_LABELS[e.event_type] ?? e.event_type}</span>
                <span style={{ color: "#16a34a", fontWeight: "600" }}>+{e.xp_delta} XP</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
