import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import Button from './Button';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

let openCount = 0; // supports stacked dialogs (e.g. details → delete confirmation)

/**
 * Accessible, animated dialog modal with spring-feel transitions,
 * backdrop blur, responsive sheet layout on mobile, and keyboard focus trap.
 */
export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  busy = false,
}) {
  const panelRef = useRef(null);
  const titleId = useId();
  const descId = useId();
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (!open) return undefined;
    const previouslyFocused = document.activeElement;
    openCount += 1;
    document.body.style.overflow = 'hidden';

    const frame = requestAnimationFrame(() => {
      const panel = panelRef.current;
      if (!panel) return;
      const target = panel.querySelector('[data-autofocus]') || panel.querySelector(FOCUSABLE) || panel;
      target.focus({ preventScroll: true });
    });

    return () => {
      cancelAnimationFrame(frame);
      openCount -= 1;
      if (openCount === 0) document.body.style.overflow = '';
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus({ preventScroll: true });
    };
  }, [open]);

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      if (!busy) onClose();
      return;
    }
    if (event.key !== 'Tab') return;
    const panel = panelRef.current;
    if (!panel) return;
    const items = [...panel.querySelectorAll(FOCUSABLE)];
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const width = {
    sm: 'sm:max-w-md',
    md: 'sm:max-w-lg',
    lg: 'sm:max-w-2xl',
  }[size] || 'sm:max-w-lg';

  return createPortal(
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6"
          onKeyDown={handleKeyDown}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-[var(--color-overlay)] backdrop-blur-md"
            onClick={() => !busy && onClose()}
            aria-hidden
          />

          {/* Modal Panel */}
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description ? descId : undefined}
            tabIndex={-1}
            initial={
              shouldReduceMotion
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.96, y: 16 }
            }
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={
              shouldReduceMotion
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.96, y: 12 }
            }
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className={`relative flex max-h-[92dvh] w-full flex-col rounded-t-3xl border border-line-strong bg-surface shadow-[var(--shadow-pop)] focus:outline-none sm:rounded-3xl ${width}`}
          >
            {/* Header */}
            <div className="flex items-start gap-4 px-6 pb-3 pt-6 sm:px-7 sm:pt-7 border-b border-line-subtle">
              <div className="min-w-0 flex-1">
                <h2 id={titleId} className="font-display text-lg font-bold tracking-tight text-fg sm:text-xl">
                  {title}
                </h2>
                {description && (
                  <p id={descId} className="mt-1 text-sm leading-relaxed text-muted">
                    {description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={busy}
                className="-mr-2 -mt-1 flex size-8 items-center justify-center rounded-xl text-faint transition-colors hover:bg-raised hover:text-fg disabled:opacity-50"
                aria-label="Close dialog"
              >
                <X className="size-4.5" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5 sm:px-7">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="flex flex-col-reverse gap-2.5 border-t border-line-subtle bg-surface/50 px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end sm:px-7 sm:pb-4 rounded-b-3xl">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/** "Are you sure?" dialog for destructive actions with distinct accent styling. */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Delete',
  loading = false,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      busy={loading}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading} data-autofocus>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-4 py-2">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-danger/15 text-danger ring-1 ring-danger/30 shadow-[0_0_16px_rgba(248,113,113,0.2)]">
          <AlertTriangle className="size-5" aria-hidden />
        </span>
        <div className="space-y-1">
          <p className="text-sm leading-relaxed text-fg/90">{message}</p>
          <p className="text-xs text-faint">This action cannot be undone.</p>
        </div>
      </div>
    </Modal>
  );
}
