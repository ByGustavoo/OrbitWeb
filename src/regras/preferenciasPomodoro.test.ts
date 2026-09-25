import { describe, expect, it } from 'vitest';
import {
  PREFERENCIAS_POMODORO_PADRAO,
  duracoesDasPreferencias,
  duracoesSaoPadrao,
  lerPreferenciasPomodoro,
  resumirConjunto,
} from './preferenciasPomodoro';

describe('lerPreferenciasPomodoro', () => {
  it('usa o padrão quando não há nada salvo', () => {
    expect(lerPreferenciasPomodoro(null)).toEqual(PREFERENCIAS_POMODORO_PADRAO);
  });

  it('traz valores fora dos limites para dentro deles', () => {
    const lidas = lerPreferenciasPomodoro({ focoMinutos: 300, pausaCurtaMinutos: 0, pausaLongaMinutos: 20.4, ciclosAtePausaLonga: 1 });
    expect(lidas).toMatchObject({ focoMinutos: 90, pausaCurtaMinutos: 1, pausaLongaMinutos: 20, ciclosAtePausaLonga: 2 });
  });

  it('ignora valores de tipo errado', () => {
    const lidas = lerPreferenciasPomodoro({ focoMinutos: '50', iniciarPausaSozinha: 'sim', somAoFimDaFase: true });
    expect(lidas).toMatchObject({ focoMinutos: 25, iniciarPausaSozinha: false, somAoFimDaFase: true });
  });
});

describe('duracoesDasPreferencias', () => {
  it('converte minutos em segundos para o cronômetro', () => {
    expect(duracoesDasPreferencias({ ...PREFERENCIAS_POMODORO_PADRAO, focoMinutos: 50, pausaCurtaMinutos: 10 })).toEqual({
      focoSegundos: 3000,
      pausaCurtaSegundos: 600,
      pausaLongaSegundos: 900,
      ciclosAtePausaLonga: 4,
    });
  });
});

describe('resumirConjunto', () => {
  it('soma focos, pausas curtas entre eles e a pausa longa', () => {
    expect(resumirConjunto(PREFERENCIAS_POMODORO_PADRAO)).toEqual({ minutosEstudo: 100, minutosTotais: 130 });
  });
});

describe('duracoesSaoPadrao', () => {
  it('não considera o som nem o início automático', () => {
    expect(duracoesSaoPadrao({ ...PREFERENCIAS_POMODORO_PADRAO, somAoFimDaFase: true })).toBe(true);
    expect(duracoesSaoPadrao({ ...PREFERENCIAS_POMODORO_PADRAO, focoMinutos: 30 })).toBe(false);
  });
});
