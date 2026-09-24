import { describe, expect, it } from 'vitest';
import { calcularPrazo, marcarNaoRealizadas, precisaDeNovaData } from './prazo';
import type { DadosPrazo } from './prazo';

const base: DadosPrazo = {
  data: '2026-09-22',
  diaInteiro: false,
  horarioFim: null,
  situacao: 'PENDENTE',
  dataConclusao: null,
};

const em = (texto: string) => new Date(texto);

describe('calcularPrazo', () => {
  it('trata tarefa sem data como sem data', () => {
    expect(calcularPrazo({ ...base, data: null }, em('2026-09-22T10:00:00'))).toBe('SEM_DATA');
  });

  it('com horário de fim, fica atrasada logo depois do fim', () => {
    const tarefa = { ...base, horarioFim: '10:30' };
    expect(calcularPrazo(tarefa, em('2026-09-22T10:29:00'))).toBe('NO_PRAZO');
    expect(calcularPrazo(tarefa, em('2026-09-22T10:30:00'))).toBe('ATRASADA');
  });

  it('sem horário de fim, só fica atrasada quando o dia termina', () => {
    expect(calcularPrazo(base, em('2026-09-22T23:59:00'))).toBe('NO_PRAZO');
    expect(calcularPrazo(base, em('2026-09-23T00:00:00'))).toBe('ATRASADA');
  });

  it('dia inteiro ignora o horário de fim', () => {
    const tarefa = { ...base, diaInteiro: true, horarioFim: '08:00' };
    expect(calcularPrazo(tarefa, em('2026-09-22T12:00:00'))).toBe('NO_PRAZO');
  });

  it('em andamento também atrasa', () => {
    expect(calcularPrazo({ ...base, situacao: 'EM_ANDAMENTO' }, em('2026-09-24T09:00:00'))).toBe('ATRASADA');
  });

  it('cancelada nunca conta como atrasada', () => {
    expect(calcularPrazo({ ...base, situacao: 'CANCELADA' }, em('2026-09-30T09:00:00'))).toBe('NO_PRAZO');
  });

  it('distingue concluída no prazo de concluída com atraso', () => {
    const concluida = { ...base, situacao: 'CONCLUIDA' as const, horarioFim: '18:00' };
    expect(calcularPrazo({ ...concluida, dataConclusao: '2026-09-22T17:00:00' }, em('2026-09-25T00:00:00'))).toBe(
      'CONCLUIDA_NO_PRAZO',
    );
    expect(calcularPrazo({ ...concluida, dataConclusao: '2026-09-22T19:00:00' }, em('2026-09-25T00:00:00'))).toBe(
      'CONCLUIDA_COM_ATRASO',
    );
  });
});

describe('marcarNaoRealizadas', () => {
  it('deixa só a ocorrência atrasada mais recente de cada série como atrasada', () => {
    const tarefas = [
      { id: 1, serieId: 7, data: '2026-09-20', horarioInicio: null, prazo: 'ATRASADA' as const },
      { id: 2, serieId: 7, data: '2026-09-21', horarioInicio: null, prazo: 'ATRASADA' as const },
      { id: 3, serieId: 7, data: '2026-09-23', horarioInicio: null, prazo: 'NO_PRAZO' as const },
      { id: 4, serieId: null, data: '2026-09-19', horarioInicio: null, prazo: 'ATRASADA' as const },
    ];

    const resultado = marcarNaoRealizadas(tarefas).map((tarefa) => [tarefa.id, tarefa.prazo]);

    expect(resultado).toEqual([
      [1, 'NAO_REALIZADA'],
      [2, 'ATRASADA'],
      [3, 'NO_PRAZO'],
      [4, 'ATRASADA'],
    ]);
  });
});

describe('precisaDeNovaData', () => {
  it('só vale para atrasadas de dias anteriores', () => {
    expect(precisaDeNovaData({ prazo: 'ATRASADA', data: '2026-09-23' }, '2026-09-24')).toBe(true);
    expect(precisaDeNovaData({ prazo: 'ATRASADA', data: '2026-09-24' }, '2026-09-24')).toBe(false);
  });

  it('ignora tarefas no prazo, não realizadas e sem data', () => {
    expect(precisaDeNovaData({ prazo: 'NO_PRAZO', data: '2026-09-20' }, '2026-09-24')).toBe(false);
    expect(precisaDeNovaData({ prazo: 'NAO_REALIZADA', data: '2026-09-20' }, '2026-09-24')).toBe(false);
    expect(precisaDeNovaData({ prazo: 'ATRASADA', data: null }, '2026-09-24')).toBe(false);
  });
});
