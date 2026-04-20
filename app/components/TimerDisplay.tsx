"use client";

import { formatMoney, formatDuration } from "@/lib/time-utils";
import type { DayStats } from "@/lib/types";

interface TimerDisplayProps {
  stats: DayStats;
}

export default function TimerDisplay({ stats }: TimerDisplayProps) {
  const isDanger = stats.moneyRemaining < stats.dailyValue * 0.2;

  return (
    <div className="ticker animate-in">
      <div className="ticker-glow" />
      <div className="ticker-label">{"// Remaining Value Today"}</div>
      <div className={`ticker-value${isDanger ? " danger" : ""}`}>
        {formatMoney(stats.moneyRemaining)}
      </div>
      <div className="ticker-row">
        <div className="ticker-sub">
          <span className="ticker-sub-label">Spent</span>
          <span className="ticker-sub-value" style={{ color: "var(--red)" }}>
            {formatMoney(stats.moneySpent)}
          </span>
        </div>
        <div className="ticker-sub">
          <span className="ticker-sub-label">Invested</span>
          <span
            className="ticker-sub-value"
            style={{ color: "var(--accent)" }}
          >
            {formatMoney(stats.moneyInvested)}
          </span>
        </div>
        <div className="ticker-sub">
          <span className="ticker-sub-label">Burn Rate</span>
          <span className="ticker-sub-value" style={{ color: "#444" }}>
            {formatMoney(stats.valuePerSecond)}/s
          </span>
        </div>
        <div className="ticker-sub">
          <span className="ticker-sub-label">Time Left</span>
          <span className="ticker-sub-value" style={{ color: "var(--blue)" }}>
            {formatDuration(stats.remainingSeconds)}
          </span>
        </div>
      </div>
    </div>
  );
}
