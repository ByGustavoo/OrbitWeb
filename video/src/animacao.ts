import type { CSSProperties } from 'react';
import { Easing, interpolate, spring } from 'remotion';
import { QUADROS_POR_SEGUNDO, SOBREPOSICAO } from './linhaDoTempo';

export const curvaSaida = Easing.bezier(0.22, 1, 0.36, 1);
export const curvaEntradaSaida = Easing.bezier(0.65, 0, 0.35, 1);

export function progresso(quadro: number, inicio: number, duracao: number, curva = curvaSaida): number {
  return interpolate(quadro, [inicio, inicio + duracao], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: curva,
  });
}

export function mola(quadro: number, inicio: number, rigidez = 140, amortecimento = 16): number {
  return spring({
    frame: quadro - inicio,
    fps: QUADROS_POR_SEGUNDO,
    config: { stiffness: rigidez, damping: amortecimento, mass: 1 },
  });
}

export function misturar(de: number, para: number, t: number): number {
  return de + (para - de) * t;
}

export function estiloTransicaoCena(quadro: number, duracao: number, comSaida = true): CSSProperties {
  const entrada = progresso(quadro, 0, SOBREPOSICAO + 4);
  const saida = comSaida ? progresso(quadro, duracao - SOBREPOSICAO, SOBREPOSICAO, Easing.in(Easing.cubic)) : 0;
  const escala = 0.965 + 0.035 * entrada + 0.07 * saida;
  const desfoque = (1 - entrada) * 16 + saida * 18;
  return {
    opacity: entrada * (1 - saida),
    transform: `scale(${escala})`,
    filter: desfoque > 0.05 ? `blur(${desfoque}px)` : undefined,
  };
}
