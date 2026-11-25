
import { useSubscriptions } from '../../context/SubscriptionsContext';
import { SubscriptionAvatar } from '../ui/Badges';
import { DUE_SOON_DAYS, getCycle } from '../../lib/constants';
import { formatDaysLeft, formatMoney } from '../../lib/format';
import { AlertCircle } from 'lucide-react';

/** One upcoming charge: date tile, name, frequency, countdown and amount. */
export default function UpcomingPaymentItem({
  payment,
  showAvatar = false,
  inrRate = null,
}) {
  const { openDetails } = useSubscriptions();
  const { sub, date, daysLeft } = payment;
  const dueSoon = daysLeft <= DUE_SOON_DAYS;

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
        className={`group relative flex w-full items-center gap-3.5 rounded-xl border border-transparent px-3 py-3 text-left transition-all duration-150 hover:border-line-strong hover:bg-raised/75 hover:shadow-[var(--shadow-card)] sm:gap-4 sm:px-4 ${
          dueSoon
            ? 'border-warn/25 bg-warn/[0.04] hover:bg-warn/[0.08]'
            : ''
        }`}
      >
        {/* Urgent left indicator strip */}
        {dueSoon && (
          <span
            className="absolute inset-y-2.5 left-0 w-[3px] rounded-r-full bg-warn shadow-[0_0_8px_rgba(251,191,36,0.8)]"
            aria-hidden
          />
        )}

        {/* Calendar badge tile */}
        <span
          className={`flex w-12 shrink-0 flex-col items-center justify-center rounded-xl border py-1.5 transition-all duration-150 group-hover:scale-105 ${
            dueSoon
              ? 'border-warn/30 bg-warn/15 shadow-[0_0_12px_rgba(251,191,36,0.15)]'
              : 'border-line-strong bg-raised'
          }`}
        >
          <span
            className={`text-[10px] font-bold uppercase tracking-wider ${
              dueSoon ? 'text-warn' : 'text-faint'
            }`}
          >
            {date.toLocaleDateString('en-GB', { month: 'short' })}
          </span>
          <span className="font-display text-lg font-bold leading-tight text-fg tabular">
            {date.getDate()}
          </span>
        </span>

        {showAvatar && (
          <span className="hidden sm:block shrink-0">
            <SubscriptionAvatar subscription={sub} size="sm" />
          </span>
        )}

        {/* Title & timing */}
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="block truncate text-sm font-semibold tracking-tight text-fg transition-colors group-hover:text-fg">
              {sub.name}
            </span>
            {dueSoon && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-warn">
                <AlertCircle className="size-3" aria-hidden />
                <span className="hidden sm:inline">Due soon</span>
              </span>
            )}
          </span>
          <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[13px] text-faint">
            <span>{getCycle(sub.billingCycle).label}</span>
            <span className="text-line-strong" aria-hidden>•</span>
            <span
              className={`font-medium ${
                dueSoon ? 'text-warn font-semibold' : 'text-muted'
              }`}
            >
              {formatDaysLeft(daysLeft)}
            </span>
          </span>
        </span>

        {/* Amount and INR equivalent */}
        <span className="shrink-0 text-right">
          <span className="block font-display text-sm font-semibold text-fg tabular tracking-tight">
            {formatMoney(sub.amount, sub.currency)}
          </span>

          {hasInrEquivalent && (
            <span className="mt-0.5 block text-[11px] font-medium text-muted tabular">
              ≈ {formatMoney(inrAmount, 'INR')}
            </span>
          )}
        </span>
      </button>
    </li>
  );
}
