import { FileText, FolderOpen, Handshake, Receipt, type LucideIcon } from "lucide-react";
import type { ContactLinkKind } from "../../lib/types/contacts";

const KIND_META: Record<ContactLinkKind, { icon: LucideIcon; label: string }> = {
  invoice: { icon: Receipt, label: "Invoice" },
  deal: { icon: Handshake, label: "Deal" },
  document: { icon: FileText, label: "Document" },
  project: { icon: FolderOpen, label: "Project" },
};

export interface LinkedRecordProps {
  kind: ContactLinkKind;
  label: string;
  sublabel?: string;
}

export function LinkedRecord({ kind, label, sublabel }: LinkedRecordProps) {
  const { icon: Icon, label: kindLabel } = KIND_META[kind];

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2.5">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/5 text-accent">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{label}</span>
        {sublabel !== undefined && (
          <span className="block truncate text-xs text-muted">{sublabel}</span>
        )}
      </span>
      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-muted">
        {kindLabel}
      </span>
    </div>
  );
}