import { useMemo, useState } from 'react';
import { ChartColumn, Plus, TrendingUp, Sparkles, BarChart3, Layers } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import Button from '../components/ui/Button';
import { SegmentedControl } from '../components/ui/FormControls';
import { EmptyState, ErrorState, PageSkeleton } from '../components/ui/Feedback';
import { SubscriptionAvatar } from '../components/ui/Badges';
import SpendingTrendChart from '../components/charts/SpendingTrendChart';
import HorizontalBarChart from '../components/charts/HorizontalBarChart';
import CategoryDonut from '../components/charts/CategoryDonut';
import OtherCurrenciesNote from '../components/subscriptions/OtherCurrenciesNote';
import { useAuth } from '../context/AuthContext';
import { useSubscriptions } from '../context/SubscriptionsContext';
import {
  categoryBreakdown,
  cycleBreakdown,
  monthlyTrend,
  mostExpensive,
  otherCurrencyTotals,
  spendingTotals,
} from '../lib/billing';
import { getCycle } from '../lib/constants';
import { formatMoney } from '../lib/format';

const PERIODS = [
  { value: 'monthly', label: 'Per month' },
  { value: 'yearly', label: 'Per year' },
];

function ChartCard({ title, description, children, className = '' }) {
  return (
    <section className={`card min-w-0 p-5 sm:p-6 shadow-[var(--shadow-card)] hover:border-line-strong transition-all duration-200 ${className}`}>
      <div className="border-b border-line-subtle pb-3.5 mb-5">
        <h2 className="font-display text-base font-bold text-fg tracking-tight">{title}</h2>
        {description && <p className="mt-1 text-xs text-muted leading-relaxed">{description}</p>}
      </div>
      <div>{children}</div>
    </section>
  );
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const { subscriptions, status, error, reload, openCreate } = useSubscriptions();
  const [period, setPeriod] = useState('monthly');
  const currency = user.currency;
  const per = period === 'monthly' ? 'month' : 'year';

  const data = useMemo(
    () => ({
      totals: spendingTotals(subscriptions, currency),
      trend: monthlyTrend(subscriptions, currency),
      categories: categoryBreakdown(subscriptions, currency),
      cycles: cycleBreakdown(subscriptions, currency),
      top: mostExpensive(subscriptions, currency, 5),
      others: otherCurrencyTotals(subscriptions, currency),
    }),
    [subscriptions, currency],
  );

  const header = (
    <PageHeader
      title="Spending Analytics"
      description="Interactive breakdown of your recurring outflows, trends, and category distribution."
      badge={
        <span className="inline-flex items-center gap-1.5 rounded-full border border-lime/30 bg-lime/10 px-3 py-1 text-xs font-medium text-lime">
          <TrendingUp className="size-3.5" aria-hidden />
          <span>Real-time Financial Run Rate</span>
        </span>
      }
      actions={
        data.totals.count > 0 && (
          <SegmentedControl
            label="Show costs"
            options={PERIODS}
            value={period}
            onChange={setPeriod}
            size="sm"
            className="sm:w-56"
          />
        )
      }
    />
  );

  if (status === 'loading') return <>{header}<PageSkeleton /></>;
  if (status === 'error') return <>{header}<ErrorState message={error} onRetry={reload} /></>;

  if (data.totals.count === 0) {
    return (
      <>
        {header}
        {data.others.length > 0 && (
          <div className="mb-4">
            <OtherCurrenciesNote totals={data.others} currency={currency} context="Analytics" />
          </div>
        )}
        <div className="card p-6">
          <EmptyState
            icon={ChartColumn}
            title="No active commitments to analyze"
            description={`Analytics require at least one active subscription billed in ${currency}. You can change your preferred currency in Settings.`}
            action={
              <Button onClick={openCreate} variant="primary">
                <Plus className="size-4" aria-hidden />
                <span>Add subscription</span>
              </Button>
            }
          />
        </div>
      </>
    );
  }

  const topMax = data.top[0]?.[period] || 1;
  const average = data.totals.monthly / data.totals.count;

  return (
    <>
      {header}

      {data.others.length > 0 && (
        <div className="mb-5">
          <OtherCurrenciesNote totals={data.others} currency={currency} context="Analytics" />
        </div>
      )}

      <div className="grid gap-5 lg:gap-6">
        <ChartCard
          title="Monthly Cash Outflow & Projections"
          description="Historical actual charges alongside forward-looking projected renewals."
        >
          <SpendingTrendChart data={data.trend} currency={currency} />
        </ChartCard>

        <div className="grid gap-5 lg:grid-cols-2 lg:gap-6">
          <ChartCard
            title="Run Rate Comparison"
            description="Normalized monthly commitment vs 12-month projected total."
          >
            <div className="grid grid-cols-2 gap-3.5">
              <div
                className={`rounded-2xl border p-4.5 transition-all duration-200 ${
                  period === 'monthly'
                    ? 'border-lavender/40 bg-gradient-to-b from-lavender/10 to-transparent shadow-[0_4px_16px_rgba(167,139,250,0.1)]'
                    : 'border-line bg-raised/40'
                }`}
              >
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">Monthly Burn</p>
                <p className="mt-1.5 font-display text-2xl font-bold text-fg tabular sm:text-3xl tracking-tight">
                  {formatMoney(data.totals.monthly, currency)}
                </p>
                <p className="mt-1 text-[11px] text-faint">active subscriptions</p>
              </div>

              <div
                className={`rounded-2xl border p-4.5 transition-all duration-200 ${
                  period === 'yearly'
                    ? 'border-lime/40 bg-gradient-to-b from-lime/10 to-transparent shadow-[0_4px_16px_rgba(196,232,101,0.1)]'
                    : 'border-line bg-raised/40'
                }`}
              >
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">Yearly Estimate</p>
                <p className="mt-1.5 font-display text-2xl font-bold text-fg tabular sm:text-3xl tracking-tight">
                  {formatMoney(data.totals.yearly, currency)}
                </p>
                <p className="mt-1 text-[11px] text-faint">projected 12 months</p>
              </div>
            </div>

            <p className="mt-3.5 rounded-xl border border-line-subtle bg-surface/50 px-3.5 py-2.5 text-xs text-muted flex items-center justify-between">
              <span>Average spend per service</span>
              <strong className="font-semibold text-fg tabular">
                {formatMoney(period === 'monthly' ? average : average * 12, currency)} / {per}
              </strong>
            </p>

            <h3 className="mb-2 mt-6 font-display text-xs font-bold uppercase tracking-wider text-muted">
              Distribution by Cadence
            </h3>
            <HorizontalBarChart
              data={data.cycles}
              valueKey={period}
              currency={currency}
              periodLabel={period === 'monthly' ? 'Per month' : 'Per year'}
            />
          </ChartCard>

          <ChartCard
            title="Spending by Category"
            description={`Share of recurring budget allocated by segment per ${per}.`}
          >
            <CategoryDonut data={data.categories} currency={currency} period={period} height={200} />
          </ChartCard>
        </div>

        <ChartCard
          title="Top 5 Most Expensive Subscriptions"
          description={`Your largest recurring expenses normalized per ${per}.`}
        >
          <ol className="space-y-4">
            {data.top.map(({ sub, ...costs }, index) => (
              <li key={sub.id} className="group flex items-center gap-3.5 sm:gap-4 rounded-xl p-2 transition-colors hover:bg-raised/40">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-raised text-xs font-mono font-bold text-faint">
                  {index + 1}
                </span>
                <SubscriptionAvatar subscription={sub} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="truncate text-sm font-semibold text-fg tracking-tight">{sub.name}</p>
                    <p className="shrink-0 font-display text-sm font-bold text-fg tabular tracking-tight">
                      {formatMoney(costs[period], currency)}
                      <span className="font-sans text-xs font-normal text-faint">/{per === 'month' ? 'mo' : 'yr'}</span>
                    </p>
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-raised">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-lavender to-lavender-strong transition-all duration-700 shadow-[0_0_8px_rgba(167,139,250,0.5)]"
                        style={{ width: `${Math.max(4, (costs[period] / topMax) * 100)}%` }}
                      />
                    </div>
                    <span className="w-28 shrink-0 text-right text-xs text-faint font-medium">
                      {formatMoney(sub.amount, sub.currency)} {getCycle(sub.billingCycle).label.toLowerCase()}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </ChartCard>
      </div>
    </>
  );
}
