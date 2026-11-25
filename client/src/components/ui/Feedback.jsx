import { AlertCircle, Loader2, RotateCw } from 'lucide-react';
import Button from './Button';

export function Spinner({ label = 'Loading', className = '' }) {
  return (
    <div role="status" className={`flex items-center justify-center gap-2.5 text-xs font-medium text-muted ${className}`}>
      <Loader2 className="size-4.5 animate-spin text-lavender" aria-hidden />
      <span>{label}…</span>
    </div>
  );
}

export function FullPageSpinner() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="size-8 animate-spin text-lavender" aria-hidden />
        <p className="font-display text-sm font-semibold text-muted tracking-tight">Initializing SubTrack…</p>
      </div>
    </div>
  );
}

/** Grey shimmer blocks with refined shimmer animation. */
export function Skeleton({ className = '' }) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-raised/60 before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-fg/[0.05] before:to-transparent ${className}`}
      aria-hidden
    />
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading workspace">
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4 lg:gap-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-5">
        <Skeleton className="h-72 rounded-2xl lg:col-span-3" />
        <Skeleton className="h-72 rounded-2xl lg:col-span-2" />
      </div>
      <Skeleton className="h-48 rounded-2xl" />
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action, compact = false }) {
  return (
    <div className={`flex flex-col items-center text-center ${compact ? 'px-4 py-8' : 'px-6 py-14'}`}>
      {Icon && (
        <span className="mb-4 flex size-13 items-center justify-center rounded-2xl border border-line-strong bg-raised/80 text-lavender shadow-[var(--shadow-card)]">
          <Icon className="size-6" aria-hidden />
        </span>
      )}
      <h3 className="font-display text-base font-bold text-fg tracking-tight">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center border-danger/25 shadow-[var(--shadow-card)]">
      <span className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-danger/10 text-danger ring-1 ring-danger/25">
        <AlertCircle className="size-6" aria-hidden />
      </span>
      <h3 className="font-display text-base font-bold text-fg">Unable to load workspace data</h3>
      <p className="mt-1.5 max-w-sm text-xs text-muted leading-relaxed">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-5" onClick={onRetry}>
          <RotateCw className="size-3.5" aria-hidden />
          <span>Try again</span>
        </Button>
      )}
    </div>
  );
}

export function FormAlert({ message }) {
  if (!message) return null;
  return (
    <div role="alert" className="flex items-start gap-3 rounded-2xl border border-danger/30 bg-danger/10 p-3.5 text-xs text-danger shadow-sm">
      <AlertCircle className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />
      <span className="leading-relaxed font-medium">{message}</span>
    </div>
  );
}
