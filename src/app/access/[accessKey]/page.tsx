import Link from "next/link";
import { notFound } from "next/navigation";
import { EVALUATORS } from "@/lib/types";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ accessKey: string }>;
};

export default async function AccessHubPage({ params }: PageProps) {
  const { accessKey } = await params;
  const expectedKey = process.env.INSTRUCTOR_ACCESS_KEY ?? "oral-comm-master";

  if (accessKey !== expectedKey) {
    notFound();
  }

  return (
    <main className="shell">
      <section className="hero">
        <div className="hero-card">
          <p className="eyebrow">Staff Access Hub</p>
          <h1>Evaluator and Instructor Links</h1>
          <p>
            Keep this page for instructor and evaluator use only. It gathers the evaluator availability pages and the
            instructor master view in one place without exposing the instructor path on the public student page.
          </p>
        </div>
      </section>

      <section className="panel">
        <h2>Quick Links</h2>
        <div className="link-row">
          <Link href="/" className="link-chip">
            Student schedule
          </Link>
          {EVALUATORS.map((evaluator) => (
            <Link key={evaluator} href={`/evaluator/${evaluator}`} className="link-chip">
              {capitalize(evaluator)} availability
            </Link>
          ))}
          <Link href={`/instructor/${accessKey}`} className="link-chip">
            Instructor master view
          </Link>
        </div>
      </section>
    </main>
  );
}

function capitalize(value: string) {
  return value.slice(0, 1).toUpperCase() + value.slice(1);
}
