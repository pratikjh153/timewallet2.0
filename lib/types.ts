export interface Settings {
  id: number;
  dayStart: string;
  dayEnd: string;
  dailyValue: number;
  timezone: string;
}

export interface TaskRecord {
  id: number;
  title: string;
  startTime: string;
  endTime: string;
  category: string;
  date: string;
  createdAt: Date;
}

export interface DailyConfigRecord {
  id: number;
  date: string;
  dailyValue: number;
  investmentGoal: number;
  goalHit: boolean;
}

export interface DayStats {
  totalSeconds: number;
  elapsedSeconds: number;
  remainingSeconds: number;
  investedSeconds: number;
  spentSeconds: number;
  valuePerSecond: number;
  moneyRemaining: number;
  moneySpent: number;
  moneyInvested: number;
  productivity: number;
  spentPercent: number;
  investedPercent: number;
  remainingPercent: number;
  dailyValue: number;
  investmentGoal: number;
  goalHit: boolean;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  recentDays: {
    date: string;
    goalHit: boolean;
    investedPercent: number;
  }[];
}

export interface WeekDay {
  date: string;
  dayLabel: string;
  investedSeconds: number;
  spentSeconds: number;
  totalSeconds: number;
  moneyInvested: number;
  moneySpent: number;
  productivity: number;
  categories: Record<string, number>;
}

export const CATEGORIES = [
  "Work",
  "Health",
  "Learning",
  "Creative",
  "Personal",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_COLORS: Record<string, string> = {
  Work: "#c8f135",
  Health: "#6bceff",
  Learning: "#ff9f1c",
  Creative: "#ff6bcb",
  Personal: "#b084ff",
};
