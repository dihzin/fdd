"use client";

import type { FddSection, SectionGenerationStatus } from "@/modules/fdds/editor/types";

type FddSectionsSidebarProps = {
  sections: FddSection[];
  activeSectionId: string;
  dirtySectionIds: string[];
  onSelect: (sectionId: string) => void;
};

const statusLabel: Record<SectionGenerationStatus, string> = {
  draft: "Rascunho",
  generated: "Gerada",
  reviewed: "Revisada",
  approved: "Aprovada",
};

const statusStyle: Record<SectionGenerationStatus, string> = {
  draft: "bg-amber-100 text-amber-800",
  generated: "bg-sky-100 text-sky-800",
  reviewed: "bg-rose-100 text-rose-800",
  approved: "bg-emerald-100 text-emerald-800",
};

export function FddSectionsSidebar({
  sections,
  activeSectionId,
  dirtySectionIds,
  onSelect,
}: FddSectionsSidebarProps) {
  const dirtySectionSet = new Set(dirtySectionIds);

  return (
    <aside className="rounded-[2rem] border border-[var(--border)] bg-[#0f1729] p-4 text-white shadow-[0_28px_60px_rgba(15,23,41,0.25)]">
      <div className="mb-4 flex items-center justify-between px-2">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/70">Mapa do documento</p>
          <h2 className="mt-2 font-[family-name:var(--font-heading)] text-xl font-semibold">Secoes</h2>
        </div>
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">{sections.length} itens</span>
      </div>

      <div className="space-y-3">
        {sections.map((section, index) => {
          const active = section.id === activeSectionId;
          const dirty = dirtySectionSet.has(section.id);

          return (
            <button
              key={section.id}
              type="button"
              onClick={() => onSelect(section.id)}
              className={`w-full rounded-[1.5rem] border p-4 text-left transition ${
                active
                  ? "border-cyan-300/50 bg-white text-slate-900 shadow-[0_18px_40px_rgba(14,165,233,0.18)]"
                  : "border-white/10 bg-white/5 text-white hover:border-white/20 hover:bg-white/10"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className={`text-xs uppercase tracking-[0.18em] ${active ? "text-cyan-700" : "text-cyan-200/70"}`}>
                    Secao {index + 1}
                  </p>
                  <h3 className="mt-2 text-sm font-semibold leading-5">{section.title}</h3>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span
                    className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                      active ? statusStyle[section.generationStatus] : "bg-white/10 text-white/85"
                    }`}
                  >
                    {statusLabel[section.generationStatus]}
                  </span>
                  {dirty ? (
                    <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${active ? "bg-amber-100 text-amber-800" : "bg-amber-300/20 text-amber-100"}`}>
                      Nao salvo
                    </span>
                  ) : null}
                </div>
              </div>

              <p className={`mt-3 text-sm leading-5 ${active ? "text-slate-600" : "text-white/65"}`}>
                {section.summary}
              </p>

              <div className={`mt-4 flex items-center justify-between text-xs ${active ? "text-slate-500" : "text-white/50"}`}>
                <span>{section.owner}</span>
                <span>{section.wordCount} words</span>
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
