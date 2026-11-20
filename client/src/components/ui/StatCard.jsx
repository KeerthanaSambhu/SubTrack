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
      icon: 'bg-lavender/12 text-lavender border-lavender/25 shadow-[0_0_16px_-4px_rgba(167,139,250,0.35)]',
      glow: 'rgba(167, 139, 250, 0.08)',
      indicator: 'bg-lavender',
    },
    lime: {
      icon: 'bg-lime/12 text-lime border-lime/25 shadow-[0_0_16px_-4px_rgba(196,232,101,0.3)]',
      glow: 'rgba(196, 232, 101, 0.07)',
      indicator: 'bg-lime',
    },
    warn: {
      icon: 'bg-warn/12 text-warn border-warn/25 shadow-[0_0_16px_-4px_rgba(251,191,36,0.25)]',
      glow: 'rgba(251, 191, 36, 0.06)',
      indicator: 'bg-warn',
    },
    muted: {
      icon: 'bg-raised text-muted border-line-strong',
      glow: 'rgba(255, 255, 255, 0.02)',
      indicator: 'bg-muted',
    },
  }[accent] || {
    icon: 'bg-lavender/12 text-lavender border-lavender/25',
    glow: 'rgba(167, 139, 250, 0.08)',
    indicator: 'bg-lavender',
  };

  const hasNumeric = numericValue !== undefined && numericValue !== null;

  return (
    <div
      className={`card group relative flex min-w-0 flex-col overflow-hidden p-4.5 sm:p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-[var(--shadow-card-hover)] ${
        featured
          ? 'border-lavender/30 bg-gradient-to-b from-[rgba(167,139,250,0.09)] via-surface to-surface shadow-[var(--shadow-card-featured)]'
          : 'bg-surface'
      } ${className}`}
    >
      {/* Subtle top indicator bar */}
      <div
        className={`absolute inset-x-0 top-0 h-[2px] transition-opacity duration-200 ${
          featured ? 'opacity-100 bg-gradient-to-r from-transparent via-lavender to-transparent' : 'opacity-0 group-hover:opacity-100 bg-gradient-to-r from-transparent via-white/20 to-transparent'
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
