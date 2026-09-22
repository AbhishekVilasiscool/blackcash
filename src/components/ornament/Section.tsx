import { toRomanNumeral } from "./RomanNumeral";

export interface SectionProps {
  n: number;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function Section({ n, title, children, className = "" }: SectionProps) {
  return (
    <section className={className}>
      <h2 className="font-display text-lg font-semibold flex items-center gap-2 mb-4">
        <span className="text-accent" aria-hidden="true">{toRomanNumeral(n)}.</span> {title}
      </h2>
      {children}
    </section>
  );
}