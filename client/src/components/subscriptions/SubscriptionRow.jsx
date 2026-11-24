
import { ChevronRight, Calendar } from 'lucide-react';
import { SubscriptionAvatar, StatusBadge, CategoryBadge } from '../ui/Badges';
import { useSubscriptions } from '../../context/SubscriptionsContext';
import { getCycle } from '../../lib/constants';
import { nextPaymentDate } from '../../lib/billing';
import { formatDate, formatMoney } from '../../lib/format';

/**
 * A subscription as a tappable row. Opens the details dialog.
 * `variant="compact"` hides the category / next-payment columns.
 */
export default function SubscriptionRow({
  subscription: sub,
  variant = 'full',
  inrRate = null,
}) {
  const { openDetails } = useSubscriptions();
  const cycle = getCycle(sub.billingCycle);
  const next = nextPaymentDate(sub);
  const muted = sub.status !== 'active';

  const hasInrEquivalent =
    sub.currency === 'USD' &&
    Number.isFinite(inrRate) &&
    inrRate > 0;

  const inrAmount = hasInrEquivalent
    ? Number(sub.amount) * inrRate
    : null;

  return (
    <li>
      <button
        type="button"
        onClick={() => openDetails(sub)}
        className={`group relative flex w-full items-center gap-3.5 rounded-xl border border-transparent px-3 py-3 text-left transition-all duration-150 hover:border-line-strong hover:bg-raised/75 hover:shadow-[0_4px_16px_-4px_rgba(0,0,0,0.3)] sm:gap-4 sm:px-4 ${
          muted ? 'opacity-70 hover:opacity-100' : ''
        }`}
        aria-label={`${sub.name}, ${formatMoney(sub.amount, sub.currency)} per ${cycle.noun}. View details`}
      >
        {/* Category-tinted avatar monogram */}
        <span className="shrink-0">
          <SubscriptionAvatar
            subscription={sub}
            size={variant === 'compact' ? 'sm' : 'md'}
          />
        </span>

        {/* Subscription Name and Category */}
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className={`truncate text-sm font-semibold tracking-tight transition-colors group-hover:text-fg ${muted ? 'text-muted' : 'text-fg'}`}>
              {sub.name}
            </span>
            {sub.status !== 'active' && <StatusBadge status={sub.status} />}
          </span>

          <span className="mt-0.5 block truncate text-[13px] text-faint">
            {variant === 'full' ? (
              <span className="sm:hidden">
                {next
                  ? `Next: ${formatDate(next, { withYear: false })}`
                  : cycle.label}
              </span>
            ) : null}

            <span className={variant === 'full' ? 'hidden sm:inline-flex items-center gap-2' : ''}>
              {variant === 'full' ? (
                <>
                  <CategoryBadge category={sub.category} />
                  <span className="text-line-strong" aria-hidden>•</span>
                  <span>{cycle.label}</span>
                </>
              ) : (
                `${cycle.label} · Added ${formatDate(new Date(sub.createdAt), { withYear: false })}`
              )}
            </span>
          </span>
        </span>

        {/* Next payment date (desktop) */}
        {variant === 'full' && (
          <span className="hidden w-36 shrink-0 text-sm text-muted md:flex items-center gap-1.5 font-medium">
            <Calendar className="size-3.5 text-faint" aria-hidden />
            {next ? formatDate(next) : <span className="text-faint">—</span>}
          </span>
        )}

        {/* Cost, INR equivalent and cadence */}
        <span className="shrink-0 text-right">
          <span className={`block font-display text-sm font-semibold tabular tracking-tight transition-colors ${muted ? 'text-muted' : 'text-fg'}`}>
            {formatMoney(sub.amount, sub.currency)}
          </span>

          {hasInrEquivalent && (
            <span className="mt-0.5 block text-[11px] font-medium text-muted tabular">
              ≈ {formatMoney(inrAmount, 'INR')}
            </span>
          )}

          <span className="block text-[11px] text-faint font-medium">
            per {cycle.noun}
          </span>
        </span>

        {/* Hover chevron */}
        <span className="hidden sm:flex size-7 shrink-0 items-center justify-center rounded-lg text-faint transition-all duration-150 group-hover:bg-raised group-hover:text-fg group-hover:translate-x-0.5">
          <ChevronRight className="size-4" aria-hidden />
        </span>
      </button>
    </li>
  );
}
