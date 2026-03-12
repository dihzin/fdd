import { DataTable } from "@/components/ui/data-table";
import { SectionCard } from "@/components/ui/section-card";
import { templates } from "@/lib/mock-data";

export default function TemplatesPage() {
  return (
    <SectionCard
      title="Modelos"
      description="Modelos corporativos e de cliente preparados para exportacao controlada de FDD."
    >
      <DataTable
        columns={[
          { key: "name", label: "Modelo", render: (row) => row.name },
          { key: "scope", label: "Escopo", render: (row) => row.scope },
          { key: "version", label: "Versao", render: (row) => row.version },
          { key: "status", label: "Status", render: (row) => row.status },
        ]}
        rows={templates}
      />
    </SectionCard>
  );
}
