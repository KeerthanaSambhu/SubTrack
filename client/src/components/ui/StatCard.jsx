import AnimatedNumber from './AnimatedNumber';

/** A labelled headline statistic card with smooth hover lift and animated numbers. */
export default function StatCard({
  label,
  value,
  numericValue,
  currency,
  detail,
  icon: Icon,
  accent = 'lavender',
  featured = false,
  trend,
  className = '',
}) {
  const accentStyles = {
    lavender: {
      icon: 'bg-lavender/12 text-lavender border-lavender/25 shadow-[0_0_16px_-4px_var(--color-lavender-glow)]',
      indicator: 'bg-lavender',
    },
    lime: {
      icon: 'bg-lime/12 text-lime border-lime/25 shadow-[0_0_16px_-4px_var(--color-lime-glow)]',
      indicator: 'bg-lime',
    },
    warn: {
      icon: 'bg-warn/12 text-warn border-warn/25 shadow-[0_0_16px_-4px_color-mix(in_oklab,var(--color-warn)_30%,transparent)]',
      indicator: 'bg-warn',
    },
    muted: {
      icon: 'bg-raised text-muted border-line-strong',
      indicator: 'bg-muted',
    },
  }[accent] || {
    icon: 'bg-lavender/12 text-lavender border-lavender/25',
    indicator: 'bg-lavender',
  };

  const hasNumeric = numericValue !== undefined && numericValue !== null;

  return (
    <div
      className={`card group relative flex min-w-0 flex-col overflow-hidden p-4.5 sm:p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-[var(--shadow-card-hover)] ${
        featured
          ? 'border-lavender/30 bg-gradient-to-b from-lavender/10 via-surface to-surface shadow-[var(--shadow-card-featured)]'
          : 'bg-surface'
      } ${className}`}
    >
      {/* Subtle top indicator bar */}
      <div
        className={`absolute inset-x-0 top-0 h-[2px] transition-opacity duration-200 ${
          featured ? 'opacity-100 bg-gradient-to-r from-transparent via-lavender to-transparent' : 'opacity-0 group-hover:opacity-100 bg-gradient-to-r from-transparent via-fg/15 to-transparent'
        }`}
        aria-hidden
      />

      <div className="flex items-center justify-between gap-2">
        <p className="text-[13px] font-medium text-muted transition-colors group-hover:text-fg/90 sm:text-sm">
          {label}
        </p>
        {Icon && (
          <span
            className={`flex size-8 shrink-0 items-center justify-center rounded-xl border transition-transform duration-200 group-hover:scale-105 sm:size-9 ${accentStyles.icon}`}
          >
            <Icon className="size-4" aria-hidden />
          </span>
        )}
      </div>

      <div className="mt-3.5 flex items-baseline gap-2">
        <p className="truncate font-display text-[22px] font-semibold leading-tight text-fg tabular sm:text-[28px] tracking-tight">
          {hasNumeric ? (
            <AnimatedNumber value={numericValue} currency={currency} />
          ) : (
            value
          )}
        </p>
        {trend && (
          <span className="text-xs font-medium text-lime">{trend}</span>
        )}
      </div>

      {detail && (
        <p className="mt-1.5 truncate text-xs text-faint transition-colors group-hover:text-muted sm:text-[13px]">
          {detail}
        </p>
      )}
    </div>
  );
}
