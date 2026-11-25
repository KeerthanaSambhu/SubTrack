import { useId } from 'react';

export function LogoMark({ className = 'size-8' }) {
  // Unique gradient id per instance: a shared id breaks when the first copy
  // lives in a hidden element (e.g. the desktop sidebar on mobile).
  const gradientId = `logo-grad-${useId().replace(/:/g, '')}`;
  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
      <svg viewBox="0 0 32 32" className="size-full filter drop-shadow-[0_2px_8px_rgba(167,139,250,0.35)]" aria-hidden>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A78BFA" />
            <stop offset="100%" stopColor="#7C3AED" />
          </linearGradient>
        </defs>
        <rect width="32" height="32" rx="10" fill={`url(#${gradientId})`} />
        {/* Modern recurring cycle arc */}
        <path
          d="M10 20.5a6.5 6.5 0 1 0 0-9"
          fill="none"
          stroke="#0D0F14"
          strokeWidth="2.8"
          strokeLinecap="round"
        />
        {/* Soft lime pulse dot indicating active tracking */}
        <circle cx="16.5" cy="16" r="2.4" fill="#C4E865" />
      </svg>
    </div>
  );
}

export default function Logo({ className = '', collapsed = false }) {
  return (
    <span className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <LogoMark />
      {!collapsed && (
        <span className="flex flex-col">
          <span className="font-display text-lg font-bold tracking-tight text-fg leading-none flex items-center gap-1">
            SubTrack
            <span className="size-1.5 rounded-full bg-lime inline-block" />
          </span>
          <span className="text-[10px] uppercase font-semibold tracking-widest text-faint leading-none mt-0.5">
            SaaS Suite
          </span>
        </span>
      )}
    </span>
  );
}
