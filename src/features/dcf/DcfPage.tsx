import { Card } from "../../components/ornament/Card";

export function DcfPage() {
  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">DCF Valuation</h1>
        <p className="text-sm text-muted">Discounted cash flow models — coming soon.</p>
      </header>
      <Card className="p-6 text-sm leading-relaxed text-muted">
        <p>
          Build a DCF from projected free cash flows, apply a discount rate, and get NPV plus
          IRR. The core math (npv, irr) already lives in{" "}
          <code className="rounded bg-white/5 px-1.5 py-0.5 text-[12px] text-text">src/lib/finance</code>{" "}
          with unit tests.
        </p>
      </Card>
    </div>
  );
}

export default DcfPage;