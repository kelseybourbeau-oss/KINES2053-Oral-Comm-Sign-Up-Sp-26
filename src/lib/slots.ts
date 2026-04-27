import { EVALUATORS, type ScheduleStore, type SlotView } from "@/lib/types";

const START_DATE = "2026-05-06";
const END_DATE = "2026-05-14";
const START_HOUR = 8;
const END_HOUR = 17;
const SLOT_MINUTES = 15;

const formatterDate = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  timeZone: "America/Chicago",
});

const formatterTime = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: "America/Chicago",
});

export function createEmptyStore(): ScheduleStore {
  return {
    availability: {
      kelsey: [],
      jon: [],
      sean: [],
      thomsen: [],
    },
    bookings: {},
  };
}

function atChicagoTime(dateKey: string, hour: number, minute: number) {
  return new Date(`${dateKey}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00-05:00`);
}

function getWeekdayDateKeys() {
  const keys: string[] = [];
  let cursor = new Date(`${START_DATE}T00:00:00-05:00`);
  const end = new Date(`${END_DATE}T00:00:00-05:00`);

  while (cursor <= end) {
    const day = cursor.getUTCDay();
    if (day !== 0 && day !== 6) {
      keys.push(cursor.toISOString().slice(0, 10));
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return keys;
}

export function getAllSlotIds() {
  const slotIds: string[] = [];

  for (const dateKey of getWeekdayDateKeys()) {
    for (let hour = START_HOUR; hour < END_HOUR; hour += 1) {
      for (let minute = 0; minute < 60; minute += SLOT_MINUTES) {
        slotIds.push(`${dateKey}-${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`);
      }
    }
  }

  return slotIds;
}

export function getSlotViews(store: ScheduleStore): SlotView[] {
  return getAllSlotIds().map((slotId) => {
    const splitPoint = slotId.lastIndexOf("-");
    const dateKey = slotId.slice(0, splitPoint);
    const timeKey = slotId.slice(splitPoint + 1);
    const [hourText, minuteText] = timeKey.split(":");
    const hour = Number(hourText);
    const minute = Number(minuteText);
    const slotDate = atChicagoTime(dateKey, hour, minute);
    const availableEvaluators = EVALUATORS.filter((evaluator) =>
      store.availability[evaluator].includes(slotId),
    );
    const booking = store.bookings[slotId];

    return {
      id: slotId,
      dateKey,
      dateLabel: formatterDate.format(slotDate),
      timeLabel: formatterTime.format(slotDate),
      status: booking ? "booked" : availableEvaluators.length > 0 ? "open" : "unavailable",
      studentName: booking?.studentName ?? null,
      classTime: booking?.classTime ?? null,
      assignedEvaluator: booking?.assignedEvaluator ?? null,
      availableEvaluators,
    };
  });
}

export function groupSlotsByDate(slots: SlotView[]) {
  return slots.reduce<Record<string, { label: string; slots: SlotView[] }>>((groups, slot) => {
    if (!groups[slot.dateKey]) {
      groups[slot.dateKey] = { label: slot.dateLabel, slots: [] };
    }
    groups[slot.dateKey].slots.push(slot);
    return groups;
  }, {});
}
