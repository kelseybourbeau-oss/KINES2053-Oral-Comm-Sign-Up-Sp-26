import { NextRequest, NextResponse } from "next/server";
import { getSlotViews } from "@/lib/slots";
import { getScheduleStore, toggleAvailability } from "@/lib/store";
import { EVALUATORS, type EvaluatorId } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      evaluator: EvaluatorId;
      slotId: string;
      available: boolean;
    };

    if (!EVALUATORS.includes(body.evaluator)) {
      return NextResponse.json({ error: "Unknown evaluator." }, { status: 400 });
    }

    await toggleAvailability(body.evaluator, body.slotId, body.available);
    const store = await getScheduleStore();
    return NextResponse.json({ slots: getSlotViews(store) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update availability." },
      { status: 400 },
    );
  }
}
