"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { startTransition, useDeferredValue, useMemo, useState } from "react";

import { MetricTile } from "@/components/ui/metric-tile";
import { SectionCard } from "@/components/ui/section-card";
import { createSolution, fetchProjects, fetchRequirements, fetchSolutions, linkRequirementToSolution } from "@/modules/solutions/api";
import type { SolutionCreateInput, SolutionRecord } from "@/modules/solutions/types";

const solutionStatuses = {
  Draft: "bg-slate-100 text-slate-700",
  "In Review": "bg-amber-100 text-amber-800",
  Ready: "bg-emerald-100 text-emerald-800",
} as const;

const phaseSuggestions = ["Discovery", "Design", "Build", "Validation", "Hypercare"];

export function SolutionsWorkspace() {
  const queryClient = useQueryClient();
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedSolutionId, setSelectedSolutionId] = useState("");
  const [selectedRequirementId, setSelectedRequirementId] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [formState, setFormState] = useState<SolutionCreateInput>({
    projectId: "",
    name: "",
    description: "",
    module: "",
    phase: "Design",
  });

  const projectsQuery = useQuery({
    queryKey: ["projects", "solutions-filter"],
    queryFn: fetchProjects,
  });

  const projectOptions = projectsQuery.data ?? [];
  const activeProjectId = selectedProjectId || projectOptions[0]?.id || "";
  const deferredProjectId = useDeferredValue(activeProjectId);

  const solutionsQuery = useQuery({
    queryKey: ["solutions", deferredProjectId],
    queryFn: () => fetchSolutions(deferredProjectId),
    enabled: Boolean(deferredProjectId),
  });

  const requirementsQuery = useQuery({
    queryKey: ["requirements", "solutions", deferredProjectId],
    queryFn: () => fetchRequirements(deferredProjectId),
    enabled: Boolean(deferredProjectId),
  });

  const createMutation = useMutation({
    mutationFn: createSolution,
    onSuccess: (createdSolution) => {
      queryClient.setQueryData<SolutionRecord[]>(["solutions", activeProjectId], (current) => [
        createdSolution,
        ...(current ?? []),
      ]);
      setSelectedSolutionId(createdSolution.id);
      setFormState({
        projectId: activeProjectId,
        name: "",
        description: "",
        module: "",
        phase: "Design",
      });
      setIsCreateOpen(false);
      setCreateError(null);
    },
  });

  const linkMutation = useMutation({
    mutationFn: linkRequirementToSolution,
    onSuccess: (updatedSolution) => {
      queryClient.setQueryData<SolutionRecord[]>(["solutions", activeProjectId], (current) =>
        (current ?? []).map((item) => (item.id === updatedSolution.id ? updatedSolution : item)),
      );
      setSelectedRequirementId("");
      setLinkError(null);
    },
  });

  const solutions = useMemo(() => solutionsQuery.data ?? [], [solutionsQuery.data]);
  const requirements = useMemo(() => requirementsQuery.data ?? [], [requirementsQuery.data]);

  const activeSolutionId = selectedSolutionId || solutions[0]?.id || "";
  const activeSolution = useMemo(
    () => solutions.find((item) => item.id === activeSolutionId) ?? null,
    [activeSolutionId, solutions],
  );

  const availableRequirements = useMemo(() => {
    if (!activeSolution) {
      return [];
    }

    const linkedIds = new Set(activeSolution.requirements.map((item) => item.requirementId));
    return requirements.filter((item) => !linkedIds.has(item.id));
  }, [activeSolution, requirements]);

  const coverageRatio = useMemo(() => {
    if (!activeSolution || requirements.length === 0) {
      return 0;
    }

    return Math.round((activeSolution.requirementCount / requirements.length) * 100);
  }, [activeSolution, requirements.length]);

  const activeProject = projectOptions.find((item) => item.id === activeProjectId) ?? null;

  const handleProjectChange = (projectId: string) => {
    startTransition(() => {
      setSelectedProjectId(projectId);
      setSelectedSolutionId("");
      setSelectedRequirementId("");
      setFormState((current) => ({ ...current, projectId }));
      setCreateError(null);
      setLinkError(null);
    });
  };

  const handleCreateSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!activeProjectId) {
      setCreateError("Selecione um projeto antes de criar uma solucao.");
      return;
    }

    if (!formState.name.trim()) {
      setCreateError("O nome da solucao e obrigatorio.");
      return;
    }

    try {
      await createMutation.mutateAsync({
        ...formState,
        projectId: activeProjectId,
        name: formState.name.trim(),
        module: formState.module.trim(),
        phase: formState.phase.trim(),
      });
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : "Nao foi possivel criar a solucao.");
    }
  };

  const handleLinkRequirement = async () => {
    if (!activeSolution || !selectedRequirementId) {
      setLinkError("Selecione um requisito para vincular.");
      return;
    }

    try {
      await linkMutation.mutateAsync({
        solutionId: activeSolution.id,
        requirementId: selectedRequirementId,
      });
    } catch (error) {
      setLinkError(error instanceof Error ? error.message : "Nao foi possivel vincular o requisito.");
    }
  };

  return (
    <div className="space-y-5">
      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <SectionCard
          title="Workspace de solucoes"
          description="Visao executiva dos pacotes de solucao, cobertura de requisitos e prontidao para o wizard."
        >
          <div className="rounded-[1.45rem] bg-[linear-gradient(140deg,#0f172a_0%,#15374f_40%,#115e59_100%)] p-5 text-white">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-cyan-100/70">Projeto ativo</p>
                <h3 className="mt-3 font-[family-name:var(--font-heading)] text-3xl font-semibold">
                  {activeProject?.name ?? "Selecione um projeto"}
                </h3>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-200">
                  Agrupe o escopo aprovado em solucoes prontas para implementacao, acompanhe a cobertura e mantenha a estrutura preparada para o wizard e para a geracao de FDD.
                </p>
              </div>
              <div className="rounded-[1.4rem] border border-white/12 bg-white/10 px-4 py-4 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-cyan-100/70">Solucoes no escopo</p>
                <p className="mt-2 text-3xl font-semibold">{solutions.length}</p>
                <p className="mt-2 text-sm text-slate-200">{requirements.length} requisitos disponiveis no projeto</p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsCreateOpen((current) => !current);
                  setFormState((current) => ({ ...current, projectId: activeProjectId }));
                  setCreateError(null);
                }}
                className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                {isCreateOpen ? "Ocultar formulario" : "Criar solucao"}
              </button>
              <span className="rounded-full border border-white/15 px-4 py-2 text-sm text-slate-100">
                Estrutura pronta para wizard
              </span>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Selecao"
          description="Troque o contexto do projeto sem perder o painel de detalhe da solucao."
        >
          <div className="space-y-5">
            <SelectField
              label="Projeto"
              value={activeProjectId}
              onChange={handleProjectChange}
              options={projectOptions.map((item) => ({ label: item.name, value: item.id }))}
            />
            <div className="grid gap-3 md:grid-cols-3">
              <MiniMetric label="Cobertura" value={`${coverageRatio}%`} />
              <MiniMetric label="Reqs vinculados" value={`${activeSolution?.requirementCount ?? 0}`} tone="accent" />
              <MiniMetric label="Wizard" value={activeSolution?.wizardReady ? "Pronto" : "Pendente"} />
            </div>
            <div className="rounded-[1.4rem] border border-[var(--border)] bg-slate-50 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Foco atual</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{activeSolution?.name ?? "Nenhuma solucao selecionada"}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {activeSolution?.description ?? "Crie ou selecione uma solucao para inspecionar os requisitos vinculados e preparar o contexto do wizard."}
              </p>
            </div>
          </div>
        </SectionCard>
      </section>

      {isCreateOpen ? (
        <SectionCard
          title="Nova solucao"
          description="Capture a estrutura minima agora e deixe o enriquecimento detalhado para o wizard guiado."
        >
          <form className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr_0.7fr_auto]" onSubmit={handleCreateSubmit}>
            <InputField
              label="Nome"
              value={formState.name}
              onChange={(value) => setFormState((current) => ({ ...current, name: value }))}
              placeholder="Faturamento e controle de credito"
            />
            <InputField
              label="Modulo"
              value={formState.module}
              onChange={(value) => setFormState((current) => ({ ...current, module: value }))}
              placeholder="SD"
            />
            <SelectField
              label="Fase"
              value={formState.phase}
              onChange={(value) => setFormState((current) => ({ ...current, phase: value }))}
              options={phaseSuggestions.map((item) => ({ label: item, value: item }))}
            />
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="mt-[1.7rem] rounded-[1.15rem] bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {createMutation.isPending ? "Criando..." : "Salvar solucao"}
            </button>
            <div className="xl:col-span-3">
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Descricao</span>
                <textarea
                  value={formState.description}
                  onChange={(event) => setFormState((current) => ({ ...current, description: event.target.value }))}
                  rows={4}
                  placeholder="Descreva o escopo de negocio, a cobertura de processo e a fronteira arquitetural."
                  className="w-full rounded-[1.15rem] border border-[var(--border)] bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-400"
                />
              </label>
            </div>
            {createError ? <p className="xl:col-span-4 text-sm font-medium text-rose-700">{createError}</p> : null}
          </form>
        </SectionCard>
      ) : null}

      <section className="grid gap-6 2xl:grid-cols-[0.96fr_1.04fr]">
        <SectionCard
          title="Solucoes por projeto"
          description="Cards executivos para ler rapidamente escopo, fase e concentracao de requisitos."
        >
          {solutionsQuery.isLoading ? (
            <StatePanel title="Carregando solucoes" description="Buscando os pacotes de solucao do projeto selecionado." />
          ) : solutions.length === 0 ? (
            <StatePanel title="Nenhuma solucao ainda" description="Crie o primeiro pacote de solucao para comecar a agrupar requisitos." />
          ) : (
            <div className="grid gap-4">
              {solutions.map((solution) => {
                const isActive = solution.id === activeSolutionId;
                const coverage = requirements.length ? Math.round((solution.requirementCount / requirements.length) * 100) : 0;

                return (
                  <button
                    key={solution.id}
                    type="button"
                    onClick={() => setSelectedSolutionId(solution.id)}
                    className={`rounded-[1.5rem] border px-5 py-5 text-left transition ${
                      isActive
                        ? "border-slate-900 bg-slate-900 text-white shadow-[0_22px_44px_rgba(15,23,42,0.16)]"
                        : "border-[var(--border)] bg-[linear-gradient(180deg,#ffffff_0%,#f7fafc_100%)] text-slate-900 hover:border-slate-300 hover:bg-white"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className={`text-xs uppercase tracking-[0.18em] ${isActive ? "text-slate-300" : "text-slate-500"}`}>
                          {solution.module} · {solution.phase}
                        </p>
                        <h3 className="mt-2 font-[family-name:var(--font-heading)] text-xl font-semibold">{solution.name}</h3>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          isActive ? "bg-white/12 text-white" : solutionStatuses[solution.status]
                        }`}
                      >
                        {labelForSolutionStatus(solution.status)}
                      </span>
                    </div>
                    <p className={`mt-3 text-sm leading-6 ${isActive ? "text-slate-200" : "text-slate-600"}`}>
                      {solution.description ?? "No description available."}
                    </p>
                    <div className="mt-5 grid gap-3 md:grid-cols-3">
                      <MiniMetricInCard label="Requisitos" value={`${solution.requirementCount}`} inverted={isActive} />
                      <MiniMetricInCard label="Cobertura" value={`${coverage}%`} inverted={isActive} />
                      <MiniMetricInCard label="Wizard" value={solution.wizardReady ? "Pronto" : "Pendente"} inverted={isActive} />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Detalhe da solucao"
          description="Workspace focal para vinculo de requisitos, leitura de escopo e entrada futura no wizard."
        >
          {!activeSolution ? (
            <StatePanel title="Nenhuma solucao ativa" description="Selecione um card para inspecionar o escopo e os requisitos vinculados." />
          ) : (
            <div className="space-y-6">
              <div className="grid gap-4 lg:grid-cols-3">
                <MetricTile label="Modulo" value={activeSolution.module} />
                <MetricTile label="Fase" value={activeSolution.phase} />
                <MetricTile label="Requisitos vinculados" value={`${activeSolution.requirementCount}`} tone="accent" />
              </div>

              <div className="rounded-[1.5rem] border border-[var(--border)] bg-slate-50 px-5 py-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Detalhe</p>
                    <h3 className="mt-2 font-[family-name:var(--font-heading)] text-2xl font-semibold text-slate-900">
                      {activeSolution.name}
                    </h3>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${solutionStatuses[activeSolution.status]}`}>
                    {activeSolution.status}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {activeSolution.description ?? "Esta solucao ainda nao possui descricao."}
                </p>
              </div>

              <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Requisitos vinculados</p>
                      <h4 className="mt-1 text-lg font-semibold text-slate-900">Inventario de cobertura</h4>
                    </div>
                    <span className="rounded-full border border-[var(--border)] bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                      {activeSolution.requirements.length} vinculados
                    </span>
                  </div>

                  {activeSolution.requirements.length === 0 ? (
                    <StatePanel
                      title="Nenhum requisito vinculado"
                      description="Vincule requisitos existentes para definir a cobertura concreta deste pacote de solucao."
                    />
                  ) : (
                    <div className="space-y-3">
                      {activeSolution.requirements.map((requirement) => (
                        <div key={requirement.linkId} className="rounded-[1.35rem] border border-[var(--border)] bg-white px-4 py-4">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{requirement.code}</p>
                              <h5 className="mt-1 text-base font-semibold text-slate-900">{requirement.title}</h5>
                            </div>
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                              {requirement.module}
                            </span>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-slate-600">
                            <span className="rounded-full bg-sky-50 px-3 py-1 text-sky-800">{requirement.type}</span>
                            <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-800">{requirement.priority}</span>
                            <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-800">{requirement.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="rounded-[1.5rem] border border-[var(--border)] bg-white px-5 py-5">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Vincular requisito existente</p>
                    <h4 className="mt-1 text-lg font-semibold text-slate-900">Adicionar cobertura</h4>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Reaproveite o backlog validado em vez de duplicar escopo dentro do pacote de solucao.
                    </p>
                    <div className="mt-4 space-y-4">
                      <SelectField
                        label="Requisito"
                        value={selectedRequirementId}
                        onChange={setSelectedRequirementId}
                        options={[
                          { label: "Selecione um requisito", value: "" },
                          ...availableRequirements.map((item) => ({
                            label: `${item.code} · ${item.title}`,
                            value: item.id,
                          })),
                        ]}
                      />
                      <button
                        type="button"
                        onClick={handleLinkRequirement}
                        disabled={linkMutation.isPending || availableRequirements.length === 0}
                        className="w-full rounded-[1.15rem] bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {linkMutation.isPending ? "Vinculando..." : "Vincular requisito"}
                      </button>
                      {linkError ? <p className="text-sm font-medium text-rose-700">{linkError}</p> : null}
                    </div>
                  </div>

                <div className="rounded-[1.5rem] border border-[var(--border)] bg-[linear-gradient(180deg,#f8fbff_0%,#eef6f7_100%)] px-5 py-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Proximo passo</p>
                      <h4 className="mt-1 text-lg font-semibold text-slate-900">Contexto pronto para wizard</h4>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Esta tela ja organiza a estrutura minima esperada pelo wizard guiado: solucao delimitada,
                    requisitos vinculados e uma fronteira clara de implementacao.
                  </p>
                  <div className="mt-4">
                    <Link
                      href={`/solutions/${activeSolution.id}/wizard`}
                      className="inline-flex rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      Abrir wizard guiado
                    </Link>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <MiniMetric label="Contexto" value={activeSolution.wizardReady ? "Disponivel" : "Pendente"} />
                    <MiniMetric label="Base FDD" value={activeSolution.requirementCount ? "Pronta" : "Insuficiente"} />
                  </div>
                </div>
                </div>
              </div>
            </div>
          )}
        </SectionCard>
      </section>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-[1.15rem] border border-[var(--border)] bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-400"
      />
    </label>
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

function MiniMetric({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "accent";
}) {
  const className =
    tone === "accent"
      ? "border-teal-200 bg-teal-50 text-teal-900"
      : "border-[var(--border)] bg-white text-slate-900";

  return (
    <div className={`rounded-[1.2rem] border px-4 py-4 ${className}`}>
      <p className="text-xs uppercase tracking-[0.18em] opacity-70">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function MiniMetricInCard({
  label,
  value,
  inverted,
}: {
  label: string;
  value: string;
  inverted: boolean;
}) {
  return (
    <div
      className={`rounded-[1.2rem] border px-4 py-3 ${
        inverted ? "border-white/12 bg-white/8 text-white" : "border-[var(--border)] bg-white text-slate-900"
      }`}
    >
      <p className={`text-xs uppercase tracking-[0.18em] ${inverted ? "text-slate-300" : "text-slate-500"}`}>{label}</p>
      <p className="mt-2 text-xl font-semibold">{value}</p>
    </div>
  );
}

function StatePanel({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-[var(--border)] bg-slate-50 px-5 py-10 text-center">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}

function labelForSolutionStatus(value: SolutionRecord["status"]) {
  return {
    Draft: "Rascunho",
    "In Review": "Em revisao",
    Ready: "Pronta",
  }[value];
}
