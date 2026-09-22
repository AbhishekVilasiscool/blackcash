import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { Trash2 } from "lucide-react";
import type { ReactNode } from "react";

export interface SwipeRowProps {
  onDelete: () => void;
  children: ReactNode;
}

export function SwipeRow({ onDelete, children }: SwipeRowProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return (
      <div className="relative">
        {children}
        <button
          type="button"
          onClick={onDelete}
          aria-label="Delete"
          className="absolute right-3 top-3 rounded-lg border border-danger/30 bg-danger/15 p-2 text-danger"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    );
  }

  const x = useMotionValue(0);
  const revealed = useTransform(x, [-72, 0], [1, 0]);

  return (
    <div className="relative">
      <motion.div
        className="absolute inset-y-0 right-0 flex items-center pr-3"
        style={{ opacity: revealed }}
      >
        <button
          type="button"
          onClick={onDelete}
          aria-label="Delete"
          className="rounded-lg border border-danger/30 bg-danger/15 p-2.5 text-danger"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </button>
      </motion.div>
      <motion.div
        style={{ x, touchAction: "pan-y" }}
        drag="x"
        dragConstraints={{ left: -72, right: 0 }}
        dragElastic={0.08}
        onDragEnd={(_event, info) => {
          void animate(x, info.offset.x < -36 ? -72 : 0);
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}