import { Card } from "../../components/ornament/Card";

export function GrowthPage() {
  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Growth Projections</h1>
        <p className="text-sm text-muted">Compounding and CAGR scenarios — coming soon.</p>
      </header>
      <Card className="p-6 text-sm leading-relaxed text-muted">
        <p>
          Project balances with futureValue() and derive growth rates from history. The math is
          ready in{" "}
          <code className="rounded bg-white/5 px-1.5 py-0.5 text-[12px] text-text">src/lib/finance</code>.
        </p>
      </Card>
    </div>
  );
}

export default GrowthPage;