import { Lock } from "lucide-react";
import { useModule } from "../../app/registry/context";
import { Card } from "../../components/ornament/Card";
import { CandleEmpty } from "../../components/brand/CandleEmpty";
import { WaxSeal } from "../../components/ornament/WaxSeal";

export function ModuleSoonPlaceholder() {
  const def = useModule();

  return (
    <div className="flex flex-col gap-8">
      <header className="flex items-center gap-4">
        <div className="relative">
          <WaxSeal size={48} accent="var(--oxblood)" tone="oxblood" aria-hidden="true" />
          <Lock
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[14px] text-oxblood/80"
            aria-hidden="true"
          />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{def.title}</h1>
          <p className="mt-0.5 text-sm text-muted">Sealed, coming soon</p>
        </div>
      </header>
      <Card className="flex max-w-lg flex-col items-center gap-6 p-8 text-center">
        <CandleEmpty size={160} />
        <div className="max-w-md">
          <p className="text-sm leading-relaxed text-muted">
            This room is sealed. Coming soon.
          </p>
        </div>
      </Card>
    </div>
  );
}

export default ModuleSoonPlaceholder;