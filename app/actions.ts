"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { timeToSeconds } from "@/lib/time-utils";

function isValidTimezone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

function isValidHHmm(v: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(v);
}

function isValidDateString(v: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(v);
}

export async function saveSettings(formData: FormData) {
  try {
    const dayStart = String(formData.get("dayStart") ?? "");
    const dayEnd = String(formData.get("dayEnd") ?? "");
    const dailyValueRaw = String(formData.get("dailyValue") ?? "");
    const timezoneRaw = String(formData.get("timezone") ?? "UTC");

    if (!isValidHHmm(dayStart) || !isValidHHmm(dayEnd)) {
      return { error: "Day start and end must be valid times (HH:mm)." };
    }
    if (timeToSeconds(dayEnd) <= timeToSeconds(dayStart)) {
      return { error: "Day end must be after day start." };
    }

    const dailyValue = parseFloat(dailyValueRaw);
    if (!Number.isFinite(dailyValue) || dailyValue <= 0) {
      return { error: "Daily value must be a positive number." };
    }

    const timezone = isValidTimezone(timezoneRaw) ? timezoneRaw : "UTC";

    const existing = await prisma.userSettings.findFirst();

    if (existing) {
      await prisma.userSettings.update({
        where: { id: existing.id },
        data: { dayStart, dayEnd, dailyValue, timezone },
      });
    } else {
      await prisma.userSettings.create({
        data: { dayStart, dayEnd, dailyValue, timezone },
      });
    }

    revalidatePath("/");
    redirect("/");
  } catch (error) {
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
      throw error;
    }
    return {
      error: `Could not save settings: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

export async function saveDailyConfig(formData: FormData) {
  const date = String(formData.get("date") ?? "");
  const dailyValue = parseFloat(String(formData.get("dailyValue") ?? ""));
  const investmentGoal = parseFloat(
    String(formData.get("investmentGoal") ?? "")
  );

  if (!isValidDateString(date)) return { error: "Date is required." };
  if (!Number.isFinite(dailyValue) || dailyValue <= 0) {
    return { error: "Daily value must be a positive number." };
  }
  if (!Number.isFinite(investmentGoal) || investmentGoal < 1 || investmentGoal > 100) {
    return { error: "Investment goal must be between 1 and 100." };
  }

  await prisma.dailyConfig.upsert({
    where: { date },
    create: { date, dailyValue, investmentGoal },
    update: { dailyValue, investmentGoal },
  });

  revalidatePath("/");
  return { success: true };
}

export async function createTask(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const startTime = String(formData.get("startTime") ?? "");
  const endTime = String(formData.get("endTime") ?? "");
  const category = String(formData.get("category") ?? "Work") || "Work";
  const date = String(formData.get("date") ?? "");

  if (!title) return { error: "Add a task title." };
  if (title.length > 200) return { error: "Task title is too long." };
  if (!isValidHHmm(startTime) || !isValidHHmm(endTime)) {
    return { error: "Start and end times required." };
  }
  if (!isValidDateString(date)) return { error: "Invalid date." };
  if (timeToSeconds(endTime) <= timeToSeconds(startTime)) {
    return { error: "End time must be after start time." };
  }

  const existingTasks = await prisma.task.findMany({ where: { date } });
  const ns = timeToSeconds(startTime);
  const ne = timeToSeconds(endTime);
  const overlap = existingTasks.some((t) => {
    const ts = timeToSeconds(t.startTime);
    const te = timeToSeconds(t.endTime);
    return ns < te && ne > ts;
  });

  if (overlap) {
    return { error: "This time range overlaps with an existing task." };
  }

  await prisma.task.create({
    data: { title, startTime, endTime, category, date },
  });

  revalidatePath("/");
  return { success: true };
}

export async function updateTask(formData: FormData) {
  const id = parseInt(String(formData.get("id") ?? ""), 10);
  const title = String(formData.get("title") ?? "").trim();
  const startTime = String(formData.get("startTime") ?? "");
  const endTime = String(formData.get("endTime") ?? "");
  const category = String(formData.get("category") ?? "Work") || "Work";
  const date = String(formData.get("date") ?? "");

  if (!Number.isFinite(id)) return { error: "Invalid task id." };
  if (!title) return { error: "Add a task title." };
  if (title.length > 200) return { error: "Task title is too long." };
  if (!isValidHHmm(startTime) || !isValidHHmm(endTime)) {
    return { error: "Start and end times required." };
  }
  if (!isValidDateString(date)) return { error: "Invalid date." };
  if (timeToSeconds(endTime) <= timeToSeconds(startTime)) {
    return { error: "End time must be after start time." };
  }

  const existingTasks = await prisma.task.findMany({ where: { date } });
  const ns = timeToSeconds(startTime);
  const ne = timeToSeconds(endTime);
  const overlap = existingTasks.some((t) => {
    if (t.id === id) return false;
    const ts = timeToSeconds(t.startTime);
    const te = timeToSeconds(t.endTime);
    return ns < te && ne > ts;
  });

  if (overlap) {
    return { error: "This time range overlaps with an existing task." };
  }

  await prisma.task.update({
    where: { id },
    data: { title, startTime, endTime, category },
  });

  revalidatePath("/");
  return { success: true };
}

export async function deleteTask(id: number) {
  if (!Number.isFinite(id)) return { error: "Invalid task id." };
  await prisma.task.delete({ where: { id } });
  revalidatePath("/");
  return { success: true };
}

export async function syncTimezone(timezone: string) {
  if (!isValidTimezone(timezone)) return { error: "Invalid timezone." };
  const existing = await prisma.userSettings.findFirst();
  if (!existing) return { error: "No settings to update." };
  if (existing.timezone === timezone) return { success: true };

  await prisma.userSettings.update({
    where: { id: existing.id },
    data: { timezone },
  });
  revalidatePath("/");
  return { success: true };
}

export async function updateDailyGoalStatus(date: string, goalHit: boolean) {
  if (!isValidDateString(date)) return { error: "Invalid date." };
  await prisma.dailyConfig.upsert({
    where: { date },
    create: { date, goalHit },
    update: { goalHit },
  });
  revalidatePath("/");
  return { success: true };
}
