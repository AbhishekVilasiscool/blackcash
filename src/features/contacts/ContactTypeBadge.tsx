import type { ContactType } from "../../lib/types/contacts";

const TYPE_CLASSES: Record<ContactType, string> = {
  client: "bg-emerald-400/15 text-emerald-300",
  vendor: "bg-violet-400/15 text-violet-300",
  investor: "bg-amber-400/15 text-amber-300",
  target: "bg-rose-400/15 text-rose-300",
  colleague: "bg-sky-400/15 text-sky-300",
};

export function ContactTypeBadge({ type }: { type: ContactType }) {
  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${TYPE_CLASSES[type]}`}
    >
      {type}
    </span>
  );
}