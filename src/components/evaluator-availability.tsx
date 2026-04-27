"use client";

import { useState, useTransition } from "react";
import { groupSlotsByDate } from "@/lib/slots";
import type { EvaluatorId, SlotView } from "@/lib/types";

type Props = {
  evaluator: EvaluatorId;
  initialSlots: SlotView[];
};

export function EvaluatorAvailability({ evaluator, initialSlots }: Props) {
  const [slots, setSlots] = useState(initialSlots);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const grouped = groupSlotsByDate(slots);

  function isAvailable(slot: SlotView) {
    return slot.availableEvaluators.includes(evaluator);
  }

  function update(slotId: string, available: boolean) {
    setMessage(null);

    startTransition(async () => {
      try {
        const response = await fetch("/api/availability", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ evaluator, slotId, available }),
        });
        const data = (await response.json()) as { slots?: SlotView[]; error?: string };
        if (!response.ok || !data.slots) {
          throw new Error(data.error ?? "Could not update availability.");
        }
        setSlots(data.slots);
        setMessage({ tone: "success", text: "Availability updated." });
      } catch (error) {
        setMessage({ tone: "error", text: error instanceof Error ? error.message : "Could not update availability." });
      }
    });
  }

  return (
    <div className="stack">
      {message ? (
        <div className={`message ${message.tone === "success" ? "message-success" : "message-error"}`}>{message.text}</div>
      ) : null}
      {Object.entries(grouped).map(([dateKey, group]) => (
        <section key={dateKey} className="panel">
          <div className="schedule-heading">
            <h2>{group.label}</h2>
            <span className="small">Toggle the slots you can cover.</span>
          </div>
          <div className="slot-grid">
            {group.slots.map((slot) => {
              const checked = isAvailable(slot);

              return (
                <article key={slot.id} className={`slot ${checked ? "slot-open" : "slot-unavailable"}`}>
                  <div className="slot-meta">
                    <span className={`pill ${checked ? "pill-open" : "pill-unavailable"}`}>{checked ? "Available" : "Off"}</span>
                    {slot.status === "booked" ? <span className="pill pill-booked">Booked by {slot.studentName}</span> : null}
                  </div>
                  <h3>{slot.timeLabel}</h3>
                  <p className="small">
                    {slot.availableEvaluators.length > 0
                      ? `Also available: ${slot.availableEvaluators.filter((name) => name !== evaluator).join(", ") || "no one else"}`
                      : "No one is marked available for this time yet."}
                  </p>
                  <button className="button button-primary" disabled={isPending} onClick={() => update(slot.id, !checked)}>
                    {checked ? "Mark unavailable" : "Mark available"}
                  </button>
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
