"use client";

import { useState, useTransition } from "react";
import { createTask, updateTask } from "@/app/actions";
import { getCurrentTimeHHMM } from "@/lib/time-utils";
import { CATEGORIES } from "@/lib/types";
import type { TaskRecord } from "@/lib/types";

interface TaskFormProps {
  onClose: () => void;
  editTask?: TaskRecord | null;
  today: string;
  timezone: string;
}

export default function TaskForm({
  onClose,
  editTask,
  today,
  timezone,
}: TaskFormProps) {
  const [title, setTitle] = useState(editTask?.title || "");
  const [startTime, setStartTime] = useState(
    editTask?.startTime || getCurrentTimeHHMM(timezone)
  );
  const [endTime, setEndTime] = useState(
    editTask?.endTime || getCurrentTimeHHMM(timezone)
  );
  const [category, setCategory] = useState(editTask?.category || "Work");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    setError("");

    const fd = new FormData();
    fd.set("title", title);
    fd.set("startTime", startTime);
    fd.set("endTime", endTime);
    fd.set("category", category);
    fd.set("date", editTask?.date || today);

    if (editTask) {
      fd.set("id", String(editTask.id));
    }

    startTransition(async () => {
      const result = editTask ? await updateTask(fd) : await createTask(fd);
      if (result?.error) {
        setError(result.error);
      } else {
        onClose();
      }
    });
  };

  return (
    <div className="glass-overlay" onClick={onClose}>
      <div
        className="glass-panel animate-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="form-title" style={{ fontSize: 28 }}>
          {editTask ? "Edit" : "Log Your"}
          <br />
          Investment.
        </div>
        <div className="form-subtitle">
          {"// convert spent time into tracked value"}
        </div>

        <div className="field">
          <label className="field-label">Task</label>
          <input
            type="text"
            className="field-input"
            value={title}
            placeholder="What did you work on?"
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            autoFocus
          />
        </div>

        <div className="field">
          <label className="field-label">Category</label>
          <select
            className="field-input"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label className="field-label">Time Range</label>
          <div className="two-col">
            <input
              type="time"
              className="field-input"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
            <input
              type="time"
              className="field-input"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
        </div>

        {error && <div className="field-error">⚠ {error}</div>}

        <button
          className="submit-btn"
          onClick={handleSubmit}
          disabled={isPending}
        >
          {isPending
            ? "Saving..."
            : editTask
              ? "Update Investment →"
              : "Log as Invested →"}
        </button>

        <div style={{ textAlign: "center", marginTop: 16 }}>
          <button
            className="btn"
            onClick={onClose}
            style={{ border: "none", color: "var(--muted)" }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
