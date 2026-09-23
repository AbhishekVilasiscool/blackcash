import { useId } from "react";

export interface ToggleProps {
  label?: string;
  className?: string;
  id?: string;
  checked?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
}

export function Toggle({ label, className = "", id, checked, onChange, disabled }: ToggleProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <button
        type="button"
        role="switch"
        aria-checked={checked ?? false}
        aria-label={label ?? ""}
        onClick={(e) => {
          e.preventDefault();
          onChange?.({ target: { checked: !checked } } as React.ChangeEvent<HTMLInputElement>);
        }}
        disabled={disabled}
        style={{
          width: 44,
          height: 26,
          borderRadius: 13,
          backgroundColor: checked ? "var(--accent)" : "rgba(180,205,215,0.12)",
          position: "relative",
          border: "none",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.5 : 1,
        } as React.CSSProperties}
      >
        <div
          className="absolute inset-y-0 left-2 top-1/2 -translate-y-1/2 h-20 w-20 shrink-0 rounded-full bg-white shadow-lg pointer-events-none transition-transform duration-200 ease-out"
          style={{
            boxShadow: "0 2px 6px rgba(0,0,0,0.2), 0 1px 2px rgba(0,0,0,0.1)",
            transform: `translateX(${checked ? 18 : 0}px)`,
          } as React.CSSProperties}
        />
      </button>
      <input
        type="checkbox"
        id={inputId}
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
      />
      {label && <span className="text-sm text-text">{label}</span>}
    </div>
  );
}

export interface CheckboxProps {
  label?: string;
  className?: string;
  id?: string;
  checked?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
}

export function Checkbox({ label, className = "", id, checked, onChange, disabled }: CheckboxProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <button
        type="button"
        role="checkbox"
        aria-checked={checked ?? false}
        aria-label={label ?? ""}
        onClick={(e) => {
          e.preventDefault();
          onChange?.({ target: { checked: !checked } } as React.ChangeEvent<HTMLInputElement>);
        }}
        disabled={disabled}
        style={{
          width: 22,
          height: 22,
          borderRadius: 6,
          backgroundColor: checked ? "var(--accent)" : "transparent",
          border: checked ? "none" : "2px solid var(--border)",
          position: "relative",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.5 : 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        } as React.CSSProperties}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-bg pointer-events-none"
          style={{
            strokeDasharray: 30,
            strokeDashoffset: checked ? 0 : 30,
            opacity: checked ? 1 : 0,
            transition: "stroke-dashoffset 0.2s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease",
          } as React.CSSProperties}
          aria-hidden="true"
        >
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </button>
      <input
        type="checkbox"
        id={inputId}
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
      />
      {label && <span className="text-sm text-text">{label}</span>}
    </div>
  );
}