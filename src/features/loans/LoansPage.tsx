import { Card } from "../../components/ornament/Card";

export function LoansPage() {
  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Loan Analyzer</h1>
        <p className="text-sm text-muted">Payments and amortization.</p>
      </header>
      <Card className="p-6 text-sm leading-relaxed text-muted">
        <p>
          Model monthly payments with pmt() and inspect principal-versus-interest splits from a
          full amortizationSchedule(). Both are shipped and tested in{" "}
          <code className="rounded bg-white/5 px-1.5 py-0.5 text-[12px] text-text">src/lib/finance</code>.
        </p>
      </Card>
    </div>
  );
}

export default LoansPage;