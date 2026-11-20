import { NavLink, Outlet, Link, useLocation } from 'react-router';
import { LayoutDashboard, Layers, CalendarClock, ChartColumn, Settings, Plus, LogOut, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSubscriptions } from '../../context/SubscriptionsContext';
import { initials } from '../../lib/format';
import Logo from '../ui/Logo';
import Button from '../ui/Button';
import SubscriptionFormModal from '../subscriptions/SubscriptionFormModal';
import SubscriptionDetailsModal from '../subscriptions/SubscriptionDetailsModal';
import { PageTransition } from '../ui/Transitions';

const NAV_ITEMS = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/subscriptions', label: 'Subscriptions', icon: Layers },
  { to: '/upcoming', label: 'Upcoming', icon: CalendarClock },
  { to: '/analytics', label: 'Analytics', icon: ChartColumn },
  { to: '/settings', label: 'Settings', icon: Settings },
];

function Sidebar() {
  const { user, logout } = useAuth();
  const { openCreate, subscriptions } = useSubscriptions();
  const activeCount = subscriptions.filter((s) => s.status === 'active').length;

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-canvas/95 px-4 py-6 backdrop-blur-xl lg:flex">
      {/* Brand */}
      <Link
        to="/"
        className="group mb-7 flex items-center px-2 py-1 rounded-xl transition-all duration-200 hover:bg-surface/50"
        aria-label="SubTrack home"
      >
        <Logo />
      </Link>

      {/* Primary Action */}
      <div className="mb-6 px-1">
        <Button
          onClick={openCreate}
          variant="primary"
          className="w-full justify-between shadow-[0_4px_20px_-4px_rgba(167,139,250,0.4)] hover:shadow-[0_6px_24px_-2px_rgba(167,139,250,0.55)] group"
        >
          <span className="flex items-center gap-2">
            <span className="flex size-5 items-center justify-center rounded-md bg-canvas/20">
              <Plus className="size-3.5 transition-transform duration-200 group-hover:rotate-90" aria-hidden />
            </span>
            <span>New subscription</span>
          </span>
          <span className="text-[11px] font-mono opacity-60">N</span>
        </Button>
      </div>

      {/* Navigation List */}
      <div className="px-1 text-[11px] font-semibold tracking-wider uppercase text-faint mb-2">
        Main Menu
      </div>
      <nav aria-label="Main" className="flex flex-col gap-1.5">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `group relative flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-surface text-fg shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_4px_16px_-4px_rgba(0,0,0,0.4)] border border-line-strong'
                  : 'text-muted hover:bg-surface/60 hover:text-fg'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {/* Active left indicator pill */}
                {isActive && (
                  <span
                    className="absolute left-0 inset-y-2 w-1 rounded-r-full bg-lavender shadow-[0_0_8px_rgba(167,139,250,0.8)]"
                    aria-hidden
                  />
                )}
                <span
                  className={`flex size-7 items-center justify-center rounded-lg transition-colors ${
                    isActive
                      ? 'bg-lavender/15 text-lavender'
                      : 'text-faint group-hover:bg-raised group-hover:text-muted'
                  }`}
                >
                  <Icon className="size-[17px] transition-transform duration-200 group-hover:scale-110" aria-hidden />
                </span>
                <span className="flex-1 truncate">{label}</span>
                {to === '/subscriptions' && activeCount > 0 && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-mono font-medium tabular ${
                      isActive ? 'bg-lavender/20 text-lavender' : 'bg-raised text-faint group-hover:text-muted'
                    }`}
                  >
                    {activeCount}
                  </span>
                )}
                {isActive && (
                  <ChevronRight className="size-3.5 text-lavender/60 ml-auto" aria-hidden />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User & Account Block */}
      <div className="mt-auto pt-4">
        <div className="group relative flex items-center gap-3 rounded-2xl border border-line bg-surface/80 p-3 shadow-[var(--shadow-card)] transition-colors hover:border-line-strong">
          <div className="relative">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-lavender/25 to-lavender/5 font-display text-sm font-semibold text-lavender ring-1 ring-lavender/20">
              {initials(user?.name)}
            </span>
            <span
              className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-lime ring-2 ring-surface shadow-[0_0_6px_rgba(196,232,101,0.8)]"
              title="Active account"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-fg tracking-tight">{user?.name}</p>
            <p className="truncate text-xs text-faint font-mono">{user?.currency} · Account</p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-faint transition-all duration-150 hover:bg-danger/10 hover:text-danger focus-visible:ring-1 focus-visible:ring-danger"
            aria-label="Log out"
            title="Log out"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

function MobileTopBar() {
  const { user } = useAuth();
  const { openCreate } = useSubscriptions();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-canvas/80 px-4 backdrop-blur-xl sm:px-6 lg:hidden">
      <Link to="/" aria-label="SubTrack home">
        <Logo />
      </Link>
      <div className="flex items-center gap-2.5">
        <Button size="sm" onClick={openCreate} variant="primary" aria-label="Add subscription">
          <Plus className="size-4" aria-hidden />
          <span className="hidden sm:inline">Add subscription</span>
          <span className="sm:hidden">Add</span>
        </Button>
        <Link
          to="/settings"
          className="flex size-9 items-center justify-center rounded-xl bg-lavender/15 text-sm font-semibold text-lavender ring-1 ring-lavender/25 transition-transform active:scale-95"
          aria-label="Account settings"
        >
          {initials(user?.name)}
        </Link>
      </div>
    </header>
  );
}

function BottomNav() {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-canvas/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-2xl lg:hidden shadow-[0_-8px_32px_rgba(0,0,0,0.6)]"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5 px-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                `group flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors ${
                  isActive ? 'text-fg font-semibold' : 'text-faint hover:text-muted'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`flex h-8 w-13 items-center justify-center rounded-full transition-all duration-200 ${
                      isActive
                        ? 'bg-lavender/15 text-lavender ring-1 ring-lavender/30 shadow-[0_0_12px_rgba(167,139,250,0.2)]'
                        : 'text-faint group-hover:text-muted'
                    }`}
                  >
                    <Icon className="size-[19px] transition-transform group-active:scale-90" aria-hidden />
                  </span>
                  <span className="tracking-tight">{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default function AppLayout() {
  const location = useLocation();

  return (
    <div className="min-h-dvh bg-canvas text-fg">
      <Sidebar />
      <MobileTopBar />
      <main className="lg:pl-64">
        <div className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-16 lg:pt-10">
          <PageTransition key={location.pathname}>
            <Outlet />
          </PageTransition>
        </div>
      </main>
      <BottomNav />
      <SubscriptionFormModal />
      <SubscriptionDetailsModal />
    </div>
  );
}
