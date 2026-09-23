import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

export interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

const enterTransition = { type: "spring", stiffness: 300, damping: 30, duration: 0.22 } as const;
const overlayTransition = { duration: 0.15, ease: "easeOut" } as const;

export function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <motion.button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-black/60"
            onClick={onClose}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={overlayTransition}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-xl border-t border-border bg-[var(--bg-2)] p-4 pb-8"
            initial={reduceMotion ? { opacity: 0 } : { y: "100%", opacity: 0 }}
            animate={reduceMotion ? { opacity: 1 } : { y: 0, opacity: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { y: "100%", opacity: 0 }}
            transition={enterTransition}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />
            {title !== undefined && (
              <h3 className="mb-2 px-1 text-sm font-semibold">{title}</h3>
            )}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

const modalEnterTransition = { type: "spring", stiffness: 300, damping: 30, duration: 0.22 } as const;
const modalOverlayTransition = { duration: 0.15, ease: "easeOut" } as const;

const sizeClasses = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export function Modal({ open, onClose, title, children, size = "md" }: ModalProps) {
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            className="absolute inset-0 bg-black/60"
            onClick={onClose}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={modalOverlayTransition}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? "modal-title" : undefined}
            className={`relative w-full ${sizeClasses[size]} rounded-xl border border-border bg-[var(--bg-2)] shadow-xl overflow-hidden`}
            initial={reduceMotion ? { opacity: 0, scale: 0.95 } : { y: 20, opacity: 0, scale: 0.95 }}
            animate={reduceMotion ? { opacity: 1, scale: 1 } : { y: 0, opacity: 1, scale: 1 }}
            exit={reduceMotion ? { opacity: 0, scale: 0.95 } : { y: 20, opacity: 0, scale: 0.95 }}
            transition={reduceMotion ? undefined : modalEnterTransition}
            onClick={(e) => e.stopPropagation()}
          >
            {title !== undefined && (
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <h3 id="modal-title" className="text-sm font-semibold">
                  {title}
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg p-1.5 text-muted hover:bg-white/5 hover:text-text transition-colors"
                  aria-label="Close"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            <div className="p-4">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}