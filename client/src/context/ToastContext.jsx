import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { CheckCircle2, AlertCircle, X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(1);
  const shouldReduceMotion = useReducedMotion();

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (message, type = 'success') => {
      const id = nextId.current++;
      setToasts((list) => [...list.slice(-2), { id, message, type }]);
      setTimeout(() => dismiss(id), type === 'error' ? 5500 : 3500);
    },
    [dismiss],
  );

  const toast = useMemo(
    () => ({
      success: (message) => show(message, 'success'),
      error: (message) => show(message, 'error'),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-24 z-[70] flex flex-col items-center gap-2.5 px-4 md:bottom-6 md:items-end md:px-6"
        aria-live="polite"
        role="status"
      >
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={
                shouldReduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, y: 16, scale: 0.95 }
              }
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={
                shouldReduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, y: 8, scale: 0.95 }
              }
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              layout
              className={`pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl border px-4 py-3.5 text-sm shadow-[var(--shadow-pop)] backdrop-blur-xl ${
                t.type === 'error'
                  ? 'border-danger/30 bg-surface/95 text-fg'
                  : 'border-lime/25 bg-surface/95 text-fg'
              }`}
            >
              <span
                className={`flex size-8 shrink-0 items-center justify-center rounded-xl ${
                  t.type === 'error'
                    ? 'bg-danger/15 text-danger ring-1 ring-danger/30'
                    : 'bg-lime/15 text-lime ring-1 ring-lime/30'
                }`}
              >
                {t.type === 'error' ? (
                  <AlertCircle className="size-4.5" aria-hidden />
                ) : (
                  <CheckCircle2 className="size-4.5" aria-hidden />
                )}
              </span>
              <p className="flex-1 font-medium text-[13px] leading-snug">{t.message}</p>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="-mr-1 flex size-7 items-center justify-center rounded-lg text-faint transition-colors hover:bg-raised hover:text-fg"
                aria-label="Dismiss notification"
              >
                <X className="size-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside <ToastProvider>');
  return context;
}
