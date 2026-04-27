import { notFound } from "next/navigation";
import { InstructorDashboard } from "@/components/instructor-dashboard";
import { SetupNotice } from "@/components/setup-notice";
import { getSlotViews } from "@/lib/slots";
import { getScheduleStore } from "@/lib/store";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ accessKey: string }>;
};

export default async function InstructorPage({ params }: PageProps) {
  const { accessKey } = await params;
  const expectedKey = process.env.INSTRUCTOR_ACCESS_KEY ?? "oral-comm-master";
  if (accessKey !== expectedKey) {
    notFound();
  }
  const content = await renderContent();

  return (
    <main className="shell">
      <section className="hero">
        <div className="hero-card">
          <p className="eyebrow">Instructor Master View</p>
          <h1>Assignment Dashboard</h1>
          <p>
            Review every booked slot, see which evaluators are available at that time, and assign one evaluator per
            student consultation. Unassigned rows stay flagged until you choose an evaluator.
          </p>
        </div>
      </section>
      {content}
    </main>
  );
}

async function renderContent() {
  try {
    const store = await getScheduleStore();
    const slots = getSlotViews(store);
    return <InstructorDashboard initialSlots={slots} />;
  } catch (error) {
    return <SetupNotice title="Finish Vercel Storage Setup" detail={error instanceof Error ? error.message : undefined} />;
  }
}
