export function MetricTile({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "accent";
}) {
  const toneClass =
    tone === "accent"
      ? "bg-[linear-gradient(135deg,#0f766e_0%,#164e63_100%)] text-white"
      : "bg-white text-slate-900";

  return (
    <div className={`rounded-[1.35rem] border border-[var(--border)] px-5 py-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)] ${toneClass}`}>
      <p className={`text-xs uppercase tracking-[0.18em] ${tone === "accent" ? "text-white/70" : "text-slate-500"}`}>
        {label}
      </p>
      <p className="mt-2 font-[family-name:var(--font-heading)] text-[2rem] font-semibold">{value}</p>
    </div>
  );
}
