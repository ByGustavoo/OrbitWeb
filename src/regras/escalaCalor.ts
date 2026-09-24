export type NivelCalor = 0 | 1 | 2 | 3 | 4;

export interface EscalaCalor {
  q1: number;
  q2: number;
  q3: number;
}

export function montarEscalaCalor(valores: number[]): EscalaCalor {
  const positivos = valores.filter((valor) => valor > 0).sort((a, b) => a - b);
  const quantil = (razao: number) =>
    positivos[Math.min(positivos.length - 1, Math.floor(positivos.length * razao))] ?? 0;
  return { q1: quantil(0.25), q2: quantil(0.5), q3: quantil(0.75) };
}

export function nivelCalor(valor: number, escala: EscalaCalor): NivelCalor {
  if (valor <= 0) return 0;
  if (valor <= escala.q1) return 1;
  if (valor <= escala.q2) return 2;
  if (valor <= escala.q3) return 3;
  return 4;
}
