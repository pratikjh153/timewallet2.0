"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveSettings } from "@/app/actions";
import type { Settings } from "@/lib/types";
import { getBrowserTimezone, timeToSeconds } from "@/lib/time-utils";

interface OnboardingFormProps {
  existing?: Settings | null;
}

export default function OnboardingForm({ existing }: OnboardingFormProps) {
  const router = useRouter();
  const [dayStart, setDayStart] = useState(existing?.dayStart || "06:00");
  const [dayEnd, setDayEnd] = useState(existing?.dayEnd || "22:00");
  const [dailyValue, setDailyValue] = useState(
    String(existing?.dailyValue || "10000")
  );
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    setError("");
    if (timeToSeconds(dayEnd) <= timeToSeconds(dayStart)) {
      setError("Day end must be after day start.");
      return;
    }

    const fd = new FormData();
    fd.set("dayStart", dayStart);
    fd.set("dayEnd", dayEnd);
    fd.set("dailyValue", dailyValue);
    fd.set("timezone", getBrowserTimezone());

    startTransition(async () => {
      try {
        const result = await saveSettings(fd);
        if (result?.error) {
          setError(result.error);
        } else {
          router.refresh();
        }
      } catch (err) {
        setError(
          `Something went wrong: ${err instanceof Error ? err.message : "Unknown error"}`
        );
      }
    });
  };

  return (
    <div className="app-container">
      <div className="header">
        <div className="logo">TIME // MONEY</div>
      </div>
      <div className="form-view animate-in">
        <div className="form-title">
          Define Your
          <br />
          Day&apos;s Worth.
        </div>
        <div className="form-subtitle">
          {"// configure your time-as-money engine"}
        </div>

        <div className="field">
          <label className="field-label">Day Start</label>
          <input
            type="time"
            className="field-input"
            value={dayStart}
            onChange={(e) => setDayStart(e.target.value)}
          />
        </div>

        <div className="field">
          <label className="field-label">Day End</label>
          <input
            type="time"
            className="field-input"
            value={dayEnd}
            onChange={(e) => setDayEnd(e.target.value)}
          />
        </div>

        <div className="field">
          <label className="field-label">Default Daily Value (USD)</label>
          <input
            type="number"
            className="field-input"
            value={dailyValue}
            min="1"
            max="9999999"
            onChange={(e) => setDailyValue(e.target.value)}
          />
        </div>

        {error && <div className="field-error">⚠ {error}</div>}

        <button
          className="submit-btn"
          onClick={handleSubmit}
          disabled={isPending}
        >
          {isPending
            ? "Activating..."
            : existing
              ? "Update Settings →"
              : "Activate Tracker →"}
        </button>
      </div>
    </div>
  );
}
