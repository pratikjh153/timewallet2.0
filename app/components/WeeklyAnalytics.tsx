"use client";

import { formatDuration, formatMoney } from "@/lib/time-utils";
import { CATEGORY_COLORS } from "@/lib/types";
import type { WeekDay } from "@/lib/types";

interface WeeklyAnalyticsProps {
  weekData: WeekDay[];
}

export default function WeeklyAnalytics({ weekData }: WeeklyAnalyticsProps) {
  // Get max value for scaling bars
  const maxSeconds = Math.max(
    ...weekData.map((d) => d.investedSeconds + d.spentSeconds),
    1
  );

  // Aggregate categories across the week
  const catTotals: Record<string, number> = {};
  weekData.forEach((d) => {
    Object.entries(d.categories).forEach(([cat, secs]) => {
      catTotals[cat] = (catTotals[cat] || 0) + secs;
    });
  });
  const totalCatSeconds = Object.values(catTotals).reduce((a, b) => a + b, 0);

  // Weekly totals
  const totalInvested = weekData.reduce((a, d) => a + d.moneyInvested, 0);
  const avgProductivity =
    weekData.reduce((a, d) => a + d.productivity, 0) / weekData.length;
  const bestDay = weekData.reduce(
    (best, d) => (d.productivity > best.productivity ? d : best),
    weekData[0]
  );

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title">{"// Weekly Analytics"}</div>
      </div>

      {/* Bar Chart */}
      <div className="bar-chart">
        {weekData.map((day) => {
          const investedH =
            maxSeconds > 0
              ? (day.investedSeconds / maxSeconds) * 100
              : 0;
          const spentH =
            maxSeconds > 0 ? (day.spentSeconds / maxSeconds) * 100 : 0;

          return (
            <div key={day.date} className="bar-day">
              <div className="bar-percent">
                {day.productivity > 0
                  ? `${day.productivity.toFixed(0)}%`
                  : "—"}
              </div>
              <div className="bar-stack">
                <div
                  className="bar-invested"
                  style={{ height: `${investedH}%` }}
                />
                <div className="bar-spent" style={{ height: `${spentH}%` }} />
              </div>
              <div className="bar-label">{day.dayLabel}</div>
            </div>
          );
        })}
      </div>

      {/* Weekly Stats */}
      <div className="stats-grid" style={{ marginTop: 20 }}>
        <div className="stat-card">
          <div className="stat-label">Total Invested</div>
          <div
            className="stat-value"
            style={{ color: "var(--accent)", fontSize: 17 }}
          >
            {formatMoney(totalInvested)}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Avg Productivity</div>
          <div
            className="stat-value"
            style={{
              color:
                avgProductivity > 60
                  ? "var(--accent)"
                  : avgProductivity > 30
                    ? "var(--orange)"
                    : "var(--red)",
              fontSize: 17,
            }}
          >
            {avgProductivity.toFixed(1)}%
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Best Day</div>
          <div
            className="stat-value"
            style={{ color: "var(--blue)", fontSize: 17 }}
          >
            {bestDay?.dayLabel || "—"}
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      {totalCatSeconds > 0 && (
        <>
          <div
            className="panel-title"
            style={{ marginTop: 20, marginBottom: 12 }}
          >
            {"// Category Breakdown"}
          </div>
          <div className="cat-list">
            {Object.entries(catTotals)
              .sort((a, b) => b[1] - a[1])
              .map(([cat, secs]) => {
                const pct = (secs / totalCatSeconds) * 100;
                const color = CATEGORY_COLORS[cat] || "#555";
                return (
                  <div key={cat} className="cat-row">
                    <div
                      className="cat-dot"
                      style={{ background: color }}
                    />
                    <div className="cat-name">{cat}</div>
                    <div className="cat-bar-track">
                      <div
                        className="cat-bar-fill"
                        style={{
                          width: `${pct}%`,
                          background: color,
                        }}
                      />
                    </div>
                    <div className="cat-time">{formatDuration(secs)}</div>
                  </div>
                );
              })}
          </div>
        </>
      )}
    </div>
  );
}
