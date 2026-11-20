import { useMemo, useState } from 'react';
import { Search, X, Plus, Layers, SearchX, SlidersHorizontal, Sparkles } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import Button from '../components/ui/Button';
import { Input, Select, SegmentedControl } from '../components/ui/FormControls';
import { EmptyState, ErrorState, Skeleton } from '../components/ui/Feedback';
import SubscriptionRow from '../components/subscriptions/SubscriptionRow';
import { useSubscriptions } from '../context/SubscriptionsContext';
import { CATEGORIES, getCategory } from '../lib/constants';
import { monthlyCost, nextPaymentDate } from '../lib/billing';
import { pluralize } from '../lib/format';

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'cancelled', label: 'Cancelled' },
];

const SORTS = {
  next: {
    label: 'Next payment',
    compare: (a, b) => (nextPaymentDate(a)?.getTime() ?? Infinity) - (nextPaymentDate(b)?.getTime() ?? Infinity),
  },
  cost: { label: 'Highest cost', compare: (a, b) => monthlyCost(b) - monthlyCost(a) },
  name: { label: 'Name (A–Z)', compare: (a, b) => a.name.localeCompare(b.name) },
  recent: { label: 'Recently added', compare: (a, b) => new Date(b.createdAt) - new Date(a.createdAt) },
};

export default function SubscriptionsPage() {
  const { subscriptions, status, error, reload, openCreate } = useSubscriptions();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sort, setSort] = useState('next');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return subscriptions
      .filter((s) => statusFilter === 'all' || s.status === statusFilter)
      .filter((s) => category === 'all' || s.category === category)
      .filter(
        (s) =>
          !q ||
          s.name.toLowerCase().includes(q) ||
          (s.notes || '').toLowerCase().includes(q) ||
          getCategory(s.category).label.toLowerCase().includes(q),
      )
      .sort(SORTS[sort].compare);
  }, [subscriptions, query, category, statusFilter, sort]);

  const hasFilters = query || category !== 'all' || statusFilter !== 'all';
  const clearFilters = () => {
    setQuery('');
    setCategory('all');
    setStatusFilter('all');
  };

  const header = (
    <PageHeader
      title="Subscriptions"
      description="Manage all your active, paused, and cancelled commitments."
      badge={
        <span className="inline-flex items-center gap-1.5 rounded-full border border-lavender/30 bg-lavender/10 px-3 py-1 text-xs font-medium text-lavender">
          <Layers className="size-3.5" aria-hidden />
          <span>{subscriptions.length} Registered Plans</span>
        </span>
      }
      actions={
        <Button onClick={openCreate} variant="primary">
          <Plus className="size-4" aria-hidden />
          <span>Add subscription</span>
        </Button>
      }
    />
  );

  if (status === 'error') return <>{header}<ErrorState message={error} onRetry={reload} /></>;

  if (status === 'ready' && subscriptions.length === 0) {
    return (
      <>
        {header}
        <div className="card p-6">
          <EmptyState
            icon={Layers}
            title="No subscriptions yet"
            description="Add recurring charges like Netflix, Spotify, or gym memberships to begin tracking."
            action={
              <Button onClick={openCreate} variant="primary">
                <Plus className="size-4" aria-hidden />
                <span>Add your first subscription</span>
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

      {/* Filter and Search Bar Card */}
      <div className="card mb-5 p-4 sm:p-5 shadow-[var(--shadow-card)] space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-faint" aria-hidden />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, category, or notes…"
              aria-label="Search subscriptions"
              className="pl-10 pr-10 [&::-webkit-search-cancel-button]:hidden"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-2.5 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-faint hover:text-fg"
                aria-label="Clear search"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:flex">
            <Select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filter by category" className="sm:w-52">
              <option value="all">All categories</option>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </Select>
            <Select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort subscriptions" className="sm:w-44">
              {Object.entries(SORTS).map(([value, s]) => (
                <option key={value} value={value}>
                  Sort: {s.label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-line-subtle pt-3">
          <SegmentedControl
            label="Filter by status"
            options={STATUS_FILTERS}
            value={statusFilter}
            onChange={setStatusFilter}
            size="sm"
            className="sm:w-auto sm:min-w-80"
          />
          <div className="flex items-center gap-2 text-xs text-muted" aria-live="polite">
            {status === 'ready' && (
              <>
                <span className="font-medium text-fg">{pluralize(filtered.length, 'item')}</span>
                <span>matching criteria</span>
                {hasFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="ml-2 font-semibold text-lavender hover:underline inline-flex items-center gap-1"
                  >
                    <X className="size-3" />
                    Reset filters
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Subscription List Panel */}
      <section className="card p-2 sm:p-4 shadow-[var(--shadow-card)]">
        <div className="hidden items-center gap-4 border-b border-line px-4 pb-3 pt-1 text-[11px] font-semibold uppercase tracking-wider text-faint md:flex">
          <span className="w-11" aria-hidden />
          <span className="flex-1">Subscription</span>
          <span className="w-36">Next payment</span>
          <span className="w-24 text-right">Cadence & Cost</span>
          <span className="w-7" aria-hidden />
        </div>

        {status === 'loading' ? (
          <div className="space-y-2 p-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        ) : filtered.length ? (
          <ul className="mt-1 space-y-1">
            {filtered.map((sub) => (
              <SubscriptionRow key={sub.id} subscription={sub} />
            ))}
          </ul>
        ) : (
          <EmptyState
            compact
            icon={SearchX}
            title="No matching subscriptions"
            description="Try adjusting your keyword query, switching category filter, or resetting status."
            action={
              <Button variant="secondary" onClick={clearFilters}>
                Clear active filters
              </Button>
            }
          />
        )}
      </section>
    </>
  );
}
