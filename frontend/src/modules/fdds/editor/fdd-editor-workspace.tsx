"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { startTransition, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";

import { DocumentExportButton } from "@/modules/documents/document-export-button";
import { applyLocalAiAction, fetchDocumentStructure, generateDocumentSection, saveDocumentSection } from "@/modules/fdds/editor/api";
import { FddAiPanel } from "@/modules/fdds/editor/fdd-ai-panel";
import { FddRichTextEditor } from "@/modules/fdds/editor/fdd-rich-text-editor";
import { FddSectionsSidebar } from "@/modules/fdds/editor/fdd-sections-sidebar";
import type { AiAction, FddDocument, FddEditorContent, FddSection } from "@/modules/fdds/editor/types";
import { fetchProjects } from "@/modules/requirements/api";
import { fetchSolution } from "@/modules/solutions/api";

type FddEditorWorkspaceProps = {
  documentId: string;
};

export function FddEditorWorkspace({ documentId }: FddEditorWorkspaceProps) {
  const queryClient = useQueryClient();
  const [activeSectionId, setActiveSectionId] = useState("");
  const [draftSections, setDraftSections] = useState<Record<string, FddSection>>({});
  const [dirtySectionIds, setDirtySectionIds] = useState<string[]>([]);
  const [workspaceMessage, setWorkspaceMessage] = useState("Secao pronta para edicao.");
  const [busyAction, setBusyAction] = useState<AiAction | null>(null);
  const initializedDocumentRef = useRef("");

  const documentQuery = useQuery({
    queryKey: ["fdd-document", documentId],
    queryFn: () => fetchDocumentStructure(documentId),
  });
  const projectsQuery = useQuery({
    queryKey: ["projects", "document-export"],
    queryFn: fetchProjects,
  });

  const saveMutation = useMutation({
    mutationFn: saveDocumentSection,
    onSuccess: (savedSection) => {
      syncSection(savedSection);
      setDirtySectionIds((current) => current.filter((sectionId) => sectionId !== savedSection.id));
      setWorkspaceMessage(`${savedSection.title} salva.`);
    },
  });

  const generateMutation = useMutation({
    mutationFn: generateDocumentSection,
    onSuccess: (generatedSection) => {
      syncSection(generatedSection);
      setDirtySectionIds((current) => current.filter((sectionId) => sectionId !== generatedSection.id));
      setWorkspaceMessage(`${generatedSection.title} gerada e carregada no editor.`);
    },
  });

  useEffect(() => {
    if (!documentQuery.data || initializedDocumentRef.current === documentQuery.data.id) {
      return;
    }

    const mappedSections = Object.fromEntries(documentQuery.data.sections.map((section) => [section.id, section]));
    setDraftSections(mappedSections);
    setActiveSectionId(documentQuery.data.sections[0]?.id ?? "");
    setDirtySectionIds([]);
    initializedDocumentRef.current = documentQuery.data.id;
  }, [documentQuery.data]);

  const document = documentQuery.data;
  const solutionQuery = useQuery({
    queryKey: ["solution", "document-export", document?.solutionId ?? ""],
    queryFn: () => fetchSolution(document?.solutionId ?? ""),
    enabled: Boolean(document?.solutionId),
  });
  const sections = useMemo(() => {
    if (!document) {
      return [];
    }

    return document.sections.map((section) => draftSections[section.id] ?? section);
  }, [document, draftSections]);

  const deferredSectionId = useDeferredValue(activeSectionId);
  const activeSection = useMemo(
    () => sections.find((section) => section.id === deferredSectionId) ?? sections[0] ?? null,
    [deferredSectionId, sections],
  );

  const handleSectionSelect = (sectionId: string) => {
    startTransition(() => {
      setActiveSectionId(sectionId);
      setWorkspaceMessage("Secao alterada. Rascunho local preservado.");
    });
  };

  const handleContentChange = (content: FddEditorContent) => {
    if (!activeSection) {
      return;
    }

    setDraftSections((current) => ({
      ...current,
      [activeSection.id]: {
        ...activeSection,
        contentHtml: content.html,
        contentText: content.text,
        contentJson: {
          ...content.json,
          html: content.html,
        },
        wordCount: estimateWords(content.text),
      },
    }));
    setDirtySectionIds((current) => (current.includes(activeSection.id) ? current : [...current, activeSection.id]));
    setWorkspaceMessage(`Editando ${activeSection.title}. As alteracoes permanecem locais ate salvar a secao.`);
  };

  const handleSaveSection = async () => {
    if (!activeSection) {
      return;
    }

    setWorkspaceMessage(`Salvando ${activeSection.title}...`);
    await saveMutation.mutateAsync({
      documentId,
      section: activeSection,
    });
  };

  const handleAiAction = async (action: AiAction) => {
    if (!activeSection) {
      return;
    }

    setBusyAction(action);
    setWorkspaceMessage(`Executando ${action} em ${activeSection.title}...`);

    try {
      if (action === "generate") {
        await generateMutation.mutateAsync({
          documentId,
          sectionId: activeSection.id,
        });
        return;
      }

      const nextSection = applyLocalAiAction(activeSection, action);
      setDraftSections((current) => ({
        ...current,
        [nextSection.id]: nextSection,
      }));
      setDirtySectionIds((current) => (current.includes(nextSection.id) ? current : [...current, nextSection.id]));
      setWorkspaceMessage(`${labelForAction(action)} aplicada localmente. Salve a secao para persistir a mudanca.`);
    } finally {
      setBusyAction(null);
    }
  };

  const isBusy = saveMutation.isPending || generateMutation.isPending || busyAction !== null;
  const activeSectionIsDirty = activeSection ? dirtySectionIds.includes(activeSection.id) : false;
  const projectName =
    projectsQuery.data?.find((project) => project.id === document?.projectId)?.name ?? shortId(document?.projectId ?? "");
  const solutionName = solutionQuery.data?.name ?? (document?.solutionId ? shortId(document.solutionId) : "No solution");

  if (documentQuery.isLoading || !document || !activeSection) {
    return (
      <div className="rounded-[2rem] border border-[var(--border)] bg-white p-10 text-center shadow-[0_24px_70px_rgba(18,50,71,0.08)]">
        <p className="text-sm font-semibold text-slate-900">Carregando editor estruturado...</p>
        <p className="mt-2 text-sm text-slate-600">Preparando secoes, conteudo e controles do workspace documental.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-[var(--border)] bg-[linear-gradient(135deg,#0f172a_0%,#123247_42%,#0f766e_100%)] p-6 text-white shadow-[0_32px_90px_rgba(15,23,42,0.28)]">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-4">
            <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100">
              Workspace documental estruturado
            </span>
            <div>
              <h1 className="font-[family-name:var(--font-heading)] text-4xl font-semibold tracking-tight">{document.title}</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-200">
                Ambiente de edicao estruturada para secoes do FDD, com navegacao por secao, texto rico controlado e apoio de IA.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <MetricCard label="Projeto" value={projectName} />
            <MetricCard label="Solucao" value={solutionName} />
            <MetricCard label="Status" value={`${humanizeStatus(document.status)} · v${document.version}`} />
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)_320px]">
        <FddSectionsSidebar
          sections={sections}
          activeSectionId={activeSection.id}
          dirtySectionIds={dirtySectionIds}
          onSelect={handleSectionSelect}
        />

        <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[0_24px_70px_rgba(18,50,71,0.08)]">
          <div className="mb-5 flex flex-col gap-4 border-b border-[var(--border)] pb-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{activeSection.sectionKey}</p>
              <h2 className="mt-2 font-[family-name:var(--font-heading)] text-3xl font-semibold text-slate-900">{activeSection.title}</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{activeSection.summary}</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <StatusPill status={activeSection.generationStatus} />
              {activeSectionIsDirty ? (
                <span className="rounded-full bg-amber-100 px-3 py-2 text-sm font-semibold text-amber-800">Alteracoes nao salvas</span>
              ) : null}
              <DocumentExportButton
                documentId={document.id}
                projectName={projectName}
                solutionName={solutionName}
                version={document.version}
                compact
                label="Exportar Word"
                disabled={dirtySectionIds.length > 0}
                disabledMessage="Salve as secoes editadas antes de exportar o arquivo Word."
              />
              <button
                type="button"
                onClick={() => void handleSaveSection()}
                disabled={saveMutation.isPending}
                className="rounded-2xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_32px_rgba(15,118,110,0.2)] transition hover:bg-[var(--accent-strong)] disabled:cursor-wait disabled:opacity-60"
              >
                {saveMutation.isPending ? "Salvando..." : "Salvar secao"}
              </button>
            </div>
          </div>

          <div className="mb-5 grid gap-3 md:grid-cols-3">
            <InlineDetail label="Responsavel" value={activeSection.owner} />
            <InlineDetail label="Ultima atualizacao" value={formatUpdatedAt(activeSection.updatedAt)} />
            <InlineDetail label="Contagem de palavras" value={`${activeSection.wordCount}`} />
          </div>

          <FddRichTextEditor content={activeSection.contentHtml} onChange={handleContentChange} />

          <div className="mt-4 rounded-3xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm text-slate-600">
            {workspaceMessage}
          </div>
        </div>

        <FddAiPanel section={activeSection} onRunAction={handleAiAction} isBusy={isBusy} busyAction={busyAction} />
      </section>
    </div>
  );

  function syncSection(section: FddSection) {
    setDraftSections((current) => ({
      ...current,
      [section.id]: section,
    }));
    queryClient.setQueryData<FddDocument>(["fdd-document", documentId], (current) =>
      current
        ? {
            ...current,
            sections: current.sections.map((item) => (item.id === section.id ? section : item)),
          }
        : current,
    );
  }
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] border border-white/12 bg-white/8 px-4 py-3 backdrop-blur">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-300">{label}</p>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function InlineDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.35rem] border border-[var(--border)] bg-white px-4 py-3">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function StatusPill({ status }: { status: FddSection["generationStatus"] }) {
  const content = {
    draft: "Rascunho",
    generated: "Gerada",
    reviewed: "Revisada",
    approved: "Aprovada",
  }[status];

  const style = {
    draft: "bg-amber-100 text-amber-800",
    generated: "bg-sky-100 text-sky-800",
    reviewed: "bg-rose-100 text-rose-800",
    approved: "bg-emerald-100 text-emerald-800",
  }[status];

  return <span className={`rounded-full px-3 py-2 text-sm font-semibold ${style}`}>{content}</span>;
}

function estimateWords(contentText: string) {
  return contentText.trim().split(/\s+/).filter(Boolean).length;
}

function formatUpdatedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Nao salvo";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function shortId(value: string) {
  return value.length > 18 ? `${value.slice(0, 8)}...${value.slice(-4)}` : value;
}

function humanizeStatus(value: FddDocument["status"]) {
  return {
    draft: "Rascunho",
    in_review: "Em revisao",
    approved: "Aprovado",
    exported: "Exportado",
    archived: "Arquivado",
  }[value];
}

function labelForAction(action: Exclude<AiAction, "generate">) {
  return {
    improve: "Melhoria de redacao",
    expand: "Expansao de conteudo",
    restructure: "Reestruturacao da secao",
  }[action];
}
