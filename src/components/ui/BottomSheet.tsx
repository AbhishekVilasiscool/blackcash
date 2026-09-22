import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

export interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-xl border-t border-border bg-[#0B1120] p-4 pb-8"
            initial={reduceMotion ? { opacity: 0 } : { y: "100%" }}
            animate={reduceMotion ? { opacity: 1 } : { y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
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