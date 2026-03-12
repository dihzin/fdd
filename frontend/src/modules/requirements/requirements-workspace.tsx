"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { startTransition, useDeferredValue, useMemo, useRef, useState } from "react";

import { DataTable } from "@/components/ui/data-table";
import { SectionCard } from "@/components/ui/section-card";
import { fetchProjects, fetchRequirements, importRequirementsFile } from "@/modules/requirements/api";
import type { RequirementImportSummary, RequirementRecord } from "@/modules/requirements/types";

const statusOptions = ["Todos", "Draft", "Refined", "Approved", "Implemented", "Rejected"] as const;
const priorityOptions = ["Todas", "Low", "Medium", "High", "Critical"] as const;
const typeOptions = ["Todos", "Business", "Functional", "Technical", "Integration", "Report"] as const;

export function RequirementsWorkspace() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<(typeof statusOptions)[number]>("Todos");
  const [priorityFilter, setPriorityFilter] = useState<(typeof priorityOptions)[number]>("Todas");
  const [typeFilter, setTypeFilter] = useState<(typeof typeOptions)[number]>("Todos");
  const [moduleFilter, setModuleFilter] = useState("Todos");
  const [importSummary, setImportSummary] = useState<RequirementImportSummary | null>(null);

  const projectsQuery = useQuery({
    queryKey: ["projects", "requirements-filter"],
    queryFn: fetchProjects,
  });

  const projectOptions = projectsQuery.data ?? [];
  const activeProjectId = selectedProjectId || projectOptions[0]?.id || "";
  const deferredProjectId = useDeferredValue(activeProjectId);

  const requirementsQuery = useQuery({
    queryKey: ["requirements", deferredProjectId],
    queryFn: () => fetchRequirements(deferredProjectId),
    enabled: Boolean(deferredProjectId),
  });

  const importMutation = useMutation({
    mutationFn: importRequirementsFile,
    onSuccess: (summary) => {
      setImportSummary(summary);
      void queryClient.invalidateQueries({ queryKey: ["requirements", activeProjectId] });
    },
  });

  const requirements = useMemo(() => requirementsQuery.data ?? [], [requirementsQuery.data]);

  const moduleOptions = useMemo(() => {
    const unique = new Set(requirements.map((item) => item.module));
    return ["Todos", ...Array.from(unique).sort()];
  }, [requirements]);

  const filteredRequirements = useMemo(() => {
    return requirements.filter((item) => {
      const matchesStatus = statusFilter === "Todos" || item.status === statusFilter;
      const matchesPriority = priorityFilter === "Todas" || item.priority === priorityFilter;
      const matchesType = typeFilter === "Todos" || item.type === typeFilter;
      const matchesModule = moduleFilter === "Todos" || item.module === moduleFilter;
      return matchesStatus && matchesPriority && matchesType && matchesModule;
    });
  }, [moduleFilter, priorityFilter, requirements, statusFilter, typeFilter]);

  const handleProjectChange = (projectId: string) => {
    startTransition(() => {
      setSelectedProjectId(projectId);
      setImportSummary(null);
    });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !activeProjectId) {
      return;
    }

    setImportSummary(null);
    await importMutation.mutateAsync({ file, projectId: activeProjectId });
    event.target.value = "";
  };

  const activeProjectName =
    projectOptions.find((project) => project.id === activeProjectId)?.name ?? "Selecione um projeto";

  return (
    <div className="space-y-5">
      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard
          title="Workspace de requisitos"
          description="Visao operacional para intake, triagem e preparo do backlog para agrupamento em solucoes."
        >
          <div className="rounded-[1.45rem] bg-[linear-gradient(135deg,#102031_0%,#123247_42%,#0f766e_100%)] p-5 text-white">
            <p className="text-xs uppercase tracking-[0.22em] text-cyan-100/70">Projeto selecionado</p>
            <h3 className="mt-3 font-[family-name:var(--font-heading)] text-3xl font-semibold">
              {activeProjectName}
            </h3>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-200">
              Filtre volumes altos de requisitos, importe arquivos estruturados e mantenha o backlog pronto para desenho de solucao e geracao de FDD.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                Novo requisito
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-full border border-white/18 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Importar CSV/Excel
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xlsm"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Retorno da importacao"
          description="Feedback imediato do lote sem bloquear o restante da operacao."
        >
          {importMutation.isPending ? (
            <ImportState
              title="Importando arquivo"
              description="O lote de requisitos esta sendo processado e validado linha a linha."
            />
          ) : importMutation.isError ? (
            <ImportState
              title="Falha na importacao"
              description={importMutation.error instanceof Error ? importMutation.error.message : "Erro inesperado na importacao."}
              tone="error"
            />
          ) : importSummary ? (
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                <MiniMetric label="Linhas" value={`${importSummary.totalRows}`} />
                <MiniMetric label="Criadas" value={`${importSummary.createdRows}`} tone="success" />
                <MiniMetric label="Falhas" value={`${importSummary.failedRows}`} tone={importSummary.failedRows ? "error" : "default"} />
              </div>
              <div className="rounded-[1.4rem] border border-[var(--border)] bg-slate-50 px-4 py-4">
                <p className="text-sm font-semibold text-slate-900">{importSummary.filename}</p>
                <p className="mt-2 text-sm text-slate-600">
                  Codigos importados: {importSummary.importedCodes.length ? importSummary.importedCodes.join(", ") : "Nenhum codigo novo"}
                </p>
              </div>
              {importSummary.failures.length ? (
                <div className="space-y-3">
                  {importSummary.failures.map((failure) => (
                    <div key={failure.rowNumber} className="rounded-[1.35rem] border border-rose-200 bg-rose-50 px-4 py-3">
                      <p className="text-sm font-semibold text-rose-900">Linha {failure.rowNumber}</p>
                      <p className="mt-2 text-sm text-rose-700">{failure.errors.join(" · ")}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <ImportState
              title="Nenhuma importacao em andamento"
              description="Envie arquivos CSV ou Excel para ver aqui o feedback de validacao linha a linha."
            />
          )}
        </SectionCard>
      </section>

      <SectionCard
        title="Inventario de requisitos"
        description="Tabela densa, clara e preparada para backlogs extensos."
      >
        <div className="mb-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <SelectField
            label="Projeto"
            value={activeProjectId}
            onChange={handleProjectChange}
            options={projectOptions.map((item) => ({ label: item.name, value: item.id }))}
          />
          <SelectField
            label="Status"
            value={statusFilter}
            onChange={(value) => setStatusFilter(value as (typeof statusOptions)[number])}
            options={statusOptions.map((item) => ({ label: item, value: item }))}
          />
          <SelectField
            label="Prioridade"
            value={priorityFilter}
            onChange={(value) => setPriorityFilter(value as (typeof priorityOptions)[number])}
            options={priorityOptions.map((item) => ({ label: item, value: item }))}
          />
          <SelectField
            label="Tipo"
            value={typeFilter}
            onChange={(value) => setTypeFilter(value as (typeof typeOptions)[number])}
            options={typeOptions.map((item) => ({ label: item, value: item }))}
          />
          <SelectField
            label="Modulo"
            value={moduleFilter}
            onChange={setModuleFilter}
            options={moduleOptions.map((item) => ({ label: item, value: item }))}
          />
        </div>

        {requirementsQuery.isLoading ? (
          <div className="rounded-[1.5rem] border border-[var(--border)] bg-slate-50 px-5 py-12 text-center text-sm text-slate-500">
            Carregando requisitos...
          </div>
        ) : (
          <DataTable
            columns={[
              { key: "code", label: "Codigo", render: (row: RequirementRecord) => <span className="font-semibold text-slate-900">{row.code}</span> },
              {
                key: "title",
                label: "Requisito",
                render: (row: RequirementRecord) => (
                  <div>
                    <p className="font-medium text-slate-900">{row.title}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{row.description ?? "Sem descricao."}</p>
                  </div>
                ),
              },
              { key: "type", label: "Tipo", render: (row: RequirementRecord) => row.type },
              { key: "module", label: "Modulo", render: (row: RequirementRecord) => row.module },
              { key: "systems", label: "Sistemas", render: (row: RequirementRecord) => `${row.sourceSystem} → ${row.targetSystem}` },
              { key: "priority", label: "Prioridade", render: (row: RequirementRecord) => <PriorityBadge value={row.priority} /> },
              { key: "status", label: "Status", render: (row: RequirementRecord) => <StatusBadge value={row.status} /> },
              {
                key: "actions",
                label: "Acoes",
                render: () => (
                  <button
                    type="button"
                    className="rounded-full border border-[var(--border)] bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    Editar
                  </button>
                ),
              },
            ]}
            rows={filteredRequirements}
          />
        )}
      </SectionCard>
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
}) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-[1.15rem] border border-[var(--border)] bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-400"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ImportState({
  title,
  description,
  tone = "default",
}: {
  title: string;
  description: string;
  tone?: "default" | "error";
}) {
  return (
    <div
      className={`rounded-[1.5rem] border px-5 py-8 ${
        tone === "error" ? "border-rose-200 bg-rose-50" : "border-[var(--border)] bg-slate-50"
      }`}
    >
      <p className={`text-sm font-semibold ${tone === "error" ? "text-rose-900" : "text-slate-900"}`}>{title}</p>
      <p className={`mt-2 text-sm leading-6 ${tone === "error" ? "text-rose-700" : "text-slate-600"}`}>{description}</p>
    </div>
  );
}

function MiniMetric({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "success" | "error";
}) {
  const style =
    tone === "success"
      ? "bg-emerald-50 text-emerald-900 border-emerald-200"
      : tone === "error"
        ? "bg-rose-50 text-rose-900 border-rose-200"
        : "bg-white text-slate-900 border-[var(--border)]";

  return (
    <div className={`rounded-[1.2rem] border px-4 py-4 ${style}`}>
      <p className="text-xs uppercase tracking-[0.18em] opacity-70">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function PriorityBadge({ value }: { value: RequirementRecord["priority"] }) {
  const tone = {
    Low: "bg-slate-100 text-slate-700",
    Medium: "bg-sky-100 text-sky-800",
    High: "bg-amber-100 text-amber-800",
    Critical: "bg-rose-100 text-rose-800",
  }[value];

  const label = { Low: "Baixa", Medium: "Media", High: "Alta", Critical: "Critica" }[value];
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${tone}`}>{label}</span>;
}

function StatusBadge({ value }: { value: RequirementRecord["status"] }) {
  const tone = {
    Draft: "bg-slate-100 text-slate-700",
    Refined: "bg-indigo-100 text-indigo-800",
    Approved: "bg-emerald-100 text-emerald-800",
    Implemented: "bg-cyan-100 text-cyan-800",
    Rejected: "bg-rose-100 text-rose-800",
  }[value];

  const label = {
    Draft: "Rascunho",
    Refined: "Refinado",
    Approved: "Aprovado",
    Implemented: "Implementado",
    Rejected: "Rejeitado",
  }[value];
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${tone}`}>{label}</span>;
}
