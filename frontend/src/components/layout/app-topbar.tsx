"use client";

import { usePathname } from "next/navigation";

const titleMap: Record<string, string> = {
  "/": "Painel",
  "/projects": "Projetos",
  "/requirements": "Requisitos",
  "/solutions": "Solucoes",
  "/documents": "Documentos",
  "/templates": "Modelos",
};

function deriveTitle(pathname: string) {
  if (pathname.startsWith("/projects/")) {
    return "Detalhe do projeto";
  }

  if (pathname.startsWith("/documents/")) {
    return "Editor documental";
  }

  return titleMap[pathname] ?? "Workspace";
}

function deriveSubtitle(pathname: string) {
  if (pathname.startsWith("/projects/")) {
    return "Contexto executivo, escopo e governanca do projeto";
  }

  if (pathname.startsWith("/documents/")) {
    return "Edicao estruturada por secao e exportacao controlada";
  }

  return "Operacao documental para engenharia de solucoes SAP";
}

export function AppTopbar() {
  const pathname = usePathname();
  const title = deriveTitle(pathname);
  const subtitle = deriveSubtitle(pathname);

  return (
    <header className="flex flex-col gap-3 rounded-[1.5rem] border border-[var(--border)] bg-white/90 px-5 py-4 shadow-[0_14px_36px_rgba(15,23,42,0.05)] backdrop-blur lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Workspace de engenharia SAP</p>
        <h2 className="mt-2 font-[family-name:var(--font-heading)] text-[2rem] font-semibold text-slate-950">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{subtitle}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="rounded-full border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-2 text-sm text-slate-600">
          Modelo FDD corporativo v3
        </div>
        <div className="rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-medium text-slate-700">
          Time de arquitetura de solucoes
        </div>
      </div>
    </header>
  );
}
