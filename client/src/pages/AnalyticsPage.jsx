
import { useMemo, useState } from 'react';
import {
  ChartColumn,
  Plus,
  TrendingUp,
} from 'lucide-react';

import PageHeader from '../components/layout/PageHeader';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { SegmentedControl } from '../components/ui/FormControls';
import {
  EmptyState,
  ErrorState,
  PageSkeleton,
} from '../components/ui/Feedback';
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
  monthlyCost,
  otherCurrencyTotals,
  spendingTotals,
} from '../lib/billing';

import { getCycle } from '../lib/constants';
import { formatMoney } from '../lib/format';
import { useExchangeRate } from '../lib/useExchangeRate';

const PERIODS = [
  { value: 'monthly', label: 'Per month' },
  { value: 'yearly', label: 'Per year' },
];

function ChartCard({
  title,
  description,
  children,
  className = '',
}) {
  return (
    <section
      className={`card min-w-0 p-5 sm:p-6 shadow-[var(--shadow-card)] hover:border-line-strong transition-all duration-200 ${className}`}
    >
      <div className="border-b border-line-subtle pb-3.5 mb-5">
        <h2 className="font-display text-base font-bold text-fg tracking-tight">
          {title}
        </h2>

        {description && (
          <p className="mt-1 text-xs text-muted leading-relaxed">
            {description}
          </p>
        )}
      </div>

      <div>{children}</div>
    </section>
  );
}

export default function AnalyticsPage() {
  const { user } = useAuth();

  const {
    subscriptions,
    status,
    error,
    reload,
    openCreate,
  } = useSubscriptions();

  const [period, setPeriod] = useState('monthly');
  const [selectedCycle, setSelectedCycle] = useState(null);

  const {
    rate,
    rateDate,
    loading: rateLoading,
    error: rateError,
    convertUsdToInr,
  } = useExchangeRate();

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

  const selectedCycleData = data.cycles.find(
    (item) => item.cycle === selectedCycle,
  );

  // Subscriptions in the user's preferred currency.
  const selectedSubscriptions = useMemo(() => {
    if (!selectedCycle) return [];

    return subscriptions
      .filter(
        (sub) =>
          sub.status === 'active' &&
          sub.currency === currency &&
          sub.billingCycle === selectedCycle,
      )
      .sort((a, b) => monthlyCost(b) - monthlyCost(a));
  }, [subscriptions, currency, selectedCycle]);

  // USD subscriptions are displayed separately to avoid
  // mixing converted estimates into the actual INR totals.
  const selectedUsdSubscriptions = useMemo(() => {
    if (!selectedCycle || currency === 'USD') return [];

    return subscriptions
      .filter(
        (sub) =>
          sub.status === 'active' &&
          sub.currency === 'USD' &&
          sub.billingCycle === selectedCycle,
      )
      .sort((a, b) => monthlyCost(b) - monthlyCost(a));
  }, [subscriptions, currency, selectedCycle]);

  const selectedAmount = selectedCycleData?.[period] || 0;
  const totalAmount = data.totals[period] || 0;

  const percentage =
    totalAmount > 0
      ? (selectedAmount / totalAmount) * 100
      : 0;

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

  if (status === 'loading') {
    return (
      <>
        {header}
        <PageSkeleton />
      </>
    );
  }

  if (status === 'error') {
    return (
      <>
        {header}
        <ErrorState message={error} onRetry={reload} />
      </>
    );
  }

  if (data.totals.count === 0) {
    return (
      <>
        {header}

        {data.others.length > 0 && (
          <div className="mb-4">
            <OtherCurrenciesNote
              totals={data.others}
              currency={currency}
              context="Analytics"
            />
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
          <OtherCurrenciesNote
            totals={data.others}
            currency={currency}
            context="Analytics"
          />
        </div>
      )}

      <div className="grid gap-5 lg:gap-6">
        <ChartCard
          title="Monthly Cash Outflow & Projections"
          description="Historical actual charges alongside forward-looking projected renewals."
        >
          <SpendingTrendChart
            data={data.trend}
            currency={currency}
          />
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
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Monthly Burn
                </p>

                <p className="mt-1.5 font-display text-2xl font-bold text-fg tabular sm:text-3xl tracking-tight">
                  {formatMoney(data.totals.monthly, currency)}
                </p>

                <p className="mt-1 text-[11px] text-faint">
                  active subscriptions
                </p>
              </div>

              <div
                className={`rounded-2xl border p-4.5 transition-all duration-200 ${
                  period === 'yearly'
                    ? 'border-lime/40 bg-gradient-to-b from-lime/10 to-transparent shadow-[0_4px_16px_rgba(196,232,101,0.1)]'
                    : 'border-line bg-raised/40'
                }`}
              >
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Yearly Estimate
                </p>

                <p className="mt-1.5 font-display text-2xl font-bold text-fg tabular sm:text-3xl tracking-tight">
                  {formatMoney(data.totals.yearly, currency)}
                </p>

                <p className="mt-1 text-[11px] text-faint">
                  projected 12 months
                </p>
              </div>
            </div>

            <p className="mt-3.5 rounded-xl border border-line-subtle bg-surface/50 px-3.5 py-2.5 text-xs text-muted flex items-center justify-between">
              <span>Average spend per service</span>

              <strong className="font-semibold text-fg tabular">
                {formatMoney(
                  period === 'monthly'
                    ? average
                    : average * 12,
                  currency,
                )}{' '}
                / {per}
              </strong>
            </p>

            <h3 className="mb-2 mt-6 font-display text-xs font-bold uppercase tracking-wider text-muted">
              Distribution by Cadence
            </h3>

            <p className="mb-3 text-xs text-faint">
              Select any bar to explore the subscriptions behind it.
            </p>

            <HorizontalBarChart
              data={data.cycles}
              valueKey={period}
              currency={currency}
              periodLabel={
                period === 'monthly'
                  ? 'Per month'
                  : 'Per year'
              }
              onBarClick={(row) => setSelectedCycle(row.cycle)}
            />
          </ChartCard>

          <ChartCard
            title="Spending by Category"
            description={`Share of recurring budget allocated by segment per ${per}.`}
          >
            <CategoryDonut
              data={data.categories}
              currency={currency}
              period={period}
              height={200}
            />
          </ChartCard>
        </div>

        <ChartCard
          title="Top 5 Most Expensive Subscriptions"
          description={`Your largest recurring expenses normalized per ${per}.`}
        >
          <ol className="space-y-4">
            {data.top.map(({ sub, ...costs }, index) => (
              <li
                key={sub.id}
                className="group flex items-center gap-3.5 sm:gap-4 rounded-xl p-2 transition-colors hover:bg-raised/40"
              >
                <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-raised text-xs font-mono font-bold text-faint">
                  {index + 1}
                </span>

                <SubscriptionAvatar subscription={sub} size="sm" />

                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="truncate text-sm font-semibold text-fg tracking-tight">
                      {sub.name}
                    </p>

                    <p className="shrink-0 font-display text-sm font-bold text-fg tabular tracking-tight">
                      {formatMoney(costs[period], currency)}
                      <span className="font-sans text-xs font-normal text-faint">
                        /{per === 'month' ? 'mo' : 'yr'}
                      </span>
                    </p>
                  </div>

                  <div className="mt-2 flex items-center gap-3">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-raised">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-lavender to-lavender-strong transition-all duration-700 shadow-[0_0_8px_rgba(167,139,250,0.5)]"
                        style={{
                          width: `${Math.max(
                            4,
                            (costs[period] / topMax) * 100,
                          )}%`,
                        }}
                      />
                    </div>

                    <span className="w-28 shrink-0 text-right text-xs text-faint font-medium">
                      {formatMoney(sub.amount, sub.currency)}{' '}
                      {getCycle(sub.billingCycle).label.toLowerCase()}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </ChartCard>
      </div>

      <Modal
        open={Boolean(selectedCycleData)}
        onClose={() => setSelectedCycle(null)}
        title={
          selectedCycleData
            ? `${selectedCycleData.label} billing details`
            : 'Billing details'
        }
        description="A closer look at the subscriptions contributing to this billing cadence."
        size="lg"
        footer={
          <Button
            variant="secondary"
            onClick={() => setSelectedCycle(null)}
          >
            Close
          </Button>
        }
      >
        {selectedCycleData && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-lavender/30 bg-lavender/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Total per {per}
                </p>

                <p className="mt-2 font-display text-2xl font-bold text-fg tabular">
                  {formatMoney(selectedAmount, currency)}
                </p>
              </div>

              <div className="rounded-2xl border border-line bg-raised/40 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Subscriptions
                </p>

                <p className="mt-2 font-display text-2xl font-bold text-fg tabular">
                  {selectedSubscriptions.length}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-line-subtle bg-raised/30 p-3.5">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-muted">
                  Share of total spending
                </span>

                <strong className="text-fg tabular">
                  {percentage.toFixed(1)}%
                </strong>
              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-raised">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-lavender to-lavender-strong transition-all duration-500"
                  style={{ width: `${Math.min(100, percentage)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-display text-sm font-bold text-fg">
                  Included subscriptions
                </h3>

                <span className="text-xs text-faint">
                  {selectedSubscriptions.length} services
                </span>
              </div>

              <div className="space-y-2">
                {selectedSubscriptions.map((sub) => {
                  const monthly = monthlyCost(sub);
                  const normalized = period === 'monthly'
                    ? monthly
                    : monthly * 12;

                  return (
                    <div
                      key={sub.id}
                      className="flex items-center gap-3 rounded-xl border border-line-subtle bg-raised/30 p-3"
                    >
                      <SubscriptionAvatar subscription={sub} size="sm" />

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-fg">
                          {sub.name}
                        </p>

                        <p className="mt-0.5 text-xs text-muted">
                          {formatMoney(sub.amount, sub.currency)}{' '}
                          / {getCycle(sub.billingCycle).label.toLowerCase()}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-bold text-fg tabular">
                          {formatMoney(normalized, currency)}
                        </p>

                        <p className="text-[11px] text-faint">
                          per {per}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {selectedUsdSubscriptions.length > 0 && currency === 'INR' && (
              <div className="border-t border-line pt-5">
                <div className="mb-3">
                  <h3 className="font-display text-sm font-bold text-fg">
                    USD subscriptions
                  </h3>

                  <p className="mt-1 text-xs text-muted">
                    Original prices with approximate INR equivalents.
                  </p>
                </div>

                <div className="mb-3 rounded-xl border border-lime/20 bg-lime/5 p-3">
                  {rateLoading ? (
                    <p className="text-xs text-muted">
                      Fetching the latest USD to INR exchange rate...
                    </p>
                  ) : rate ? (
                    <>
                      <p className="text-sm font-semibold text-fg">
                        $1 = {formatMoney(rate, 'INR')}
                      </p>

                      <p className="mt-1 text-[11px] text-muted">
                        Reference rate dated {rateDate}
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-muted">
                      Live exchange rate is currently unavailable. Original USD prices are shown below.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  {selectedUsdSubscriptions.map((sub) => {
                    const monthly = monthlyCost(sub);
                    const normalized = period === 'monthly'
                      ? monthly
                      : monthly * 12;

                    const originalInr = convertUsdToInr
                      ? convertUsdToInr(sub.amount)
                      : null;

                    const normalizedInr = convertUsdToInr
                      ? convertUsdToInr(normalized)
                      : null;

                    return (
                      <div
                        key={sub.id}
                        className="rounded-xl border border-line-subtle bg-raised/30 p-3"
                      >
                        <div className="flex items-center gap-3">
                          <SubscriptionAvatar
                            subscription={sub}
                            size="sm"
                          />

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-fg">
                              {sub.name}
                            </p>

                            <p className="mt-0.5 text-xs text-muted">
                              {formatMoney(sub.amount, 'USD')} /{' '}
                              {getCycle(sub.billingCycle).label.toLowerCase()}
                            </p>

                            {originalInr !== null && (
                              <p className="mt-1 text-xs font-medium text-lime">
                                ≈ {formatMoney(originalInr, 'INR')} per billing cycle
                              </p>
                            )}
                          </div>

                          <div className="text-right">
                            {normalizedInr !== null ? (
                              <>
                                <p className="text-sm font-bold text-fg tabular">
                                  {formatMoney(normalizedInr, 'INR')}
                                </p>

                                <p className="text-[11px] text-faint">
                                  estimated per {per}
                                </p>
                              </>
                            ) : (
                              <p className="text-xs text-muted">
                                Conversion unavailable
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <p className="mt-3 text-[11px] leading-relaxed text-faint">
                  INR values are estimates using the published reference exchange rate. Actual bank or payment-provider charges may differ. These conversions are not included in your main spending totals.
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
