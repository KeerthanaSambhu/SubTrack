import { Loader2 } from 'lucide-react';

const VARIANTS = {
  primary:
    'bg-lavender text-canvas font-semibold shadow-[var(--shadow-lavender)] hover:bg-lavender-strong active:bg-lavender-strong hover:shadow-[0_6px_24px_-2px_rgba(167,139,250,0.5)] border border-lavender-strong/40',
  accent:
    'bg-lime text-canvas font-semibold shadow-[var(--shadow-lime)] hover:bg-lime-strong active:bg-lime-strong hover:shadow-[0_6px_24px_-2px_rgba(196,232,101,0.45)] border border-lime-strong/40',
  secondary:
    'border border-line-strong bg-raised text-fg shadow-sm hover:border-white/20 hover:bg-raised-hover active:bg-raised-hover/90',
  ghost:
    'text-muted hover:bg-raised/80 hover:text-fg active:bg-raised',
  danger:
    'bg-danger text-canvas font-semibold shadow-[0_4px_16px_-2px_rgba(248,113,113,0.35)] hover:bg-danger-strong active:bg-danger-strong border border-danger-strong/40',
  'danger-ghost':
    'text-danger hover:bg-danger/10 active:bg-danger/15',
  outline:
    'border border-line bg-transparent text-fg hover:border-line-strong hover:bg-surface/50 active:bg-surface',
};

const SIZES = {
  xs: 'h-8 px-2.5 text-xs gap-1.5 rounded-lg',
  sm: 'h-9 px-3 text-sm gap-1.5 rounded-xl',
  md: 'h-10 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-11 px-5 text-[15px] gap-2 rounded-xl',
  icon: 'size-10 justify-center rounded-xl p-0',
  'icon-sm': 'size-8 justify-center rounded-lg p-0',
};

/**
 * Premium SaaS Button with crisp tactile feedback, smooth transitions,
 * visible focus rings, and animated loading states.
 * Pass `as={Link}` (plus `to`) to render as a router link.
 */
export default function Button({
  as: Component = 'button',
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className = '',
  children,
  type,
  ...props
}) {
  const isButton = Component === 'button';
  return (
    <Component
      type={isButton ? type || 'button' : undefined}
      disabled={isButton ? disabled || loading : undefined}
      aria-busy={loading || undefined}
      className={`relative inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap font-medium transition-all duration-150 ease-out active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lavender focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 ${VARIANTS[variant] || VARIANTS.primary} ${SIZES[size] || SIZES.md} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="size-4 animate-spin text-current" aria-hidden />
          <span className="opacity-70">{children}</span>
        </>
      ) : (
        children
      )}
    </Component>
  );
}
