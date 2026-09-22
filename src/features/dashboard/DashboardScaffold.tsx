import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Card } from "../../components/ornament/Card";
import { Section } from "../../components/ornament/Section";
import { StatCard, type StatCardProps } from "../../components/ui/StatCard";
import { getModeModules } from "../../app/registry/modules";
import type { ModeId } from "../../app/registry/types";
import { useMemo } from "react";
import { Divider } from "../../components/ornament/Divider";
import { AccountantIllustration } from "../../components/illustrations/AccountantIllustration";
import { CpaIllustration } from "../../components/illustrations/CpaIllustration";
import { BankerIllustration } from "../../components/illustrations/BankerIllustration";
import { InvestorIllustration } from "../../components/illustrations/InvestorIllustration";
import { useReducedMotion } from "framer-motion";
import { ErrorBoundary } from "../../components/ErrorBoundary";

export interface DashboardScaffoldProps {
  modeId: ModeId;
  greeting: string;
  subtitle: string;
  stats: readonly StatCardProps[];
}

export function DashboardScaffold({ modeId, greeting, subtitle, stats }: DashboardScaffoldProps) {
  const tools = useMemo(() => {
    return [...getModeModules(modeId)]
      .sort((a, b) => (a.status === b.status ? 0 : a.status === "ready" ? -1 : 1))
      .slice(0, 6);
  }, [modeId]);

  const reduceMotion = useReducedMotion();

  const Illustration = useMemo(() => {
    switch (modeId) {
      case "accountant": return AccountantIllustration;
      case "cpa": return CpaIllustration;
      case "banker": return BankerIllustration;
      case "investor": return InvestorIllustration;
      default: return null;
    }
  }, [modeId]);

  return (
    <div className="flex flex-col gap-8">
      <Section n={1} title="Overview" className="relative">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-display font-semibold tracking-tight">{greeting}</h1>
            <p className="mt-1 text-sm text-muted">{subtitle}</p>
          </div>
          {!reduceMotion && Illustration && (
            <div className="lg:w-[260px] lg:flex-shrink-0 hidden lg:block">
              <ErrorBoundary label="illustration" compact>
                <Illustration accent="var(--accent)" />
              </ErrorBoundary>
            </div>
          )}
        </div>
      </Section>

      <Section n={2} title="Key Metrics" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 grid-auto-rows-fr">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </Section>

      {tools.length > 0 && (
        <Section n={3} title="Quick actions">
          <Divider />
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 grid-auto-rows-fr">
            {tools.map((tool) => (
              <Link
                key={tool.id}
                to={tool.path}
                className="block rounded-[var(--radius)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
              >
                <Card interactive accent={tool.accent} className="flex h-full items-center gap-4 p-5">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/5" style={{ color: tool.accent } as React.CSSProperties}>
                    <tool.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{tool.title}</span>
                    {tool.status === "soon" && (
                      <>
                        <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-wide text-muted">
                          Soon
                        </span>
                        <span
                          className="absolute top-2 right-2 transform rotate-45 origin-top-right font-caps text-[9px] text-oxblood/70 whitespace-nowrap"
                          aria-label="Sealed"
                        >
                          SEALED
                        </span>
                      </>
                    )}
                  </span>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
                </Card>
              </Link>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}