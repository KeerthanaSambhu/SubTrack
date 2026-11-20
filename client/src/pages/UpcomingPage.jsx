import { useMemo, useState } from 'react';
import { CalendarClock, CalendarCheck, Plus, AlertCircle, Clock, CheckCircle } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import Button from '../components/ui/Button';
import { SegmentedControl } from '../components/ui/FormControls';
import { EmptyState, ErrorState, Skeleton } from '../components/ui/Feedback';
import UpcomingPaymentItem from '../components/subscriptions/UpcomingPaymentItem';
import { useAuth } from '../context/AuthContext';
import { useSubscriptions } from '../context/SubscriptionsContext';
import { upcomingPayments } from '../lib/billing';
import { DUE_SOON_DAYS } from '../lib/constants';
import { formatMoney, pluralize } from '../lib/format';

const RANGES = [
  { value: 7, label: '7 days' },
  { value: 30, label: '30 days' },
  { value: 90, label: '90 days' },
];

const GROUPS = [
  { title: 'Due this week', test: (d) => d <= 7, badgeColor: 'text-warn bg-warn/10 border-warn/25' },
  { title: 'Next few weeks', test: (d) => d > 7 && d <= 30, badgeColor: 'text-lavender bg-lavender/10 border-lavender/25' },
  { title: 'Later renewals', test: (d) => d > 30, badgeColor: 'text-muted bg-raised border-line' },
];

function totalsByCurrency(payments, preferred) {
  const map = {};
  payments.forEach(({ sub }) => {
    map[sub.currency] = (map[sub.currency] || 0) + sub.amount;
  });
  return Object.entries(map)
    .map(([currency, total]) => ({ currency, total }))
    .sort((a, b) => (a.currency === preferred ? -1 : b.currency === preferred ? 1 : b.total - a.total));
}

export default function UpcomingPage() {
  const { user } = useAuth();
  const { subscriptions, status, error, reload, openCreate } = useSubscriptions();
  const [range, setRange] = useState(30);

  const payments = useMemo(() => upcomingPayments(subscriptions, range), [subscriptions, range]);
  const totals = useMemo(() => totalsByCurrency(payments, user.currency), [payments, user.currency]);
  const dueSoon = payments.filter((p) => p.daysLeft <= DUE_SOON_DAYS).length;
  const hasActive = subscriptions.some((s) => s.status === 'active');

  const header = (
    <PageHeader
      title="Upcoming Renewals"
      description="Track billing schedules, anticipate debits, and eliminate subscription surprises."
      actions={
        <div className="flex items-center gap-3">
          <SegmentedControl
            label="Time range"
            options={RANGES}
            value={range}
            onChange={setRange}
            size="sm"
            className="sm:w-64"
          />
        </div>
      }
    />
  );

  if (status === 'error') return <>{header}<ErrorState message={error} onRetry={reload} /></>;

  if (status === 'loading') {
    return (
      <>
        {header}
        <Skeleton className="mb-4 h-28 rounded-2xl" />
        <Skeleton className="h-80 rounded-2xl" />
      </>
    );
  }

  if (!hasActive) {
    return (
      <>
        {header}
        <div className="card p-6">
          <EmptyState
            icon={CalendarClock}
            title="No active subscriptions to project"
            description="Once you activate subscriptions, your upcoming renewal schedule will automatically display here."
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

  return (
    <>
      {header}

      {/* Hero Schedule Overview Card */}
      <div className="card mb-6 flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6 bg-gradient-to-r from-surface via-surface to-raised/40 border-line shadow-[var(--shadow-card)]">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
            <Clock className="size-3.5 text-lavender" aria-hidden />
            <span>Total projected in next {range} days</span>
          </div>
          <p className="mt-2 flex flex-wrap items-baseline gap-x-3 font-display text-3xl font-extrabold text-fg tabular sm:text-4xl tracking-tight">
            {totals.length ? (
              totals.map((t, i) => (
                <span key={t.currency} className={i > 0 ? 'text-xl font-semibold text-muted' : ''}>
                  {i > 0 && '+ '}
                  {formatMoney(t.total, t.currency)}
                </span>
              ))
            ) : (
              formatMoney(0, user.currency)
            )}
          </p>
        </div>

        <div className="flex items-center gap-6 border-t border-line-subtle pt-4 sm:border-t-0 sm:border-l sm:pl-6 sm:pt-0">
          <div>
            <p className="text-xs font-medium text-faint uppercase tracking-wider">Scheduled</p>
            <p className="mt-1 font-display text-2xl font-bold text-fg tabular">
              {payments.length}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-faint uppercase tracking-wider">Due in {DUE_SOON_DAYS} days</p>
            <p className={`mt-1 font-display text-2xl font-bold tabular flex items-center gap-1.5 ${dueSoon ? 'text-warn' : 'text-fg'}`}>
              {dueSoon}
              {dueSoon > 0 && <span className="size-2 rounded-full bg-warn animate-ping" />}
            </p>
          </div>
        </div>
      </div>

      {payments.length === 0 ? (
        <div className="card p-6">
          <EmptyState
            icon={CalendarCheck}
            title={`No charges due within ${range} days`}
            description={range < 90 ? 'Expand to 90 days to inspect long-term renewal schedules.' : 'All clear for the quarter!'}
            action={
              range < 90 && (
                <Button variant="secondary" onClick={() => setRange(90)}>
                  Show next 90 days
                </Button>
              )
            }
          />
        </div>
      ) : (
        <div className="space-y-5">
          {GROUPS.map((group) => {
            const items = payments.filter((p) => group.test(p.daysLeft));
            if (!items.length) return null;
            return (
              <section key={group.title} className="card p-2 sm:p-4 shadow-[var(--shadow-card)]" aria-label={group.title}>
                <div className="flex items-center justify-between border-b border-line-subtle px-4 pb-3 pt-2">
                  <h2 className="font-display text-sm font-bold text-fg tracking-tight">
                    {group.title}
                  </h2>
                  <span className={`rounded-full border px-2.5 py-0.5 text-xs font-mono font-medium ${group.badgeColor}`}>
                    {pluralize(items.length, 'charge')}
                  </span>
                </div>
                <ul className="mt-2 space-y-1">
                  {items.map((p) => (
                    <UpcomingPaymentItem key={p.key} payment={p} showAvatar />
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}
