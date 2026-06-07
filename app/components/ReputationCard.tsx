"use client";
import { useEffect, useState } from "react";

type Profile = { xp: number; level: number; streak_current: number; streak_best: number; display_name: string };
type Badge = { badge_slug: string; badges: { name: string; icon: string; description: string } };
type Progress = { xpForCurrentLevel: number; xpForNextLevel: number; xpInCurrentLevel: number };
type RecentXp = { event_type: string; xp_delta: number };

const LEVEL_NAMES: Record<number, string> = {
  1: "Newcomer", 2: "Curious", 3: "Engaged", 4: "Active",
  5: "Contributor", 6: "Veteran", 7: "Expert", 8: "Champion", 9: "Master", 10: "Legend",
};

const XP_LABELS: Record<string, string> = {
  poll_vote_cast: "Voted in poll",
  poll_received_vote: "Poll got vote",
  correct_prediction: "Correct prediction 🎯",
  question_upvoted: "Question upvoted",
  first_prediction: "Made prediction",
  poll_created: "Created poll",
};

export default function ReputationCard({ userId, compact = false }: { userId: string; compact?: boolean }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [recentXp, setRecentXp] = useState<RecentXp[]>([]);

  useEffect(() => {
    fetch(`/api/reputation?userId=${userId}`)
      .then((r) => r.json())
      .then((d) => { setProfile(d.profile); setBadges(d.badges); setProgress(d.progress); setRecentXp(d.recentXp); });
  }, [userId]);

  if (!profile || !progress) return null;

  const range = progress.xpForNextLevel - progress.xpForCurrentLevel;
  const pct = Math.min(100, Math.round((progress.xpInCurrentLevel / Math.max(1, range)) * 100));

  if (compact) {
    return (
      <div style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: "var(--r-lg)", padding: "14px", marginBottom: "16px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
          <div className="kv-level-orb" style={{ width: "38px", height: "38px", fontSize: "15px" }}>
            {profile.level}
          </div>
          <div>
            <div style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-1)" }}>
              {LEVEL_NAMES[Math.min(profile.level, 10)] ?? "Legend"}
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-3)", fontFamily: "var(--mono)" }}>
              {profile.xp.toLocaleString()} XP
            </div>
          </div>
          <div style={{ marginLeft: "auto", textAlign: "right" }}>
            <div style={{ fontSize: "14px" }}>
              {profile.streak_current >= 7 ? "⚡" : profile.streak_current >= 3 ? "🔥" : "💧"}
            </div>
            <div style={{ fontSize: "10px", color: "var(--text-3)", fontFamily: "var(--mono)" }}>
              {profile.streak_current}d
            </div>
          </div>
        </div>
        <div className="kv-xp-track">
          <div className="kv-xp-fill" style={{ width: `${pct}%` }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "5px", fontSize: "10px", color: "var(--text-3)", fontFamily: "var(--mono)" }}>
          <span>Lv {profile.level}</span>
          <span>{pct}%</span>
          <span>Lv {profile.level + 1}</span>
        </div>
        {badges.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "10px" }}>
            {badges.slice(0, 4).map((b) => (
              <span key={b.badge_slug} title={b.badges?.description}
                style={{ fontSize: "15px", cursor: "default" }}>
                {b.badges?.icon}
              </span>
            ))}
            {badges.length > 4 && (
              <span style={{ fontSize: "10px", color: "var(--text-3)", alignSelf: "center" }}>+{badges.length - 4}</span>
            )}
          </div>
        )}
      </div>
    );
  }

  // Full mode (not used in new layout but kept for backwards compat)
  return (
    <div className="kv-rep" style={{ marginBottom: "24px" }}>
      <div className="kv-level-orb">{profile.level}</div>
      <div>
        <div style={{ fontWeight: "700", fontSize: "15px", color: "var(--text-1)" }}>
          {LEVEL_NAMES[Math.min(profile.level, 10)] ?? "Legend"}
        </div>
        <div style={{ fontSize: "12px", color: "var(--text-3)", fontFamily: "var(--mono)", marginTop: "2px" }}>
          {profile.xp.toLocaleString()} XP
        </div>
        <div className="kv-xp-track" style={{ marginTop: "8px", width: "200px" }}>
          <div className="kv-xp-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "22px" }}>
          {profile.streak_current >= 7 ? "⚡" : profile.streak_current >= 3 ? "🔥" : "💧"}
        </div>
        <div style={{ fontWeight: "700", fontSize: "14px", color: "var(--amber)" }}>{profile.streak_current}d</div>
        <div style={{ fontSize: "10px", color: "var(--text-3)" }}>streak</div>
      </div>
    </div>
  );
}
