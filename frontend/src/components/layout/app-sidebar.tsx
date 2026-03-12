"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { href: "/", label: "Painel", short: "PN" },
  { href: "/projects", label: "Projetos", short: "PJ" },
  { href: "/requirements", label: "Requisitos", short: "RQ" },
  { href: "/solutions", label: "Solucoes", short: "SL" },
  { href: "/documents", label: "Documentos", short: "DC" },
  { href: "/templates", label: "Modelos", short: "MD" },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full min-h-0 flex-col rounded-[1.75rem] border border-white/8 bg-[linear-gradient(180deg,#08111d_0%,#0d1b2f_58%,#12253c_100%)] p-4 text-white shadow-[0_24px_64px_rgba(11,18,32,0.28)]">
      <div className="border-b border-white/8 pb-4">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-[1.1rem] bg-[linear-gradient(135deg,#0f766e_0%,#0f4c81_100%)] text-sm font-bold tracking-[0.2em]">
            FDD
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Engenharia SAP</p>
            <h1 className="mt-1 font-[family-name:var(--font-heading)] text-[1.15rem] font-semibold">Workspace FDD</h1>
          </div>
        </div>
        <p className="mt-4 text-sm leading-6 text-slate-400">
          Ambiente interno para engenharia de solucoes, consolidacao de requisitos e producao estruturada de FDD.
        </p>
      </div>

      <nav className="mt-5 flex-1 space-y-2 overflow-auto pr-1">
        {navigation.map((item) => {
          const active =
            pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 rounded-[1.2rem] border px-3 py-3 transition ${
                active
                  ? "border-cyan-300/30 bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_100%)] text-slate-900 shadow-[0_14px_28px_rgba(56,189,248,0.12)]"
                  : "border-transparent text-slate-300 hover:border-white/10 hover:bg-white/6 hover:text-white"
              }`}
            >
              <span
                className={`grid h-9 w-9 place-items-center rounded-[0.9rem] text-[11px] font-semibold tracking-[0.16em] ${
                  active ? "bg-slate-100 text-slate-900" : "bg-white/8 text-slate-300"
                }`}
              >
                {item.short}
              </span>
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="rounded-[1.4rem] border border-cyan-400/16 bg-cyan-400/8 p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-200/80">Status operacional</p>
        <p className="mt-3 text-sm font-semibold text-white">Template corporativo ativo</p>
        <p className="mt-2 text-sm leading-6 text-cyan-100/70">
          Estrutura pronta para projetos, requisitos, solucoes, documentos e governanca de modelos.
        </p>
      </div>
    </aside>
  );
}
