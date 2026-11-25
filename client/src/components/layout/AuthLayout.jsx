import { Wallet, BellRing, Scissors, ShieldCheck } from 'lucide-react';
import Logo from '../ui/Logo';
import ThemeToggle from '../ui/ThemeToggle';

const POINTS = [
  {
    icon: Wallet,
    title: 'Consolidated Monthly Run Rate',
    text: 'Weekly, quarterly, and annual subscriptions normalized into a single, predictable figure.',
  },
  {
    icon: BellRing,
    title: 'Zero Unexpected Debits',
    text: 'Chronological timeline of upcoming charges with advance countdown notifications.',
  },
  {
    icon: Scissors,
    title: 'Spot Redundancies & Waste',
    text: 'Instant visibility into top expenses and underutilized recurring services.',
  },
];

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-dvh bg-canvas lg:grid-cols-[1.1fr_1fr]">
      {/* Brand panel — desktop only */}
      <section className="relative hidden overflow-hidden border-r border-line bg-surface/90 lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
        {/* Ambient subtle glow circles */}
        <div className="pointer-events-none absolute -left-20 -top-20 size-96 rounded-full bg-lavender/10 blur-[100px]" aria-hidden />
        <div className="pointer-events-none absolute -bottom-20 right-10 size-96 rounded-full bg-lime/10 blur-[100px]" aria-hidden />

        <div className="relative z-10">
          <Logo />
        </div>

        <div className="relative z-10 max-w-lg my-auto py-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-lavender/30 bg-lavender/10 px-3.5 py-1 text-xs font-semibold text-lavender mb-6">
            <span className="size-1.5 rounded-full bg-lavender" />
            <span>Smart Subscription Management</span>
          </div>

          <h1 className="font-display text-4xl font-extrabold leading-[1.08] text-fg xl:text-5xl tracking-tight">
            Take total control of your{' '}
            <span className="bg-gradient-to-r from-lavender via-lavender to-lavender-strong bg-clip-text text-transparent">
              subscription spend.
            </span>
          </h1>

          <p className="mt-4 text-sm leading-relaxed text-muted max-w-md">
            The modern financial dashboard designed for individuals and teams who value clarity, predictability, and budget intelligence.
          </p>

          <ul className="mt-10 space-y-6">
            {POINTS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4 items-start group">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-line-strong bg-raised/80 text-lime shadow-sm transition-transform duration-200 group-hover:scale-105">
                  <Icon className="size-5" aria-hidden />
                </span>
                <div>
                  <span className="block font-display text-sm font-bold text-fg tracking-tight">{title}</span>
                  <span className="mt-1 block text-xs leading-relaxed text-muted">{text}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 flex items-center gap-2 text-xs text-faint">
          <ShieldCheck className="size-4 text-lime" aria-hidden />
          <span>Passwords hashed with bcrypt · Your data stored securely in MongoDB</span>
        </div>

        {/* Quiet decorative orbital rings */}
        <svg
          className="pointer-events-none absolute -right-36 -top-36 size-[580px] text-line-strong/40"
          viewBox="0 0 200 200"
          aria-hidden
        >
          {[98, 76, 54].map((r) => (
            <circle key={r} cx="100" cy="100" r={r} fill="none" stroke="currentColor" strokeWidth="0.4" strokeDasharray="3 3" />
          ))}
        </svg>
      </section>

      {/* Form panel */}
      <main className="flex flex-col justify-center px-6 py-12 sm:px-10 lg:px-16 xl:px-20 relative">
        <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
          <ThemeToggle />
        </div>
        <div className="mb-8 lg:hidden">
          <Logo />
        </div>
        <div className="mx-auto w-full max-w-md animate-rise lg:mx-0 xl:mx-auto">
          <div className="card p-6 sm:p-8 shadow-[var(--shadow-pop)] border-line-strong bg-surface/90 backdrop-blur-xl">
            <h2 className="font-display text-2xl font-bold tracking-tight text-fg sm:text-3xl">{title}</h2>
            {subtitle && <p className="mt-2 text-sm text-muted leading-relaxed">{subtitle}</p>}
            <div className="mt-7">{children}</div>
            {footer && <div className="mt-7 border-t border-line-subtle pt-5 text-center text-xs text-muted">{footer}</div>}
          </div>
        </div>
      </main>
    </div>
  );
}
