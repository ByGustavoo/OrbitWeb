import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { curvaEntradaSaida, progresso } from '../animacao';
import { abertura, cenas, DURACAO_TOTAL, ordemCenas } from '../linhaDoTempo';
import type { NomeCena } from '../linhaDoTempo';
import { cores } from '../tema';

const orbitas = [
  { raioX: 520, raioY: 205, voltas: 0.9, satelite: 7 },
  { raioX: 720, raioY: 290, voltas: 0, satelite: 0 },
  { raioX: 920, raioY: 385, voltas: -0.55, satelite: 5 },
];

const marcos = [...ordemCenas.map((nome) => cenas[nome].inicio), DURACAO_TOTAL];

const ajustesPorCena: Record<NomeCena, { x: number; y: number; brilho: number; orbitas: number }> = {
  abertura: { x: 50, y: 48, brilho: 0.55, orbitas: 1 },
  gancho: { x: 50, y: 40, brilho: 0.38, orbitas: 0.5 },
  tarefas: { x: 72, y: 50, brilho: 0.42, orbitas: 0.3 },
  calendario: { x: 30, y: 50, brilho: 0.4, orbitas: 0.28 },
  cronometro: { x: 70, y: 46, brilho: 0.45, orbitas: 0.3 },
  progresso: { x: 32, y: 55, brilho: 0.4, orbitas: 0.28 },
  revisao: { x: 68, y: 52, brilho: 0.4, orbitas: 0.28 },
  confianca: { x: 50, y: 48, brilho: 0.5, orbitas: 0.85 },
  encerramento: { x: 50, y: 46, brilho: 0.65, orbitas: 1 },
};

function valoresPorMarcos(campo: 'x' | 'y' | 'brilho' | 'orbitas'): number[] {
  const valores = ordemCenas.map((nome) => ajustesPorCena[nome][campo]);
  return [...valores, valores[valores.length - 1] ?? 0];
}

function porMarcos(quadro: number, valores: number[]): number {
  return interpolate(quadro, marcos, valores, {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: curvaEntradaSaida,
  });
}

export function Fundo() {
  const quadro = useCurrentFrame();
  const brilhoX = porMarcos(quadro, valoresPorMarcos('x'));
  const brilhoY = porMarcos(quadro, valoresPorMarcos('y'));
  const brilhoForca = porMarcos(quadro, valoresPorMarcos('brilho'));
  const presencaOrbitas = porMarcos(quadro, valoresPorMarcos('orbitas'));
  const escala = interpolate(quadro, [0, DURACAO_TOTAL], [1, 1.1]);
  const giroTotal = quadro / DURACAO_TOTAL;

  return (
    <AbsoluteFill style={{ background: cores.fundo, overflow: 'hidden' }}>
      <AbsoluteFill
        style={{
          backgroundImage:
            'linear-gradient(rgba(234, 236, 239, 0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(234, 236, 239, 0.035) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          backgroundPosition: `${quadro * 0.25}px ${quadro * 0.4}px`,
          maskImage: 'radial-gradient(ellipse 70% 65% at 50% 50%, black 20%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 65% at 50% 50%, black 20%, transparent 75%)',
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle 720px at ${brilhoX}% ${brilhoY}%, rgba(143, 170, 230, ${0.17 * brilhoForca}), transparent 70%)`,
        }}
      />
      <svg
        width={1920}
        height={1080}
        viewBox="-960 -540 1920 1080"
        style={{ position: 'absolute', inset: 0, overflow: 'visible', transform: `scale(${escala})` }}
      >
        <g transform="rotate(-14)">
          {orbitas.map((orbita, indice) => {
            const entrada = progresso(quadro, abertura.orbitasFundo + indice * 6, 46);
            const angulo = (0.6 + indice * 1.7 + giroTotal * orbita.voltas * Math.PI * 2) % (Math.PI * 2);
            const opacidade = entrada * presencaOrbitas * (0.95 - indice * 0.2);
            return (
              <g key={indice} opacity={opacidade}>
                <ellipse
                  cx={0}
                  cy={0}
                  rx={orbita.raioX * (0.8 + 0.2 * entrada)}
                  ry={orbita.raioY * (0.8 + 0.2 * entrada)}
                  fill="none"
                  stroke={cores.linhaOrbita}
                  strokeWidth={1.5}
                />
                {orbita.satelite > 0 ? (
                  <circle
                    cx={Math.cos(angulo) * orbita.raioX * (0.8 + 0.2 * entrada)}
                    cy={Math.sin(angulo) * orbita.raioY * (0.8 + 0.2 * entrada)}
                    r={orbita.satelite}
                    fill={cores.destaque}
                    opacity={0.55}
                  />
                ) : null}
              </g>
            );
          })}
        </g>
      </svg>
      <AbsoluteFill
        style={{ background: 'radial-gradient(ellipse 85% 80% at 50% 50%, transparent 55%, rgba(0, 0, 0, 0.55) 100%)' }}
      />
    </AbsoluteFill>
  );
}
