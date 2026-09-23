import { motion, useReducedMotion } from "framer-motion";
import type { HTMLAttributes } from "react";

export interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  children: React.ReactNode;
  isActive?: boolean;
}

export function TableRow({ children, isActive = true, className = "", ...props }: TableRowProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      whileHover={!reduceMotion && isActive ? { backgroundColor: "rgba(255,255,255,0.03)" } : undefined}
      transition={{ duration: 0.1, ease: "easeOut" }}
    >
      <tr className={`${!isActive ? "opacity-50" : ""} ${className}`} {...props}>
        {children}
      </tr>
    </motion.div>
  );
}

export interface TableCellProps extends HTMLAttributes<HTMLTableCellElement> {
  children: React.ReactNode;
  align?: "left" | "center" | "right";
}

export function TableCell({ children, align = "left", className = "", ...props }: TableCellProps) {
  const alignClasses = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  };
  return (
    <td className={`p-3 ${alignClasses[align]} ${className}`} {...props}>
      {children}
    </td>
  );
}

export interface TableHeaderProps extends HTMLAttributes<HTMLTableCellElement> {
  children: React.ReactNode;
  align?: "left" | "center" | "right";
}

export function TableHeader({ children, align = "left", className = "", ...props }: TableHeaderProps) {
  const alignClasses = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  };
  return (
    <th className={`p-3 font-caps text-[10px] tracking-wider text-muted ${alignClasses[align]} ${className}`} {...props}>
      {children}
    </th>
  );
}