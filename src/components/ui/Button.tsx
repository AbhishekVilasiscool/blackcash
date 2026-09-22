import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "ghost" | "danger";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children?: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-accent text-bg hover:brightness-110 focus-visible:outline-accent",
  ghost:
    "border border-border bg-transparent text-text hover:bg-white/5 focus-visible:outline-accent",
  danger:
    "border border-danger/30 bg-danger/15 text-danger hover:bg-danger/25 focus-visible:outline-danger",
};

export function Button({
  variant = "primary",
  className = "",
  type = "button",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 font-caps-lg transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50 ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}