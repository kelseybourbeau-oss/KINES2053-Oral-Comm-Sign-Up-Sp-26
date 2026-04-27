import Link from "next/link";
import { notFound } from "next/navigation";
import { EvaluatorAvailability } from "@/components/evaluator-availability";
import { SetupNotice } from "@/components/setup-notice";
import { getSlotViews } from "@/lib/slots";
import { getScheduleStore } from "@/lib/store";
import { EVALUATORS, type EvaluatorId } from "@/lib/types";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ evaluator: string }>;
};

export default async function EvaluatorPage({ params }: PageProps) {
  const { evaluator } = await params;
  if (!EVALUATORS.includes(evaluator as EvaluatorId)) {
    notFound();
  }
  const content = await renderContent(evaluator as EvaluatorId);

  return (
    <main className="shell">
      <section className="hero">
        <div className="hero-card">
          <p className="eyebrow">Evaluator Availability</p>
          <h1>{capitalize(evaluator)} Availability Board</h1>
          <p>
            Mark the 15-minute consultation slots you can cover. Students never see evaluator names from the public
            schedule, but your availability determines which times they are allowed to claim.
          </p>
          <div className="link-row">
            <Link href="/" className="link-chip">
              Open student schedule
            </Link>
          </div>
        </div>
      </section>
      {content}
    </main>
  );
}

async function renderContent(evaluator: EvaluatorId) {
  try {
    const store = await getScheduleStore();
    const slots = getSlotViews(store);
    return <EvaluatorAvailability evaluator={evaluator} initialSlots={slots} />;
  } catch (error) {
    return <SetupNotice title="Finish Vercel Storage Setup" detail={error instanceof Error ? error.message : undefined} />;
  }
}

function capitalize(value: string) {
  return value.slice(0, 1).toUpperCase() + value.slice(1);
}
