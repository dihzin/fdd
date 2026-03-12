import Link from "next/link";

import { DataTable } from "@/components/ui/data-table";
import { SectionCard } from "@/components/ui/section-card";
import { projects } from "@/lib/mock-data";

export default function ProjectsPage() {
  return (
    <SectionCard
      title="Projetos"
      description="Visao de portfolio dos programas SAP, abordagem de entrega e estagio atual de desenho."
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
  );
}
