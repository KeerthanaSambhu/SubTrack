import { forwardRef, useId } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion } from 'motion/react';

const controlBase =
  'w-full rounded-xl border bg-raised/75 px-3.5 text-[15px] text-fg placeholder:text-faint transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-lavender/25 disabled:opacity-50 disabled:cursor-not-allowed sm:text-sm';

const borderFor = (error) =>
  error
    ? 'border-danger/60 focus:border-danger ring-1 ring-danger/20'
    : 'border-line-strong hover:border-white/20 focus:border-lavender';

/**
 * Field: label + control + hint/error, wired up for screen readers.
 * The render-prop receives the ids the control needs.
 */
export function Field({ label, hint, error, optional, className = '', children }) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="mb-2 flex items-baseline justify-between text-xs font-semibold uppercase tracking-wider text-muted">
          <span>{label}</span>
          {optional && <span className="text-[11px] font-normal lowercase tracking-normal text-faint">optional</span>}
        </label>
      )}
      {children({ id, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined })}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-danger">
          <span>•</span> {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-faint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export const Input = forwardRef(function Input({ error, className = '', ...props }, ref) {
  return (
    <input
      ref={ref}
      className={`${controlBase} h-11 ${borderFor(error)} shadow-inner ${className}`}
      {...props}
    />
  );
});

export function Select({ error, className = '', children, ...props }) {
  return (
    <div className="relative">
      <select
        className={`${controlBase} h-11 cursor-pointer appearance-none pr-10 ${borderFor(error)} shadow-inner ${className}`}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-muted"
        aria-hidden
      />
    </div>
  );
}

export function Textarea({ error, className = '', ...props }) {
  return (
    <textarea
      className={`${controlBase} min-h-24 resize-y py-3 ${borderFor(error)} shadow-inner ${className}`}
      {...props}
    />
  );
}

/**
 * A row of mutually exclusive options with animated gliding pill indicator.
 */
export function SegmentedControl({
  options,
  value,
  onChange,
  label,
  size = 'md',
  className = '',
}) {
  const uniqueId = useId();

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={`relative flex w-full items-center rounded-xl border border-line-strong bg-raised/80 p-1 shadow-inner ${className}`}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={`relative flex-1 rounded-lg font-medium transition-colors duration-150 z-10 select-none ${
              size === 'sm' ? 'h-7.5 text-xs sm:text-[13px]' : 'h-9 text-xs sm:text-sm'
            } ${selected ? 'text-fg font-semibold' : 'text-faint hover:text-muted'}`}
          >
            {selected && (
              <motion.span
                layoutId={`segment-pill-${uniqueId}`}
                transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                className="absolute inset-0 rounded-lg bg-surface border border-line-strong shadow-sm -z-10"
              />
            )}
            <span className="relative z-10">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
