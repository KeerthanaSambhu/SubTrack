export default function PageHeader({ title, description, actions, badge }) {
  return (
    <header className="mb-7 flex flex-col gap-4 sm:mb-9 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {badge && <div className="mb-2">{badge}</div>}
        <h1 className="font-display text-2xl font-bold tracking-tight text-fg sm:text-[32px] leading-tight">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-muted sm:text-[15px] leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2.5">
          {actions}
        </div>
      )}
    </header>
  );
}
