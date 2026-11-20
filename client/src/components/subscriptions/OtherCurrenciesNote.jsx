import { Info } from 'lucide-react';
import { formatMoney, pluralize } from '../../lib/format';

/**
 * Totals are shown in the user's preferred currency. Subscriptions billed in
 * other currencies are listed here instead of being converted with guessed rates.
 */
export default function OtherCurrenciesNote({ totals, currency, context = 'Totals' }) {
  if (!totals.length) return null;
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-line bg-surface/75 px-4 py-3 text-xs leading-relaxed text-muted shadow-[var(--shadow-card)]">
      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-lavender/15 text-lavender mt-0.5">
        <Info className="size-3.5" aria-hidden />
      </span>
      <p className="flex-1">
        <span className="font-medium text-fg">{context} are aggregated in {currency}.</span> Not included due to multi-currency:{' '}
        {totals.map((t, i) => (
          <span key={t.currency}>
            {i > 0 && ' · '}
            <span className="font-semibold text-fg tabular">{formatMoney(t.monthly, t.currency)}/mo</span> ({pluralize(t.count, `${t.currency} item`)})
          </span>
        ))}
        .
      </p>
    </div>
  );
}
