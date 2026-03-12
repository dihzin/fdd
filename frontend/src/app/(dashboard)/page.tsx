import Link from "next/link";

import { DataTable } from "@/components/ui/data-table";
import { MetricTile } from "@/components/ui/metric-tile";
import { SectionCard } from "@/components/ui/section-card";
import { dashboardMetrics, documents, projects } from "@/lib/mock-data";

export default function DashboardPage() {
  return (
    <div className="space-y-5">
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {dashboardMetrics.map((metric, index) => (
          <MetricTile
            key={metric.label}
            label={metric.label}
            value={metric.value}
            tone={index === 0 ? "accent" : "default"}
          />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.18fr_0.82fr]">
        <SectionCard
          title="Foco de entrega"
          description="Visao operacional do pipeline documental e do throughput de desenho."
        >
          <div className="rounded-[1.35rem] bg-[linear-gradient(135deg,#102031_0%,#113a48_54%,#0f766e_100%)] p-5 text-white">
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-100/70">Prioridade da sprint</p>
            <h3 className="mt-3 max-w-3xl font-[family-name:var(--font-heading)] text-[2.2rem] font-semibold leading-tight">
              Padronizar a geracao de FDD por fluxos de secao
            </h3>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-200">
              Concentrar o trabalho na qualidade do contexto do projeto, na completude do wizard de solucao e na velocidade de revisao dos pacotes prioritarios.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/documents"
                className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                Abrir documentos
              </Link>
              <Link
                href="/projects"
                className="rounded-full border border-white/18 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Ver projetos
              </Link>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Documentos recentes"
          description="Itens em rascunho, revisao e aprovacao."
        >
          <DataTable
            columns={[
              { key: "name", label: "Documento", render: (row) => row.name },
              { key: "solution", label: "Solucao", render: (row) => row.solution },
              { key: "status", label: "Status", render: (row) => row.status },
            ]}
            rows={documents}
          />
        </SectionCard>
      </section>

      <SectionCard
        title="Projetos ativos"
        description="Programas que alimentam os fluxos de solucao, requisitos e FDD."
      >
        <DataTable
          columns={[
            {
              key: "name",
              label: "Projeto",
              render: (row) => (
                <Link href={`/projects/${row.id}`} className="font-semibold text-slate-900 hover:text-[var(--accent)]">
                  {row.name}
                </Link>
              ),
            },
            { key: "client", label: "Cliente", render: (row) => row.client },
            { key: "methodology", label: "Metodologia", render: (row) => row.methodology },
            { key: "stage", label: "Fase", render: (row) => row.stage },
            { key: "lead", label: "Responsavel", render: (row) => row.lead },
          ]}
          rows={projects}
        />
      </SectionCard>
    </div>
  );
}
