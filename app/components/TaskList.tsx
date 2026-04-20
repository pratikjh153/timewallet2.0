"use client";

import { useState, useTransition } from "react";
import { deleteTask } from "@/app/actions";
import {
  formatMoney,
  formatDuration,
  timeToSeconds,
} from "@/lib/time-utils";
import { CATEGORY_COLORS } from "@/lib/types";
import type { TaskRecord } from "@/lib/types";

interface TaskListProps {
  tasks: TaskRecord[];
  valuePerSecond: number;
  moneyInvested: number;
  onEditTask: (task: TaskRecord) => void;
}

export default function TaskList({
  tasks,
  valuePerSecond,
  moneyInvested,
  onEditTask,
}: TaskListProps) {
  const [isPending, startTransition] = useTransition();
  const [confirmingId, setConfirmingId] = useState<number | null>(null);

  const handleDelete = (id: number) => {
    if (confirmingId !== id) {
      setConfirmingId(id);
      setTimeout(() => {
        setConfirmingId((current) => (current === id ? null : current));
      }, 3000);
      return;
    }
    setConfirmingId(null);
    startTransition(async () => {
      await deleteTask(id);
    });
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title">{"// Today's Investments"}</div>
        {tasks.length > 0 && (
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--accent)",
              letterSpacing: ".15em",
            }}
          >
            {formatMoney(moneyInvested)} saved
          </div>
        )}
      </div>

      {tasks.length === 0 ? (
        <div className="empty-state">
          NO WORK LOGGED YET
          <br />
          YOUR TIME IS BURNING
          <br />
          <span style={{ color: "#1a1a1a", fontSize: 10 }}>
            — EVERY SECOND COUNTS —
          </span>
        </div>
      ) : (
        tasks.map((task) => {
          const taskS =
            timeToSeconds(task.endTime) - timeToSeconds(task.startTime);
          const taskVal = taskS * valuePerSecond;
          const catColor = CATEGORY_COLORS[task.category] || "#555";
          const isConfirming = confirmingId === task.id;

          return (
            <div key={task.id} className="task-item">
              <div
                style={{ cursor: "pointer", flex: 1 }}
                onClick={() => onEditTask(task)}
              >
                <div className="task-name">{task.title}</div>
                <div className="task-meta">
                  {task.startTime} → {task.endTime} · {formatDuration(taskS)}
                </div>
              </div>
              <div className="task-right">
                <div>
                  <div className="task-money" style={{ color: catColor }}>
                    {formatMoney(taskVal)}
                  </div>
                  <div
                    className="task-cat"
                    style={{ color: catColor, opacity: 0.6 }}
                  >
                    {task.category}
                  </div>
                </div>
                <button
                  className="btn btn-danger"
                  onClick={() => handleDelete(task.id)}
                  disabled={isPending}
                  title={
                    isConfirming
                      ? "Click again to confirm delete"
                      : "Delete task"
                  }
                  style={
                    isConfirming
                      ? {
                          color: "var(--red)",
                          fontSize: 11,
                          letterSpacing: ".15em",
                        }
                      : undefined
                  }
                >
                  {isConfirming ? "SURE?" : "×"}
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
