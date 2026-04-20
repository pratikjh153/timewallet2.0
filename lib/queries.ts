import { prisma } from "./db";
import type { StreakData, WeekDay } from "./types";
import { timeToSeconds, getDateStringDaysAgo, getDayLabel, secondsNow } from "./time-utils";

export async function getSettings() {
  return prisma.userSettings.findFirst();
}

export async function getDailyConfig(date: string) {
  return prisma.dailyConfig.findUnique({ where: { date } });
}

export async function getTasksForDate(date: string) {
  return prisma.task.findMany({
    where: { date },
    orderBy: { createdAt: "desc" },
  });
}

export async function getTasksForDateRange(startDate: string, endDate: string) {
  return prisma.task.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
    },
    orderBy: { date: "asc" },
  });
}

export async function getStreakData(timezone: string): Promise<StreakData> {
  const configs = await prisma.dailyConfig.findMany({
    orderBy: { date: "desc" },
    take: 60,
  });

  const configMap = new Map(configs.map((c) => [c.date, c]));

  const recentDays: StreakData["recentDays"] = [];
  for (let i = 29; i >= 0; i--) {
    const date = getDateStringDaysAgo(i, timezone);
    const config = configMap.get(date);
    recentDays.push({
      date,
      goalHit: config?.goalHit ?? false,
      investedPercent: 0,
    });
  }

  let currentStreak = 0;
  for (let i = 1; i <= 60; i++) {
    const date = getDateStringDaysAgo(i, timezone);
    const config = configMap.get(date);
    if (config?.goalHit) {
      currentStreak++;
    } else {
      break;
    }
  }

  let longestStreak = 0;
  let streak = 0;
  for (let i = 59; i >= 0; i--) {
    const date = getDateStringDaysAgo(i, timezone);
    const config = configMap.get(date);
    if (config?.goalHit) {
      streak++;
      longestStreak = Math.max(longestStreak, streak);
    } else {
      streak = 0;
    }
  }

  return { currentStreak, longestStreak, recentDays };
}

export async function getWeeklyData(settings: {
  dayStart: string;
  dayEnd: string;
  dailyValue: number;
  timezone: string;
}): Promise<WeekDay[]> {
  const startS = timeToSeconds(settings.dayStart);
  const endS = timeToSeconds(settings.dayEnd);
  const totalSeconds = endS - startS;

  const dates: string[] = [];
  for (let i = 6; i >= 0; i--) {
    dates.push(getDateStringDaysAgo(i, settings.timezone));
  }
  const startDate = dates[0];
  const endDate = dates[dates.length - 1];

  const [allTasks, allConfigs] = await Promise.all([
    prisma.task.findMany({
      where: { date: { gte: startDate, lte: endDate } },
    }),
    prisma.dailyConfig.findMany({
      where: { date: { gte: startDate, lte: endDate } },
    }),
  ]);

  const tasksByDate = new Map<string, typeof allTasks>();
  for (const t of allTasks) {
    const arr = tasksByDate.get(t.date) ?? [];
    arr.push(t);
    tasksByDate.set(t.date, arr);
  }
  const configByDate = new Map(allConfigs.map((c) => [c.date, c]));

  const curS = secondsNow(settings.timezone);
  const today = dates[dates.length - 1];

  return dates.map((date) => {
    const tasks = tasksByDate.get(date) ?? [];
    const config = configByDate.get(date);
    const dailyValue = config?.dailyValue ?? settings.dailyValue;
    const vps = totalSeconds > 0 ? dailyValue / totalSeconds : 0;

    const investedSeconds = tasks.reduce(
      (acc, t) => acc + (timeToSeconds(t.endTime) - timeToSeconds(t.startTime)),
      0
    );

    const categories: Record<string, number> = {};
    for (const t of tasks) {
      const secs = timeToSeconds(t.endTime) - timeToSeconds(t.startTime);
      categories[t.category] = (categories[t.category] || 0) + secs;
    }

    const isToday = date === today;
    const spentSeconds = isToday
      ? Math.max(
          0,
          Math.max(0, Math.min(curS - startS, totalSeconds)) - investedSeconds
        )
      : Math.max(0, totalSeconds - investedSeconds);

    return {
      date,
      dayLabel: getDayLabel(date),
      investedSeconds,
      spentSeconds,
      totalSeconds,
      moneyInvested: investedSeconds * vps,
      moneySpent: spentSeconds * vps,
      productivity:
        totalSeconds > 0
          ? Math.min(100, (investedSeconds / totalSeconds) * 100)
          : 0,
      categories,
    };
  });
}
