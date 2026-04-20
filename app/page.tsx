import {
  getSettings,
  getDailyConfig,
  getTasksForDate,
  getStreakData,
  getWeeklyData,
} from "@/lib/queries";
import { getTodayDateString } from "@/lib/time-utils";
import OnboardingForm from "./components/OnboardingForm";
import DashboardShell from "./components/DashboardShell";

export const dynamic = "force-dynamic";

export default async function Home() {
  const settings = await getSettings();

  if (!settings) {
    return <OnboardingForm />;
  }

  const today = getTodayDateString(settings.timezone);
  const [tasks, dailyConfig, streakData, weekData] = await Promise.all([
    getTasksForDate(today),
    getDailyConfig(today),
    getStreakData(settings.timezone),
    getWeeklyData(settings),
  ]);

  return (
    <DashboardShell
      settings={{
        id: settings.id,
        dayStart: settings.dayStart,
        dayEnd: settings.dayEnd,
        dailyValue: settings.dailyValue,
        timezone: settings.timezone,
      }}
      initialTasks={tasks.map((t) => ({
        id: t.id,
        title: t.title,
        startTime: t.startTime,
        endTime: t.endTime,
        category: t.category,
        date: t.date,
        createdAt: t.createdAt,
      }))}
      initialDailyConfig={dailyConfig}
      streakData={streakData}
      weekData={weekData}
      today={today}
    />
  );
}
