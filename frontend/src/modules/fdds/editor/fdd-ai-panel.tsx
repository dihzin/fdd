"use client";

import type { AiAction, FddSection } from "@/modules/fdds/editor/types";

type FddAiPanelProps = {
  section: FddSection;
  onRunAction: (action: AiAction) => void;
  isBusy: boolean;
  busyAction?: AiAction | null;
};

const actions: Array<{ id: AiAction; label: string; description: string }> = [
  {
    id: "generate",
    label: "Gerar secao",
    description: "Solicita um primeiro rascunho estruturado com base em projeto, solucao, wizard e requisitos vinculados.",
  },
  {
    id: "improve",
    label: "Melhorar redacao",
    description: "Ajusta o tom da secao, reduz repeticao e aproxima a escrita do padrao formal de documentacao funcional.",
  },
  {
    id: "expand",
    label: "Expandir conteudo",
    description: "Adiciona detalhes de implementacao, premissas e pontos de controle sem quebrar a estrutura atual.",
  },
  {
    id: "restructure",
    label: "Reestruturar secao",
    description: "Reorganiza a secao em uma hierarquia mais limpa, com titulos mais fortes e melhor fluidez.",
  },
];

export function FddAiPanel({ section, onRunAction, isBusy, busyAction }: FddAiPanelProps) {
  return (
    <aside className="rounded-[2rem] border border-[var(--border)] bg-[linear-gradient(180deg,#fffdfa_0%,#f7f1e8_100%)] p-5 shadow-[0_24px_60px_rgba(125,83,30,0.12)]">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.24em] text-amber-700">Acoes de IA</p>
        <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-slate-900">Copiloto da secao</h2>
        <p className="text-sm leading-6 text-slate-600">
          Atue sobre <span className="font-semibold text-slate-800">{section.title}</span> mantendo o restante do mapa documental estavel.
        </p>
      </div>

      <div className="mt-6 space-y-3">
        {actions.map((action) => {
          const active = busyAction === action.id;

          return (
            <button
              key={action.id}
              type="button"
              onClick={() => onRunAction(action.id)}
              disabled={isBusy}
              className="w-full rounded-[1.5rem] border border-[#e5d6bf] bg-white/85 p-4 text-left transition hover:border-amber-300 hover:bg-white disabled:cursor-wait disabled:opacity-60"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-slate-900">{action.label}</h3>
                <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${active ? "bg-slate-900 text-white" : "bg-amber-100 text-amber-800"}`}>
                  {active ? "Em execucao" : "IA"}
                </span>
              </div>
              <p className="mt-2 text-sm leading-5 text-slate-600">{action.description}</p>
            </button>
          );
        })}
      </div>

      <div className="mt-6 rounded-[1.5rem] border border-[#e5d6bf] bg-white/70 p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Status de geracao</p>
        <p className="mt-2 text-sm font-semibold text-slate-900">{labelForStatus(section.generationStatus)}</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Ultima atualizacao da secao em {formatUpdatedAt(section.updatedAt)}. Use salvar para persistir as edicoes manuais independentemente das acoes de IA.
        </p>
      </div>
    </aside>
  );
}

function labelForStatus(status: FddSection["generationStatus"]) {
  return {
    draft: "Rascunho",
    generated: "Gerada",
    reviewed: "Revisada",
    approved: "Aprovada",
  }[status];
}

function formatUpdatedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "nao disponivel";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
