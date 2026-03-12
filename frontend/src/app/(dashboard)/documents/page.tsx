import Link from "next/link";

import { DataTable } from "@/components/ui/data-table";
import { SectionCard } from "@/components/ui/section-card";
import { DocumentExportButton } from "@/modules/documents/document-export-button";
import { documents } from "@/lib/mock-data";

export default function DocumentsPage() {
  return (
    <SectionCard
      title="Documentos"
      description="Biblioteca estruturada de FDD para edicao, revisao e exportacao."
    >
      <DataTable
        columns={[
          {
            key: "name",
            label: "Documento",
            render: (row) => (
              <Link href={`/documents/${row.id}`} className="font-semibold text-slate-900 hover:text-[var(--accent)]">
                {row.name}
              </Link>
            ),
          },
          { key: "project", label: "Projeto", render: (row) => row.project },
          { key: "solution", label: "Solucao", render: (row) => row.solution },
          { key: "version", label: "Versao", render: (row) => `v${row.version}` },
          { key: "status", label: "Status", render: (row) => row.status },
          {
            key: "export",
            label: "Exportacao",
            render: (row) => (
              <DocumentExportButton
                documentId={row.id}
                projectName={row.project}
                solutionName={row.solution}
                version={row.version}
                compact
              />
            ),
          },
        ]}
        rows={documents}
      />
    </SectionCard>
  );
}
