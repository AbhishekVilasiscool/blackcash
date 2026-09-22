import { Card } from "../../components/ornament/Card";

export function RatiosPage() {
  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Ratio Analysis</h1>
        <p className="text-sm text-muted">Financial statement ratios — coming soon.</p>
      </header>
      <Card className="p-6 text-sm leading-relaxed text-muted">
        <p>
          Compute liquidity, profitability and leverage ratios from local statements stored via
          Dexie in{" "}
          <code className="rounded bg-white/5 px-1.5 py-0.5 text-[12px] text-text">src/lib/db</code>.
        </p>
      </Card>
    </div>
  );
}

export default RatiosPage;