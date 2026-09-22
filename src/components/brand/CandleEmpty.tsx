import { useSvgId } from "../../lib/useSvgId";

interface CandleEmptyProps {
  size?: number;
}

export function CandleEmpty({ size = 120 }: CandleEmptyProps) {
  const gradientId = useSvgId();
  const filterId = useSvgId();
  const scale = size / 120;

  return (
    <svg width={size} height={size} viewBox="0 0 120 120" className="mx-auto mb-4 text-muted" aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="var(--bg-2)" stopOpacity="1" />
        </linearGradient>
        <filter id={filterId}>
          <feGaussianBlur stdDeviation="4" />
        </filter>
      </defs>
      <g transform={`scale(${scale} ${scale})`}>
        <rect x="50" y="30" width="20" height="60" rx="2" fill={`url(#${gradientId})`} />
        <path d="M55 30 Q55 20 60 20 Q65 20 65 30" fill={`url(#${gradientId})`} />
        <ellipse cx="60" cy="20" rx="5" ry="8" fill="var(--accent)" fillOpacity="0.8" filter={`url(#${filterId})`} className="flame-glow" />
        <path d="M60 20 Q55 12 60 8 Q65 12 60 20" fill="var(--accent)" fillOpacity="0.6" className="flame-sway" />
        <style>{`
          @keyframes flame-sway {
            0%, 100% { transform: translateX(0) scaleX(1); }
            25% { transform: translateX(-1px) scaleX(0.95); }
            75% { transform: translateX(1px) scaleX(1.05); }
          }
          @keyframes flame-glow {
            0%, 100% { opacity: 0.8; r: 5; }
            50% { opacity: 0.5; r: 4; }
          }
          .flame-sway {
            transform-origin: 60px 20px;
            animation: flame-sway 2s ease-in-out infinite;
          }
          .flame-glow {
            transform-origin: 60px 20px;
            animation: flame-glow 1.5s ease-in-out infinite;
          }
          @media (prefers-reduced-motion: reduce) {
            .flame-sway, .flame-glow {
              animation: none;
            }
          }
        `}</style>
      </g>
    </svg>
  );
}