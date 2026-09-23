import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

export interface StaggerListProps {
  children: ReactNode;
  maxItems?: number;
  delayPerItem?: number;
  className?: string;
}

export function StaggerList({ children, maxItems = 12, delayPerItem = 40, className = "" }: StaggerListProps) {
  const reduceMotion = useReducedMotion();
  const childArray = Array.isArray(children) ? children : [children];
  const itemsToAnimate = childArray.slice(0, maxItems);
  const remainingItems = childArray.slice(maxItems);

  if (reduceMotion) {
    return (
      <div className={className}>
        {childArray}
      </div>
    );
  }

  return (
    <div className={className}>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: delayPerItem / 1000,
              delayChildren: 0,
            },
          },
        }}
      >
        {itemsToAnimate.map((child, index) => (
          <motion.div
            key={index}
            variants={{
              hidden: { opacity: 0, y: 8 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { type: "spring", stiffness: 300, damping: 30 },
              },
            }}
          >
            {child}
          </motion.div>
        ))}
      </motion.div>
      {remainingItems.map((child, index) => (
        <div key={maxItems + index}>{child}</div>
      ))}
    </div>
  );
}

export interface StaggerItemProps {
  children: ReactNode;
  index: number;
  delayPerItem?: number;
}

export function StaggerItem({ children, index, delayPerItem = 40 }: StaggerItemProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <>{children}</>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * (delayPerItem / 1000),
        type: "spring",
        stiffness: 300,
        damping: 30,
      }}
    >
      {children}
    </motion.div>
  );
}