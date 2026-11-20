import { useMemo } from 'react';
import { Link } from 'react-router';
import { Wallet, CalendarRange, Layers, CalendarClock, Plus, ArrowRight, Sparkles, PieChart, Clock } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import StatCard from '../components/ui/StatCard';
import Button from '../components/ui/Button';
import { EmptyState, ErrorState, PageSkeleton } from '../components/ui/Feedback';
import CategoryDonut from '../components/charts/CategoryDonut';
import SubscriptionRow from '../components/subscriptions/SubscriptionRow';
import UpcomingPaymentItem from '../components/subscriptions/UpcomingPaymentItem';
import OtherCurrenciesNote from '../components/subscriptions/OtherCurrenciesNote';
import { localSubscriptionApi } from '../lib/storage';
import { useAuth } from '../context/AuthContext';
import { useSubscriptions } from '../context/SubscriptionsContext';
import {
  categoryBreakdown,
  otherCurrencyTotals,
  spendingTotals,
  upcomingPayments,
} from '../lib/billing';
import { formatMoney, pluralize } from '../lib/format';
import { StaggerContainer, StaggerItem } from '../components/ui/Transitions';

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function Panel({ title, icon: Icon, badge, action, children, className = '' }) {
  return (
    <section className={`card flex min-w-0 flex-col p-4.5 sm:p-6 shadow-[var(--shadow-card)] hover:border-line-strong transition-all duration-200 ${className}`}>
      <div className="mb-4 flex items-center justify-between gap-3 border-b border-line-subtle pb-3.5">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <span className="flex size-7 items-center justify-center rounded-lg bg-raised text-lavender border border-line">
              <Icon className="size-3.5" aria-hidden />
            </span>
          )}
          <h2 className="font-display text-base font-semibold text-fg tracking-tight">{title}</h2>
          {badge !== undefined && (
            <span className="rounded-full bg-raised px-2 py-0.5 text-xs font-mono font-medium text-faint">
              {badge}
            </span>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function PanelLink({ to, children }) {
  return (
    <Link
      to={to}
      className="group inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold text-lavender transition-all duration-150 hover:bg-lavender/10 hover:text-lavender-strong"
    >
      <span>{children}</span>
      <ArrowRight className="size-3 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden />
    </Link>
  );
}

function WelcomeState({ name, onAdd, onLoadSample }) {
  return (
    <div className="card relative overflow-hidden px-6 py-14 text-center sm:px-14 sm:py-20 border-line-strong bg-gradient-to-b from-surface via-surface to-raised/30 shadow-[var(--shadow-pop)]">
      {/* Decorative ambient aura */}
      <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 size-80 rounded-full bg-lavender/10 blur-3xl" aria-hidden />

      <span className="relative mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-lavender/15 text-lavender ring-1 ring-lavender/30 shadow-[0_0_24px_rgba(167,139,250,0.25)]">
        <Sparkles className="size-8" aria-hidden />
      </span>
      <h2 className="relative font-display text-2xl font-bold text-fg sm:text-3xl tracking-tight">
        Welcome to SubTrack, {name}
      </h2>
      <p className="relative mx-auto mt-3 max-w-lg text-[15px] leading-relaxed text-muted">
        Take complete control of your recurring commitments. Track streaming services, dev tools, cloud platforms,
        and memberships with instant projections and timely renewal reminders.
      </p>
      <div className="relative mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button size="lg" onClick={onAdd} variant="primary">
          <Plus className="size-5" aria-hidden />
          Add your first subscription
        </Button>
        {onLoadSample && (
          <Button size="lg" variant="secondary" onClick={onLoadSample}>
            <Sparkles className="size-4 text-lavender" aria-hidden />
            Load sample subscriptions
          </Button>
        )}
      </div>
      <p className="relative mt-5 text-xs text-faint">
        Takes 15 seconds · Instant analytics & renewal notifications
      </p>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { subscriptions, status, error, reload, openCreate } = useSubscriptions();
  const currency = user.currency;
  const firstName = user.name.split(' ')[0];

  const stats = useMemo(() => {
    const totals = spendingTotals(subscriptions, currency);
    const upcoming = upcomingPayments(subscriptions, 30);
    const nextWeek = upcoming.filter((p) => p.daysLeft <= 7 && p.sub.currency === currency);
    const recent = [...subscriptions].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
    return {
      totals,
      others: otherCurrencyTotals(subscriptions, currency),
      categories: categoryBreakdown(subscriptions, currency),
      upcoming: upcoming.slice(0, 5),
      nextWeekTotal: nextWeek.reduce((sum, p) => sum + p.sub.amount, 0),
      nextWeekCount: upcoming.filter((p) => p.daysLeft <= 7).length,
      activeCount: subscriptions.filter((s) => s.status === 'active').length,
      pausedCount: subscriptions.filter((s) => s.status === 'paused').length,
      recent,
    };
  }, [subscriptions, currency]);

  const header = (
    <PageHeader
      title={`${greeting()}, ${firstName}`}
      description={new Date().toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })}
      badge={
        <span className="inline-flex items-center gap-1.5 rounded-full border border-lime/30 bg-lime/10 px-3 py-1 text-xs font-medium text-lime">
          <span className="size-1.5 rounded-full bg-lime animate-pulse" />
          Live Dashboard · {stats.activeCount} Active
        </span>
      }
      actions={
        <Button onClick={openCreate} variant="primary" className="shadow-md">
          <Plus className="size-4" aria-hidden />
          <span>Add subscription</span>
        </Button>
      }
    />
  );

  const handleLoadSample = async () => {
    try {
      await localSubscriptionApi.resetToSampleSubscriptions();
      await reload();
    } catch (err) {
      console.error(err);
    }
  };

  if (status === 'loading') return <>{header}<PageSkeleton /></>;
  if (status === 'error') return <>{header}<ErrorState message={error} onRetry={reload} /></>;
  if (subscriptions.length === 0) {
    return <>{header}<WelcomeState name={firstName} onAdd={openCreate} onLoadSample={handleLoadSample} /></>;
  }

  return (
    <>
      {header}

      {/* Numerical headline stats with staggered entrance and animated count-up */}
      <StaggerContainer className="grid grid-cols-2 gap-3.5 lg:grid-cols-4 lg:gap-4">
        <StaggerItem>
          <StatCard
            featured
            label="Monthly spending"
            numericValue={stats.totals.monthly}
            currency={currency}
            detail="Across active subscriptions"
            icon={Wallet}
            accent="lavender"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Yearly estimate"
            numericValue={stats.totals.yearly}
            currency={currency}
            detail="Projected annual run rate"
            icon={CalendarRange}
            accent="lime"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Active subscriptions"
            numericValue={stats.activeCount}
            detail={stats.pausedCount ? `${stats.pausedCount} paused · ${subscriptions.length} total` : `${subscriptions.length} registered total`}
            icon={Layers}
            accent="muted"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Due in 7 days"
            numericValue={stats.nextWeekTotal}
            currency={currency}
            detail={stats.nextWeekCount ? pluralize(stats.nextWeekCount, 'charge due') : 'No charges this week'}
            icon={CalendarClock}
            accent={stats.nextWeekCount > 0 ? 'warn' : 'muted'}
          />
        </StaggerItem>
      </StaggerContainer>

      {stats.others.length > 0 && (
        <div className="mt-3.5">
          <OtherCurrenciesNote totals={stats.others} currency={currency} />
        </div>
      )}

      {/* Main Grid Panels */}
      <div className="mt-5 grid gap-4 lg:mt-6 lg:grid-cols-5 lg:gap-6">
        <Panel
          title="Upcoming payments"
          icon={CalendarClock}
          badge={stats.upcoming.length}
          action={<PanelLink to="/upcoming">View all</PanelLink>}
          className="lg:col-span-3"
        >
          {stats.upcoming.length ? (
            <ul className="-mx-2 space-y-1">
              {stats.upcoming.map((p) => (
                <UpcomingPaymentItem key={p.key} payment={p} />
              ))}
            </ul>
          ) : (
            <EmptyState
              compact
              icon={CalendarClock}
              title="Nothing due in the next 30 days"
              description="Payments for your active subscriptions will automatically populate here."
            />
          )}
        </Panel>

        <Panel
          title="Spending by category"
          icon={PieChart}
          action={<PanelLink to="/analytics">Analytics</PanelLink>}
          className="lg:col-span-2"
        >
          {stats.categories.length ? (
            <CategoryDonut data={stats.categories} currency={currency} height={180} />
          ) : (
            <EmptyState
              compact
              icon={PieChart}
              title="No active spending yet"
              description={`Active subscriptions billed in ${currency} will be broken down here.`}
            />
          )}
        </Panel>
      </div>

      {/* Recently Added Section */}
      <Panel
        title="Recently added subscriptions"
        icon={Clock}
        badge={stats.recent.length}
        action={<PanelLink to="/subscriptions">All subscriptions</PanelLink>}
        className="mt-4 lg:mt-6"
      >
        <ul className="-mx-2 space-y-1">
          {stats.recent.map((sub) => (
            <SubscriptionRow key={sub.id} subscription={sub} variant="compact" />
          ))}
        </ul>
      </Panel>
    </>
  );
}
