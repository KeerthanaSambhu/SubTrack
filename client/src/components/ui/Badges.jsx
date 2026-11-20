import { getCategory } from '../../lib/constants';

const STATUS_STYLES = {
  active: {
    label: 'Active',
    className: 'bg-lime/10 text-lime border border-lime/25 shadow-[0_0_12px_-2px_rgba(196,232,101,0.2)]',
    dot: 'bg-lime shadow-[0_0_6px_rgba(196,232,101,0.8)]',
  },
  paused: {
    label: 'Paused',
    className: 'bg-warn/10 text-warn border border-warn/25 shadow-[0_0_12px_-2px_rgba(251,191,36,0.15)]',
    dot: 'bg-warn shadow-[0_0_6px_rgba(251,191,36,0.8)]',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-raised text-muted border border-line-strong',
    dot: 'bg-faint',
  },
};

export function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.active;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide uppercase ${style.className}`}>
      <span className={`size-1.5 rounded-full ${style.dot}`} aria-hidden />
      {style.label}
    </span>
  );
}

export function CategoryBadge({ category, showBg = false }) {
  const cat = getCategory(category);
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium ${
        showBg ? 'rounded-full border border-line px-2.5 py-0.5 bg-raised/50 text-fg' : 'text-muted'
      }`}
    >
      <span
        className="size-2 rounded-full shrink-0"
        style={{
          backgroundColor: cat.color,
          boxShadow: `0 0 6px ${cat.color}66`,
        }}
        aria-hidden
      />
      <span>{cat.label}</span>
    </span>
  );
}

/** Square tile with the subscription's initial, tinted by its category. */
export function SubscriptionAvatar({ subscription, size = 'md' }) {
  const cat = getCategory(subscription.category);
  const dims = {
    sm: 'size-9 text-xs rounded-lg',
    md: 'size-11 text-sm rounded-xl',
    lg: 'size-14 text-lg rounded-2xl',
  }[size];

  return (
    <span
      className={`relative flex shrink-0 items-center justify-center font-display font-semibold transition-transform duration-200 group-hover:scale-105 ${dims}`}
      style={{
        backgroundColor: `color-mix(in oklab, ${cat.color} 16%, var(--color-surface))`,
        color: `color-mix(in oklab, ${cat.color} 75%, var(--color-fg))`,
        boxShadow: `inset 0 1px 0 0 rgba(255, 255, 255, 0.1), inset 0 0 0 1px color-mix(in oklab, ${cat.color} 35%, transparent), 0 4px 12px -2px rgba(0, 0, 0, 0.35)`,
      }}
      aria-hidden
    >
      {subscription.name.trim().charAt(0).toUpperCase() || '?'}
    </span>
  );
}
