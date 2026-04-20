"use client";

import { formatDuration } from "@/lib/time-utils";
import type { DayStats } from "@/lib/types";

interface StatsGridProps {
  stats: DayStats;
  taskCount: number;
}

export default function StatsGrid({ stats, taskCount }: StatsGridProps) {
  const prodColor =
    stats.productivity > 60
      ? "var(--accent)"
      : stats.productivity > 30
        ? "var(--orange)"
        : "var(--red)";

  return (
    <div className="stats-grid">
      <div className="stat-card">
        <div className="stat-label">Productivity</div>
        <div className="stat-value" style={{ color: prodColor }}>
          {stats.productivity.toFixed(1)}%
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-label">Time Invested</div>
        <div className="stat-value" style={{ color: "var(--accent)" }}>
          {formatDuration(stats.investedSeconds)}
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-label">Tasks Today</div>
        <div className="stat-value" style={{ color: "var(--text)" }}>
          {taskCount}
        </div>
      </div>
    </div>
  );
}
