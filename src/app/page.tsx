import { StudentScheduler } from "@/components/student-scheduler";
import { SetupNotice } from "@/components/setup-notice";
import { getSlotViews } from "@/lib/slots";
import { getScheduleStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  try {
    const store = await getScheduleStore();
    const slots = getSlotViews(store);

    return (
      <main className="shell">
        <section className="hero">
          <div className="hero-card">
            <p className="eyebrow">Student Sign-Up</p>
            <h1>University Oral Communication Final Exam Scheduler</h1>
            <p>
              Pick one 15-minute consultation slot between Wednesday, May 6, 2026 and Thursday, May 14, 2026.
              The schedule below stays live for the whole class, so you can see which times are open, unavailable,
              or already claimed.
            </p>
            <p className="small">
              Staff quick-access hub: <code>/access/your-instructor-key</code>
            </p>
          </div>
        </section>
        <StudentScheduler initialSlots={slots} />
      </main>
    );
  } catch (error) {
    return (
      <main className="shell">
        <section className="hero">
          <div className="hero-card">
            <p className="eyebrow">Student Sign-Up</p>
            <h1>University Oral Communication Final Exam Scheduler</h1>
            <p>The project is ready, but storage still needs to be connected before the live schedule can load.</p>
            <p className="small">
              Staff quick-access hub: <code>/access/your-instructor-key</code>
            </p>
          </div>
        </section>
        <SetupNotice title="Finish Vercel Storage Setup" detail={error instanceof Error ? error.message : undefined} />
      </main>
    );
  }
}
