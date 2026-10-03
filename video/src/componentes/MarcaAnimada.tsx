import { cores } from '../tema';

interface MarcaAnimadaProps {
  tamanho: number;
  tracoOrbita: number;
  nucleo: number;
  satelite: number;
}

export function MarcaAnimada({ tamanho, tracoOrbita, nucleo, satelite }: MarcaAnimadaProps) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 32 32" style={{ display: 'block', overflow: 'visible' }}>
      <rect width="32" height="32" rx="9" fill={cores.marcaFundo} />
      <ellipse
        cx="16"
        cy="16"
        rx="10.5"
        ry="5.5"
        transform="rotate(-28 16 16)"
        fill="none"
        stroke={cores.marcaTraco}
        strokeOpacity={0.5}
        strokeWidth={2}
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - tracoOrbita}
        opacity={tracoOrbita > 0 ? 1 : 0}
      />
      <circle cx="16" cy="16" r={4.2 * nucleo} fill={cores.marcaTraco} />
      <g
        style={{
          transformOrigin: '16px 16px',
          transform: `rotate(${(1 - satelite) * -220}deg) scale(${0.4 + 0.6 * satelite})`,
          opacity: Math.min(satelite * 2, 1),
        }}
      >
        <circle cx="24.6" cy="11.4" r="2.2" fill={cores.marcaTraco} />
      </g>
    </svg>
  );
}
