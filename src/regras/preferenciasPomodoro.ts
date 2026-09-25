import type { DuracoesPomodoro } from './cronometro';

export interface PreferenciasPomodoro {
  focoMinutos: number;
  pausaCurtaMinutos: number;
  pausaLongaMinutos: number;
  ciclosAtePausaLonga: number;
  iniciarPausaSozinha: boolean;
  somAoFimDaFase: boolean;
}

export type CampoDuracaoPomodoro = 'focoMinutos' | 'pausaCurtaMinutos' | 'pausaLongaMinutos' | 'ciclosAtePausaLonga';

export interface LimiteDuracao {
  minimo: number;
  maximo: number;
}

export const LIMITES_POMODORO: Record<CampoDuracaoPomodoro, LimiteDuracao> = {
  focoMinutos: { minimo: 5, maximo: 90 },
  pausaCurtaMinutos: { minimo: 1, maximo: 30 },
  pausaLongaMinutos: { minimo: 5, maximo: 60 },
  ciclosAtePausaLonga: { minimo: 2, maximo: 8 },
};

export const PREFERENCIAS_POMODORO_PADRAO: PreferenciasPomodoro = {
  focoMinutos: 25,
  pausaCurtaMinutos: 5,
  pausaLongaMinutos: 15,
  ciclosAtePausaLonga: 4,
  iniciarPausaSozinha: false,
  somAoFimDaFase: false,
};

const CAMPOS_DURACAO = Object.keys(LIMITES_POMODORO) as CampoDuracaoPomodoro[];

function lerInteiroNoLimite(valor: unknown, limite: LimiteDuracao, padrao: number): number {
  if (typeof valor !== 'number' || !Number.isFinite(valor)) return padrao;
  return Math.min(Math.max(Math.round(valor), limite.minimo), limite.maximo);
}

export function lerPreferenciasPomodoro(valor: unknown): PreferenciasPomodoro {
  const salvas = valor && typeof valor === 'object' ? (valor as Partial<Record<keyof PreferenciasPomodoro, unknown>>) : {};
  const preferencias = { ...PREFERENCIAS_POMODORO_PADRAO };
  CAMPOS_DURACAO.forEach((campo) => {
    preferencias[campo] = lerInteiroNoLimite(salvas[campo], LIMITES_POMODORO[campo], PREFERENCIAS_POMODORO_PADRAO[campo]);
  });
  if (typeof salvas.iniciarPausaSozinha === 'boolean') preferencias.iniciarPausaSozinha = salvas.iniciarPausaSozinha;
  if (typeof salvas.somAoFimDaFase === 'boolean') preferencias.somAoFimDaFase = salvas.somAoFimDaFase;
  return preferencias;
}

export function duracoesDasPreferencias(preferencias: PreferenciasPomodoro): DuracoesPomodoro {
  return {
    focoSegundos: preferencias.focoMinutos * 60,
    pausaCurtaSegundos: preferencias.pausaCurtaMinutos * 60,
    pausaLongaSegundos: preferencias.pausaLongaMinutos * 60,
    ciclosAtePausaLonga: preferencias.ciclosAtePausaLonga,
  };
}

export function duracoesSaoPadrao(preferencias: PreferenciasPomodoro): boolean {
  return CAMPOS_DURACAO.every((campo) => preferencias[campo] === PREFERENCIAS_POMODORO_PADRAO[campo]);
}

export interface ResumoConjuntoPomodoro {
  minutosEstudo: number;
  minutosTotais: number;
}

export function resumirConjunto(preferencias: PreferenciasPomodoro): ResumoConjuntoPomodoro {
  const focos = preferencias.ciclosAtePausaLonga;
  const minutosEstudo = focos * preferencias.focoMinutos;
  return {
    minutosEstudo,
    minutosTotais: minutosEstudo + (focos - 1) * preferencias.pausaCurtaMinutos + preferencias.pausaLongaMinutos,
  };
}
