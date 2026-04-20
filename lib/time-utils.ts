import type { TaskRecord, DayStats, DailyConfigRecord, Settings } from "./types";

/** Convert "HH:mm" string to total seconds since midnight */
export function timeToSeconds(str: string): number {
  if (!str) return 0;
  const [h, m] = str.split(":").map(Number);
  return h * 3600 + m * 60;
}

/**
 * Get the components (year, month, day, hour, minute, second) of a Date as
 * seen in the given IANA timezone. Works on both server and client because
 * it uses Intl.DateTimeFormat rather than the host's local TZ.
 */
function partsInTimeZone(date: Date, timeZone: string) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts: Record<string, string> = {};
  for (const p of fmt.formatToParts(date)) {
    if (p.type !== "literal") parts[p.type] = p.value;
  }
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour === "24" ? "00" : parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

/** Get seconds since local midnight in the given timezone */
export function secondsNow(timeZone: string): number {
  const p = partsInTimeZone(new Date(), timeZone);
  return p.hour * 3600 + p.minute * 60 + p.second;
}

/** Format seconds as human-readable duration */
export function formatDuration(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

/** Format number as USD currency */
export function formatMoney(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.max(0, n));
}

/** Get current time as "HH:mm" string in the given timezone */
export function getCurrentTimeHHMM(timeZone: string): string {
  const p = partsInTimeZone(new Date(), timeZone);
  return `${String(p.hour).padStart(2, "0")}:${String(p.minute).padStart(2, "0")}`;
}

/** Get today's date as "YYYY-MM-DD" in the given timezone */
export function getTodayDateString(timeZone: string): string {
  const p = partsInTimeZone(new Date(), timeZone);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

/** Get date string for N days ago in the given timezone */
export function getDateStringDaysAgo(daysAgo: number, timeZone: string): string {
  const now = new Date();
  const shifted = new Date(now.getTime() - daysAgo * 86400 * 1000);
  const p = partsInTimeZone(shifted, timeZone);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

/**
 * Best-effort browser timezone detection. Returns "UTC" on the server
 * or when unavailable.
 */
export function getBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

/** Format a "YYYY-MM-DD" date string to short day label like "Mon" */
export function getDayLabel(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00Z");
  return d.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
}

/** Validate that end time is after start time */
export function validateTimeRange(start: string, end: string): boolean {
  return timeToSeconds(end) > timeToSeconds(start);
}

/** Check if a new time range overlaps with existing tasks */
export function checkTimeOverlap(
  tasks: TaskRecord[],
  newStart: string,
  newEnd: string,
  excludeTaskId?: number
): boolean {
  const ns = timeToSeconds(newStart);
  const ne = timeToSeconds(newEnd);

  return tasks.some((task) => {
    if (excludeTaskId && task.id === excludeTaskId) return false;
    const ts = timeToSeconds(task.startTime);
    const te = timeToSeconds(task.endTime);
    return ns < te && ne > ts;
  });
}

/** Calculate all dashboard stats for the current moment */
export function calculateDayStats(
  settings: Settings,
  tasks: TaskRecord[],
  dailyConfig?: DailyConfigRecord | null
): DayStats {
  const startS = timeToSeconds(settings.dayStart);
  const endS = timeToSeconds(settings.dayEnd);
  const totalSeconds = endS - startS;

  const dailyValue = dailyConfig?.dailyValue ?? settings.dailyValue;
  const investmentGoal = dailyConfig?.investmentGoal ?? 50;
  const valuePerSecond = totalSeconds > 0 ? dailyValue / totalSeconds : 0;

  const curS = secondsNow(settings.timezone);
  const elapsedSeconds = Math.max(0, Math.min(curS - startS, totalSeconds));
  const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds);

  const investedSeconds = tasks.reduce(
    (acc, t) => acc + (timeToSeconds(t.endTime) - timeToSeconds(t.startTime)),
    0
  );
  const spentSeconds = Math.max(0, elapsedSeconds - investedSeconds);

  const moneyRemaining = remainingSeconds * valuePerSecond;
  const moneySpent = spentSeconds * valuePerSecond;
  const moneyInvested = investedSeconds * valuePerSecond;
  const productivity =
    elapsedSeconds > 0
      ? Math.min(100, (investedSeconds / elapsedSeconds) * 100)
      : 0;

  const goalHit = productivity >= investmentGoal;

  return {
    totalSeconds,
    elapsedSeconds,
    remainingSeconds,
    investedSeconds,
    spentSeconds,
    valuePerSecond,
    moneyRemaining,
    moneySpent,
    moneyInvested,
    productivity,
    spentPercent:
      totalSeconds > 0
        ? parseFloat(((spentSeconds / totalSeconds) * 100).toFixed(1))
        : 0,
    investedPercent:
      totalSeconds > 0
        ? parseFloat(((investedSeconds / totalSeconds) * 100).toFixed(1))
        : 0,
    remainingPercent:
      totalSeconds > 0
        ? parseFloat(((remainingSeconds / totalSeconds) * 100).toFixed(1))
        : 0,
    dailyValue,
    investmentGoal,
    goalHit,
  };
}
