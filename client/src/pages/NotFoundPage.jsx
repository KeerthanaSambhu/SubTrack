import { Link } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import Button from '../components/ui/Button';
import { LogoMark } from '../components/ui/Logo';

export default function NotFoundPage() {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center px-6 text-center bg-canvas overflow-hidden">
      <div className="pointer-events-none absolute size-96 rounded-full bg-lavender/5 blur-[120px]" aria-hidden />
      <div className="relative card p-8 sm:p-12 max-w-md shadow-[var(--shadow-pop)] border-line-strong">
        <LogoMark className="mx-auto mb-6 size-12" />
        <span className="inline-block rounded-full bg-lavender/15 px-3 py-1 font-mono text-xs font-bold text-lavender ring-1 ring-lavender/30">
          404 ERROR
        </span>
        <h1 className="mt-4 font-display text-2xl font-bold tracking-tight text-fg sm:text-3xl">
          Page Not Found
        </h1>
        <p className="mt-2 text-xs leading-relaxed text-muted">
          The requested page or subscription resource does not exist or has been relocated.
        </p>
        <div className="mt-7">
          <Button as={Link} to="/" variant="primary" className="w-full">
            <ArrowLeft className="size-4" aria-hidden />
            <span>Return to Overview</span>
          </Button>
        </div>
      </div>
    </main>
  );
}
