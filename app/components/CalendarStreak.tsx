"use client";

import type { StreakData } from "@/lib/types";

interface CalendarStreakProps {
  streakData: StreakData;
  today: string;
}

export default function CalendarStreak({
  streakData,
  today,
}: CalendarStreakProps) {
  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title">{"// Streak Calendar"}</div>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--accent)",
            letterSpacing: ".15em",
          }}
        >
          Last 30 Days
        </div>
      </div>

      <div className="streak-grid">
        {streakData.recentDays.map((day) => (
          <div
            key={day.date}
            className={`streak-cell${day.goalHit ? " hit" : ""}${day.date === today ? " today" : ""}`}
            title={`${day.date}${day.goalHit ? " ✓ Goal Hit" : ""}`}
          />
        ))}
      </div>

      <div className="streak-stats">
        <div className="streak-stat">
          <span className="streak-number">
            🔥 {streakData.currentStreak}
          </span>
          <span className="streak-label">Current</span>
        </div>
        <div className="streak-stat">
          <span className="streak-number" style={{ color: "var(--blue)" }}>
            {streakData.longestStreak}
          </span>
          <span className="streak-label">Best</span>
        </div>
      </div>
    </div>
  );
}
