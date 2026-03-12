import Link from "next/link";

import { MetricTile } from "@/components/ui/metric-tile";
import { SectionCard } from "@/components/ui/section-card";
import { projects, requirements, solutions } from "@/lib/mock-data";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const project = projects.find((item) => item.id === projectId) ?? projects[0];

  return (
    <div className="space-y-5">
      <section className="rounded-[1.55rem] border border-[var(--border)] bg-[linear-gradient(135deg,#f8fafc_0%,#e8eff5_100%)] p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Detalhe do projeto</p>
        <h1 className="mt-3 font-[family-name:var(--font-heading)] text-4xl font-semibold text-slate-950">
          {project.name}
        </h1>
        <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-600">
          <span className="rounded-full border border-[var(--border)] bg-white px-3 py-2">{project.client}</span>
          <span className="rounded-full border border-[var(--border)] bg-white px-3 py-2">{project.methodology}</span>
          <span className="rounded-full border border-[var(--border)] bg-white px-3 py-2">{project.stage}</span>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <MetricTile label="Requisitos abertos" value="48" tone="accent" />
        <MetricTile label="Solucoes mapeadas" value="6" />
        <MetricTile label="Documentos FDD" value="9" />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <SectionCard title="Panorama de requisitos">
          <div className="space-y-3">
            {requirements.map((item) => (
              <div key={item.code} className="rounded-[1.35rem] border border-[var(--border)] bg-slate-50 px-4 py-3">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">{item.code}</p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">{item.status}</span>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Pacotes de solucao">
          <div className="space-y-3">
            {solutions.map((item) => (
              <div key={item.name} className="rounded-[1.35rem] border border-[var(--border)] bg-white px-4 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {item.module} · {item.phase}
                    </p>
                  </div>
                  <span className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-xs font-semibold text-slate-700">
                    {item.requirements} reqs
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5">
            <Link href="/documents" className="text-sm font-semibold text-[var(--accent)] hover:text-[var(--accent-strong)]">
              Abrir documentos relacionados
            </Link>
          </div>
        </SectionCard>
      </section>
    </div>
  );
}
