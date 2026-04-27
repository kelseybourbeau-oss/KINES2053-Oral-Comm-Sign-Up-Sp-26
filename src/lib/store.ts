import { BlobPreconditionFailedError, get, head, put } from "@vercel/blob";
import { createEmptyStore } from "@/lib/slots";
import type { BookingRecord, ClassTime, EvaluatorId, ScheduleStore } from "@/lib/types";

const SCHEDULE_PATH = "oral-comm-final/schedule.json";

type LoadedStore = {
  store: ScheduleStore;
  etag: string | null;
};

function assertBlobToken() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN is required. Connect a private Vercel Blob store to this project.");
  }
}

async function readStore(): Promise<LoadedStore> {
  assertBlobToken();

  const result = await get(SCHEDULE_PATH, { access: "private" });
  if (!result || result.statusCode !== 200 || !result.stream) {
    return { store: createEmptyStore(), etag: null };
  }

  const raw = await new Response(result.stream).text();
  return {
    store: raw ? (JSON.parse(raw) as ScheduleStore) : createEmptyStore(),
    etag: result.blob.etag,
  };
}

async function writeStore(store: ScheduleStore, etag: string | null) {
  if (etag) {
    return put(SCHEDULE_PATH, JSON.stringify(store, null, 2), {
      access: "private",
      allowOverwrite: true,
      contentType: "application/json",
      ifMatch: etag,
    });
  }

  return put(SCHEDULE_PATH, JSON.stringify(store, null, 2), {
    access: "private",
    allowOverwrite: true,
    contentType: "application/json",
  });
}

async function mutateStore(
  updater: (draft: ScheduleStore) => void,
  maxRetries = 4,
): Promise<ScheduleStore> {
  assertBlobToken();

  for (let attempt = 0; attempt < maxRetries; attempt += 1) {
    const { store, etag } = await readStore();
    updater(store);

    try {
      await writeStore(store, etag);
      return store;
    } catch (error) {
      if (error instanceof BlobPreconditionFailedError && attempt < maxRetries - 1) {
        continue;
      }
      throw error;
    }
  }

  throw new Error("Unable to save the schedule. Please try again.");
}

export async function getScheduleStore() {
  const { store } = await readStore();
  return store;
}

export async function toggleAvailability(evaluator: EvaluatorId, slotId: string, available: boolean) {
  return mutateStore((draft) => {
    const current = new Set(draft.availability[evaluator]);
    if (available) {
      current.add(slotId);
    } else {
      current.delete(slotId);
    }
    draft.availability[evaluator] = [...current].sort();
  });
}

function normalizeName(name: string) {
  return name.trim().toLowerCase();
}

function ensureSlotOpen(draft: ScheduleStore, slotId: string) {
  const hasAvailability = Object.values(draft.availability).some((slots) => slots.includes(slotId));

  if (!hasAvailability) {
    throw new Error("That slot is not currently available.");
  }

  if (draft.bookings[slotId]) {
    throw new Error("That slot has already been booked.");
  }
}

function findBookingSlotId(draft: ScheduleStore, studentName: string) {
  const normalized = normalizeName(studentName);

  return Object.entries(draft.bookings).find(([, booking]) => normalizeName(booking.studentName) === normalized)?.[0] ?? null;
}

export async function bookSlot(slotId: string, studentName: string, classTime: ClassTime) {
  return mutateStore((draft) => {
    const trimmedName = studentName.trim();
    if (!trimmedName) {
      throw new Error("Student name is required.");
    }

    const existingSlotId = findBookingSlotId(draft, trimmedName);
    if (existingSlotId && existingSlotId !== slotId) {
      throw new Error("This student already has a booking. Use reschedule instead.");
    }

    ensureSlotOpen(draft, slotId);
    draft.bookings[slotId] = {
      studentName: trimmedName,
      classTime,
      assignedEvaluator: null,
      updatedAt: new Date().toISOString(),
    };
  });
}

export async function cancelBooking(slotId: string, studentName: string) {
  return mutateStore((draft) => {
    const booking = draft.bookings[slotId];
    if (!booking) {
      throw new Error("That booking no longer exists.");
    }

    if (normalizeName(booking.studentName) !== normalizeName(studentName)) {
      throw new Error("Name did not match the booking for that slot.");
    }

    delete draft.bookings[slotId];
  });
}

export async function rescheduleBooking(currentSlotId: string, nextSlotId: string, studentName: string, classTime: ClassTime) {
  return mutateStore((draft) => {
    const booking = draft.bookings[currentSlotId];
    if (!booking) {
      throw new Error("The original booking could not be found.");
    }

    if (normalizeName(booking.studentName) !== normalizeName(studentName)) {
      throw new Error("Name did not match the existing booking.");
    }

    ensureSlotOpen(draft, nextSlotId);
    delete draft.bookings[currentSlotId];
    draft.bookings[nextSlotId] = {
      studentName: booking.studentName,
      classTime,
      assignedEvaluator: null,
      updatedAt: new Date().toISOString(),
    };
  });
}

export async function assignEvaluator(slotId: string, evaluator: EvaluatorId | null) {
  return mutateStore((draft) => {
    const booking = draft.bookings[slotId];
    if (!booking) {
      throw new Error("That booking no longer exists.");
    }

    if (evaluator && !draft.availability[evaluator].includes(slotId)) {
      throw new Error("That evaluator is not marked available for this slot.");
    }

    const nextBooking: BookingRecord = {
      ...booking,
      assignedEvaluator: evaluator,
      updatedAt: new Date().toISOString(),
    };

    draft.bookings[slotId] = nextBooking;
  });
}

export async function scheduleExists() {
  try {
    assertBlobToken();
    await head(SCHEDULE_PATH);
    return true;
  } catch {
    return false;
  }
}
