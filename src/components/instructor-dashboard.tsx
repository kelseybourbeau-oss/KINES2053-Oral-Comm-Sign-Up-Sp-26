"use client";

import { useState, useTransition } from "react";
import { EVALUATORS, type EvaluatorId, type SlotView } from "@/lib/types";

type Props = {
  initialSlots: SlotView[];
};

export function InstructorDashboard({ initialSlots }: Props) {
  const [slots, setSlots] = useState(initialSlots);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const bookedSlots = slots.filter((slot) => slot.status === "booked");

  function assign(slotId: string, evaluator: EvaluatorId | null) {
    setMessage(null);

    startTransition(async () => {
      try {
        const response = await fetch("/api/bookings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "assign", slotId, evaluator }),
        });
        const data = (await response.json()) as { slots?: SlotView[]; error?: string };
        if (!response.ok || !data.slots) {
          throw new Error(data.error ?? "Unable to save assignment.");
        }
        setSlots(data.slots);
        setMessage({ tone: "success", text: "Assignment saved." });
      } catch (error) {
        setMessage({ tone: "error", text: error instanceof Error ? error.message : "Unable to save assignment." });
      }
    });
  }

  return (
    <section className="panel">
      <div className="schedule-heading">
        <div>
          <h2>Booked Consultations</h2>
          <p>Students do not see evaluator assignments from this view.</p>
        </div>
        <span className="small">{bookedSlots.length} booked slots</span>
      </div>

      {message ? (
        <div className={`message ${message.tone === "success" ? "message-success" : "message-error"}`}>{message.text}</div>
      ) : null}

      {bookedSlots.length === 0 ? (
        <div className="empty-state">No students have booked a consultation yet.</div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Slot</th>
              <th>Student</th>
              <th>Class</th>
              <th>Available Evaluators</th>
              <th>Assignment</th>
            </tr>
          </thead>
          <tbody>
            {bookedSlots.map((slot) => (
              <tr key={slot.id}>
                <td>
                  <strong>{slot.dateLabel}</strong>
                  <div className="small">{slot.timeLabel}</div>
                </td>
                <td>{slot.studentName}</td>
                <td>{slot.classTime}</td>
                <td>
                  <div className="badge-list">
                    {slot.availableEvaluators.length > 0 ? (
                      slot.availableEvaluators.map((evaluator) => (
                        <span key={evaluator} className="pill pill-booked">
                          {capitalize(evaluator)}
                        </span>
                      ))
                    ) : (
                      <span className="pill pill-unavailable">No availability marked</span>
                    )}
                  </div>
                </td>
                <td>
                  <div className="field">
                    <label htmlFor={`assign-${slot.id}`} className="small">
                      <span className={`status-dot ${slot.assignedEvaluator ? "status-dot-success" : "status-dot-warning"}`} />
                      {slot.assignedEvaluator ? "Assigned" : "Needs assignment"}
                    </label>
                    <select
                      id={`assign-${slot.id}`}
                      value={slot.assignedEvaluator ?? ""}
                      disabled={isPending}
                      onChange={(event) => assign(slot.id, (event.target.value || null) as EvaluatorId | null)}
                    >
                      <option value="">Unassigned</option>
                      {EVALUATORS.filter((evaluator) => slot.availableEvaluators.includes(evaluator)).map((evaluator) => (
                        <option key={evaluator} value={evaluator}>
                          {capitalize(evaluator)}
                        </option>
                      ))}
                    </select>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function capitalize(value: string) {
  return value.slice(0, 1).toUpperCase() + value.slice(1);
}
