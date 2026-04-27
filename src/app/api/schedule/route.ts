import { NextResponse } from "next/server";
import { getSlotViews } from "@/lib/slots";
import { getScheduleStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const store = await getScheduleStore();
    return NextResponse.json({ slots: getSlotViews(store) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load the schedule." },
      { status: 500 },
    );
  }
}
