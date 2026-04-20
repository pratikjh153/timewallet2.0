"use client";

import type { DayStats } from "@/lib/types";

interface ProgressBarProps {
  stats: DayStats;
}

export default function ProgressBar({ stats }: ProgressBarProps) {
  return (
    <div className="progress-wrap">
      <div className="progress-bar">
        <div
          className="progress-spent"
          style={{ width: `${stats.spentPercent}%` }}
        />
        <div
          className="progress-invested"
          style={{ width: `${stats.investedPercent}%` }}
        />
      </div>
      <div className="progress-labels">
        <span className="progress-label" style={{ color: "var(--red)" }}>
          ■ SPENT {stats.spentPercent}%
        </span>
        <span className="progress-label" style={{ color: "var(--accent)" }}>
          ■ INVESTED {stats.investedPercent}%
        </span>
        <span className="progress-label">
          {stats.remainingPercent}% REMAINING
        </span>
      </div>
    </div>
  );
}
