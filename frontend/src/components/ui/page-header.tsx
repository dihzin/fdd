type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function PageHeader({ eyebrow, title, description }: PageHeaderProps) {
  return (
    <header className="mb-8 space-y-3">
      <span className="inline-flex rounded-full bg-[var(--surface-muted)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-strong)]">
        {eyebrow}
      </span>
      <div className="space-y-3">
        <h1 className="font-[family-name:var(--font-heading)] text-4xl font-semibold tracking-tight text-slate-900">
          {title}
        </h1>
        <p className="max-w-3xl text-base leading-7 text-slate-600">{description}</p>
      </div>
    </header>
  );
}
