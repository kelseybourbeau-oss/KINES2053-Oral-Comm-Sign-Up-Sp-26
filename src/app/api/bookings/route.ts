import { NextRequest, NextResponse } from "next/server";
import { getSlotViews } from "@/lib/slots";
import { assignEvaluator, bookSlot, cancelBooking, getScheduleStore, rescheduleBooking } from "@/lib/store";
import { CLASS_TIMES, EVALUATORS, type ClassTime, type EvaluatorId } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as
      | { action: "book"; slotId: string; studentName: string; classTime: ClassTime }
      | { action: "cancel"; slotId: string; studentName: string }
      | { action: "reschedule"; currentSlotId: string; nextSlotId: string; studentName: string; classTime: ClassTime }
      | { action: "assign"; slotId: string; evaluator: EvaluatorId | null };

    if (body.action === "book") {
      if (!CLASS_TIMES.includes(body.classTime)) {
        return NextResponse.json({ error: "Invalid class time." }, { status: 400 });
      }
      await bookSlot(body.slotId, body.studentName, body.classTime);
    }

    if (body.action === "cancel") {
      await cancelBooking(body.slotId, body.studentName);
    }

    if (body.action === "reschedule") {
      if (!CLASS_TIMES.includes(body.classTime)) {
        return NextResponse.json({ error: "Invalid class time." }, { status: 400 });
      }
      await rescheduleBooking(body.currentSlotId, body.nextSlotId, body.studentName, body.classTime);
    }

    if (body.action === "assign") {
      if (body.evaluator && !EVALUATORS.includes(body.evaluator)) {
        return NextResponse.json({ error: "Invalid evaluator." }, { status: 400 });
      }
      await assignEvaluator(body.slotId, body.evaluator);
    }

    const store = await getScheduleStore();
    return NextResponse.json({ slots: getSlotViews(store) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update booking." },
      { status: 400 },
    );
  }
}
