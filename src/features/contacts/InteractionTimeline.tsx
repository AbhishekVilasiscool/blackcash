import { Calendar, Mail, MessageSquare, Phone, type LucideIcon } from "lucide-react";
import type { ContactInteraction, InteractionKind } from "../../lib/types/contacts";

const KIND_META: Record<InteractionKind, { icon: LucideIcon; label: string }> = {
  call: { icon: Phone, label: "Call" },
  email: { icon: Mail, label: "Email" },
  meeting: { icon: Calendar, label: "Meeting" },
  note: { icon: MessageSquare, label: "Note" },
};

function formatDate(isoDate: string): string {
  const parsed = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export interface InteractionTimelineProps {
  interactions: readonly ContactInteraction[];
}

export function InteractionTimeline({ interactions }: InteractionTimelineProps) {
  if (interactions.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted">
        No interactions recorded yet.
      </p>
    );
  }

  return (
    <ol className="flex flex-col gap-4">
      {interactions.map((interaction) => {
        const meta = KIND_META[interaction.kind];
        return (
          <li key={interaction.id} className="flex gap-3">
            <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/5 text-accent">
              <meta.icon className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm">
                <span className="font-semibold">{meta.label}</span>
                <span className="text-xs text-muted">{formatDate(interaction.date)}</span>
              </p>
              {interaction.note !== "" && (
                <p className="mt-0.5 text-sm leading-relaxed text-muted">{interaction.note}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}