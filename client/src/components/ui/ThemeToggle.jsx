import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const OPTIONS = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
];

/**
 * Compact single button for tight spaces (mobile top bar):
 * cycles Light → Dark → System and shows the current choice.
 */
export function ThemeCycleButton({ className = '' }) {
  const { preference, setPreference } = useTheme();
  const index = OPTIONS.findIndex((o) => o.value === preference);
  const current = OPTIONS[index] || OPTIONS[2];
  const next = OPTIONS[(index + 1) % OPTIONS.length];
  const Icon = current.icon;

  return (
    <button
      type="button"
      onClick={() => setPreference(next.value)}
      aria-label={`Theme: ${current.label}. Switch to ${next.label}`}
      title={`Theme: ${current.label} (click for ${next.label})`}
      className={`flex size-9 items-center justify-center rounded-xl border border-line bg-raised/60 text-muted transition-colors hover:border-line-strong hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lavender ${className}`}
    >
      <Icon className="size-4" aria-hidden />
    </button>
  );
}

/**
 * Three-way theme switch (Light / Dark / System) as an accessible radio group.
 * `showLabels` renders text next to the icons (used on the Settings page).
 */
export default function ThemeToggle({ showLabels = false, className = '' }) {
  const { preference, setPreference } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label="Colour theme"
      className={`inline-flex items-center gap-0.5 rounded-xl border border-line bg-raised/60 p-0.5 ${className}`}
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = preference === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={showLabels ? undefined : `${label} theme`}
            title={`${label} theme`}
            onClick={() => setPreference(value)}
            className={`flex items-center justify-center gap-1.5 rounded-[10px] text-xs font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lavender ${
              showLabels ? 'h-8 px-3' : 'size-7'
            } ${active ? 'bg-surface text-fg shadow-[var(--shadow-control)]' : 'text-faint hover:text-fg'}`}
          >
            <Icon className="size-3.5" aria-hidden />
            {showLabels && <span>{label}</span>}
          </button>
        );
      })}
    </div>
  );
}
