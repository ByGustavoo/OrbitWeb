import { describe, expect, it } from 'vitest';
import { calcularSequencia } from './sequencia';

describe('calcularSequencia', () => {
  it('conta os dias seguidos até hoje', () => {
    const resultado = calcularSequencia(['2026-09-20', '2026-09-21', '2026-09-22'], '2026-09-22');
    expect(resultado).toEqual({ atual: 3, recorde: 3, contaHoje: true });
  });

  it('mantém a sequência até ontem enquanto hoje ainda não terminou', () => {
    const resultado = calcularSequencia(['2026-09-20', '2026-09-21'], '2026-09-22');
    expect(resultado).toEqual({ atual: 2, recorde: 2, contaHoje: false });
  });

  it('quebra quando um dia termina vazio', () => {
    const resultado = calcularSequencia(['2026-09-19', '2026-09-20'], '2026-09-22');
    expect(resultado.atual).toBe(0);
    expect(resultado.recorde).toBe(2);
  });

  it('guarda o recorde mesmo quando a sequência atual é menor', () => {
    const resultado = calcularSequencia(
      ['2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04', '2026-09-21', '2026-09-22'],
      '2026-09-22',
    );
    expect(resultado).toEqual({ atual: 2, recorde: 4, contaHoje: true });
  });

  it('ignora dias no futuro e atravessa a virada do mês', () => {
    const resultado = calcularSequencia(['2026-08-31', '2026-09-01', '2026-09-05'], '2026-09-01');
    expect(resultado).toEqual({ atual: 2, recorde: 2, contaHoje: true });
  });

  it('sem nenhum dia, tudo zera', () => {
    expect(calcularSequencia([], '2026-09-22')).toEqual({ atual: 0, recorde: 0, contaHoje: false });
  });
});
