"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { calculateDayStats, getBrowserTimezone } from "@/lib/time-utils";
import type {
  Settings,
  TaskRecord,
  DailyConfigRecord,
  StreakData,
  WeekDay,
} from "@/lib/types";
import {
  saveDailyConfig,
  updateDailyGoalStatus,
  syncTimezone,
} from "@/app/actions";
import OnboardingForm from "./OnboardingForm";
import TimerDisplay from "./TimerDisplay";
import ProgressBar from "./ProgressBar";
import StatsGrid from "./StatsGrid";
import TaskForm from "./TaskForm";
import TaskList from "./TaskList";
import CalendarStreak from "./CalendarStreak";
import WeeklyAnalytics from "./WeeklyAnalytics";

interface DashboardShellProps {
  settings: Settings;
  initialTasks: TaskRecord[];
  initialDailyConfig: DailyConfigRecord | null;
  streakData: StreakData;
  weekData: WeekDay[];
  today: string;
}

type View = "dashboard" | "analytics";

export default function DashboardShell({
  settings,
  initialTasks,
  initialDailyConfig,
  streakData,
  weekData,
  today,
}: DashboardShellProps) {
  const [, setTick] = useState(0);
  const [view, setView] = useState<View>("dashboard");
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskRecord | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showDailyConfig, setShowDailyConfig] = useState(false);

  const [localDailyValue, setLocalDailyValue] = useState(
    String(initialDailyConfig?.dailyValue ?? settings.dailyValue)
  );
  const [localGoal, setLocalGoal] = useState(
    String(initialDailyConfig?.investmentGoal ?? 50)
  );
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // If the browser is in a different timezone than what we have stored
  // (e.g. user traveled, or the timezone was unknown on first save), keep
  // the server side in sync so "today" and elapsed-seconds stay correct.
  useEffect(() => {
    const tz = getBrowserTimezone();
    if (tz && tz !== settings.timezone) {
      syncTimezone(tz).catch(() => {});
    }
  }, [settings.timezone]);

  const stats = calculateDayStats(settings, initialTasks, initialDailyConfig);

  // Persist goal-hit transitions. Tracks the last value we pushed so we don't
  // re-send the same state repeatedly. Works even when there is no daily
  // config row yet (first write creates it via upsert).
  const lastPushedGoalHit = useRef<boolean | null>(
    initialDailyConfig?.goalHit ?? null
  );

  useEffect(() => {
    const shouldBeHit = stats.goalHit;
    if (lastPushedGoalHit.current === shouldBeHit) return;

    const handle = setTimeout(() => {
      lastPushedGoalHit.current = shouldBeHit;
      updateDailyGoalStatus(today, shouldBeHit).catch(() => {
        // If the write fails we'll retry on next change; don't break UI.
        lastPushedGoalHit.current = null;
      });
    }, 5_000);

    return () => clearTimeout(handle);
  }, [stats.goalHit, today]);

  const handleSaveDailyConfig = () => {
    const fd = new FormData();
    fd.set("date", today);
    fd.set("dailyValue", localDailyValue);
    fd.set("investmentGoal", localGoal);

    startTransition(async () => {
      await saveDailyConfig(fd);
      setShowDailyConfig(false);
    });
  };

  if (showSettings) {
    return <OnboardingForm existing={settings} />;
  }

  return (
    <div className="app-container">
      <div className="header">
        <div className="logo">TIME // MONEY</div>
        <div className="nav">
          <button
            className={`btn ${view === "dashboard" ? "btn-active" : ""}`}
            onClick={() => setView("dashboard")}
          >
            Dashboard
          </button>
          <button
            className={`btn ${view === "analytics" ? "btn-active" : ""}`}
            onClick={() => setView("analytics")}
          >
            Analytics
          </button>
          <button className="btn" onClick={() => setShowSettings(true)}>
            Settings
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              setEditingTask(null);
              setShowTaskForm(true);
            }}
          >
            + Log Work
          </button>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div className={`goal-indicator ${stats.goalHit ? "hit" : "miss"}`}>
            {stats.goalHit ? "✓" : "○"} Goal: {stats.investmentGoal}% invested
          </div>
          <button
            className="btn"
            onClick={() => setShowDailyConfig(!showDailyConfig)}
            style={{ fontSize: 10, padding: "6px 12px" }}
          >
            {showDailyConfig ? "Close" : "Edit Today"}
          </button>
        </div>

        {showDailyConfig && (
          <div className="daily-config animate-in" style={{ marginTop: 10 }}>
            <div className="field">
              <label className="field-label">Today&apos;s Value ($)</label>
              <input
                type="number"
                className="field-input"
                value={localDailyValue}
                onChange={(e) => setLocalDailyValue(e.target.value)}
                min="1"
              />
            </div>
            <div className="field">
              <label className="field-label">Investment Goal (%)</label>
              <input
                type="number"
                className="field-input"
                value={localGoal}
                onChange={(e) => setLocalGoal(e.target.value)}
                min="1"
                max="100"
              />
            </div>
            <button
              className="btn btn-primary"
              onClick={handleSaveDailyConfig}
              disabled={isPending}
              style={{ alignSelf: "flex-end", padding: "10px 20px" }}
            >
              {isPending ? "..." : "Save"}
            </button>
          </div>
        )}
      </div>

      {view === "dashboard" ? (
        <>
          <TimerDisplay stats={stats} />
          <ProgressBar stats={stats} />
          <StatsGrid stats={stats} taskCount={initialTasks.length} />
          <TaskList
            tasks={initialTasks}
            valuePerSecond={stats.valuePerSecond}
            moneyInvested={stats.moneyInvested}
            onEditTask={(task) => {
              setEditingTask(task);
              setShowTaskForm(true);
            }}
          />
          <CalendarStreak streakData={streakData} today={today} />
          <div className="footer-info">
            {settings.dayStart} → {settings.dayEnd} · $
            {parseFloat(String(stats.dailyValue)).toLocaleString()}/day · $
            {(stats.valuePerSecond * 3600).toFixed(2)}/hr
          </div>
        </>
      ) : (
        <>
          <WeeklyAnalytics weekData={weekData} />
          <CalendarStreak streakData={streakData} today={today} />
        </>
      )}

      {showTaskForm && (
        <TaskForm
          onClose={() => {
            setShowTaskForm(false);
            setEditingTask(null);
          }}
          editTask={editingTask}
          today={today}
          timezone={settings.timezone}
        />
      )}
    </div>
  );
}
