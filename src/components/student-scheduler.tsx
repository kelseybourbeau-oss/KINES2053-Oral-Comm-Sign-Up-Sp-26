"use client";

import { useState, useTransition } from "react";
import { CLASS_TIMES, type ClassTime, type SlotView } from "@/lib/types";
import { groupSlotsByDate } from "@/lib/slots";

type Props = {
  initialSlots: SlotView[];
};

export function StudentScheduler({ initialSlots }: Props) {
  const [slots, setSlots] = useState(initialSlots);
  const [studentName, setStudentName] = useState("");
  const [classTime, setClassTime] = useState<ClassTime>("8:00");
  const [selectedSlotId, setSelectedSlotId] = useState("");
  const [currentSlotId, setCurrentSlotId] = useState("");
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const grouped = groupSlotsByDate(slots);
  const myBooking = slots.find((slot) => slot.studentName?.trim().toLowerCase() === studentName.trim().toLowerCase());

  async function submitBooking(action: "book" | "cancel" | "reschedule") {
    setMessage(null);

    startTransition(async () => {
      try {
        const payload =
          action === "book"
            ? { action, slotId: selectedSlotId, studentName, classTime }
            : action === "cancel"
              ? { action, slotId: currentSlotId || myBooking?.id, studentName }
              : { action, currentSlotId: currentSlotId || myBooking?.id, nextSlotId: selectedSlotId, studentName, classTime };

        const response = await fetch("/api/bookings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = (await response.json()) as { slots?: SlotView[]; error?: string };

        if (!response.ok || !data.slots) {
          throw new Error(data.error ?? "Something went wrong.");
        }

        setSlots(data.slots);
        setMessage({
          tone: "success",
          text:
            action === "book"
              ? "Your consultation has been booked."
              : action === "cancel"
                ? "Your consultation has been canceled."
                : "Your consultation has been moved to the new slot.",
        });
        if (action !== "cancel") {
          setCurrentSlotId("");
        }
      } catch (error) {
        setMessage({ tone: "error", text: error instanceof Error ? error.message : "Unable to save your change." });
      }
    });
  }

  return (
    <div className="page-grid">
      <aside className="stack">
        <section className="panel">
          <h2>Reserve a Slot</h2>
          <p>Enter your name and class time, then choose an open consultation slot from the schedule.</p>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="studentName">Student name</label>
              <input id="studentName" value={studentName} onChange={(event) => setStudentName(event.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="classTime">Class time</label>
              <select id="classTime" value={classTime} onChange={(event) => setClassTime(event.target.value as ClassTime)}>
                {CLASS_TIMES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="slotPicker">Chosen slot</label>
              <select id="slotPicker" value={selectedSlotId} onChange={(event) => setSelectedSlotId(event.target.value)}>
                <option value="">Select an open slot</option>
                {slots
                  .filter((slot) => slot.status === "open")
                  .map((slot) => (
                    <option key={slot.id} value={slot.id}>
                      {slot.dateLabel} at {slot.timeLabel}
                    </option>
                  ))}
              </select>
            </div>
            <div className="button-row">
              <button className="button button-primary" disabled={isPending || !studentName || !selectedSlotId} onClick={() => submitBooking("book")}>
                Book slot
              </button>
            </div>
          </div>
        </section>

        <section className="panel">
          <h2>Cancel or Reschedule</h2>
          <p>Type your name exactly as booked to manage your current slot from this same page.</p>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="currentBooking">Current booking</label>
              <select id="currentBooking" value={currentSlotId} onChange={(event) => setCurrentSlotId(event.target.value)}>
                <option value="">Use the slot found by your name</option>
                {slots
                  .filter((slot) => slot.status === "booked" && slot.studentName?.trim().toLowerCase() === studentName.trim().toLowerCase())
                  .map((slot) => (
                    <option key={slot.id} value={slot.id}>
                      {slot.dateLabel} at {slot.timeLabel}
                    </option>
                  ))}
              </select>
            </div>
            <div className="button-row">
              <button className="button button-danger" disabled={isPending || !studentName || !(currentSlotId || myBooking)} onClick={() => submitBooking("cancel")}>
                Cancel slot
              </button>
              <button
                className="button button-secondary"
                disabled={isPending || !studentName || !(currentSlotId || myBooking) || !selectedSlotId}
                onClick={() => submitBooking("reschedule")}
              >
                Reschedule
              </button>
            </div>
          </div>
          {myBooking ? (
            <p className="small">
              Current booking found: {myBooking.dateLabel} at {myBooking.timeLabel}
            </p>
          ) : (
            <p className="small">No current booking found for the name entered above.</p>
          )}
        </section>

        {message ? (
          <div className={`message ${message.tone === "success" ? "message-success" : "message-error"}`}>{message.text}</div>
        ) : null}
      </aside>

      <section className="stack">
        {Object.entries(grouped).map(([dateKey, group]) => (
          <div key={dateKey} className="panel">
            <div className="schedule-heading">
              <h2>{group.label}</h2>
              <span className="small">{group.slots.length} consultation slots</span>
            </div>
            <div className="slot-grid">
              {group.slots.map((slot) => (
                <article key={slot.id} className={`slot slot-${slot.status}`}>
                  <div className="slot-meta">
                    <span className={`pill ${slot.status === "open" ? "pill-open" : slot.status === "booked" ? "pill-booked" : "pill-unavailable"}`}>
                      {slot.status === "open" ? "Open" : slot.status === "booked" ? "Booked" : "Unavailable"}
                    </span>
                    {slot.classTime ? <span className="pill pill-booked">Class {slot.classTime}</span> : null}
                  </div>
                  <h3>{slot.timeLabel}</h3>
                  {slot.status === "booked" ? (
                    <p>
                      <strong>{slot.studentName}</strong>
                    </p>
                  ) : slot.status === "open" ? (
                    <p>This slot is available to claim right now.</p>
                  ) : (
                    <p>No evaluator is currently marked available for this time.</p>
                  )}
                  {slot.status === "open" ? (
                    <button className="button button-secondary" onClick={() => setSelectedSlotId(slot.id)}>
                      Choose this slot
                    </button>
                  ) : null}
                </article>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
