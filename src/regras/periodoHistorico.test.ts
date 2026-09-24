import { describe, expect, it } from 'vitest';
import { ajustarIntervalo, intervaloDoPeriodo } from './periodoHistorico';

const hoje = '2026-09-24';

describe('intervaloDoPeriodo', () => {
  it('hoje e ontem cobrem um único dia', () => {
    expect(intervaloDoPeriodo('HOJE', hoje)).toEqual({ dataInicial: hoje, dataFinal: hoje });
    expect(intervaloDoPeriodo('ONTEM', hoje)).toEqual({ dataInicial: '2026-09-23', dataFinal: '2026-09-23' });
  });

  it('os últimos 7 e 30 dias incluem hoje', () => {
    expect(intervaloDoPeriodo('ULTIMOS_7_DIAS', hoje)).toEqual({ dataInicial: '2026-09-18', dataFinal: hoje });
    expect(intervaloDoPeriodo('ULTIMOS_30_DIAS', hoje)).toEqual({ dataInicial: '2026-08-26', dataFinal: hoje });
  });

  it('este mês vai do dia 1 até hoje', () => {
    expect(intervaloDoPeriodo('ESTE_MES', hoje)).toEqual({ dataInicial: '2026-09-01', dataFinal: hoje });
    expect(intervaloDoPeriodo('ESTE_MES', '2026-03-01')).toEqual({ dataInicial: '2026-03-01', dataFinal: '2026-03-01' });
  });

  it('atravessa a virada do ano', () => {
    expect(intervaloDoPeriodo('ULTIMOS_7_DIAS', '2027-01-03')).toEqual({ dataInicial: '2026-12-28', dataFinal: '2027-01-03' });
  });

  it('o personalizado usa as datas escolhidas', () => {
    expect(intervaloDoPeriodo('PERSONALIZADO', hoje, { dataInicial: '2026-08-01', dataFinal: '2026-08-15' })).toEqual({
      dataInicial: '2026-08-01',
      dataFinal: '2026-08-15',
    });
  });

  it('o personalizado sem datas começa pelos últimos 7 dias', () => {
    expect(intervaloDoPeriodo('PERSONALIZADO', hoje)).toEqual({ dataInicial: '2026-09-18', dataFinal: hoje });
  });

  it('o personalizado invertido não gera período vazio', () => {
    expect(intervaloDoPeriodo('PERSONALIZADO', hoje, { dataInicial: '2026-09-20', dataFinal: '2026-09-10' })).toEqual({
      dataInicial: '2026-09-20',
      dataFinal: '2026-09-20',
    });
  });
});

describe('ajustarIntervalo', () => {
  it('mantém um intervalo em ordem', () => {
    const intervalo = { dataInicial: '2026-09-01', dataFinal: '2026-09-10' };
    expect(ajustarIntervalo(intervalo, 'dataInicial')).toBe(intervalo);
  });

  it('quando a data inicial passa da final, a final acompanha', () => {
    expect(ajustarIntervalo({ dataInicial: '2026-09-15', dataFinal: '2026-09-10' }, 'dataInicial')).toEqual({
      dataInicial: '2026-09-15',
      dataFinal: '2026-09-15',
    });
  });

  it('quando a data final fica antes da inicial, a inicial acompanha', () => {
    expect(ajustarIntervalo({ dataInicial: '2026-09-15', dataFinal: '2026-09-10' }, 'dataFinal')).toEqual({
      dataInicial: '2026-09-10',
      dataFinal: '2026-09-10',
    });
  });
});
