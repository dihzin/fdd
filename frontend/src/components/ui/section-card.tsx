export function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[1.5rem] border border-[var(--border)] bg-white p-4 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
      <div className="mb-4">
        <h3 className="font-[family-name:var(--font-heading)] text-xl font-semibold text-slate-900">{title}</h3>
        {description ? <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
