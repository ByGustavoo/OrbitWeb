import { describe, expect, it } from 'vitest';
import type { RecorrenciaDTO } from '@/modelos/tarefas';
import { descreverRecorrencia, gerarDatasOcorrencias, mesmaRecorrencia } from './recorrencia';

const regra = (parcial: Partial<RecorrenciaDTO>): RecorrenciaDTO => ({
  frequencia: 'DIARIA',
  diasSemana: null,
  dataFim: null,
  ...parcial,
});

describe('gerarDatasOcorrencias', () => {
  it('gera um dia após o outro na diária, respeitando o término', () => {
    const datas = gerarDatasOcorrencias(regra({ dataFim: '2026-09-25' }), '2026-09-22', '2026-09-01', '2026-12-31');
    expect(datas).toEqual(['2026-09-22', '2026-09-23', '2026-09-24', '2026-09-25']);
  });

  it('em dias da semana, a primeira ocorrência é sempre a data inicial', () => {
    const datas = gerarDatasOcorrencias(
      regra({ frequencia: 'DIAS_DA_SEMANA', diasSemana: ['SEGUNDA', 'SEXTA'] }),
      '2026-09-24',
      '2026-09-24',
      '2026-10-02',
    );
    expect(datas).toEqual(['2026-09-24', '2026-09-25', '2026-09-28', '2026-10-02']);
  });

  it('na semanal repete no mesmo dia da semana', () => {
    const datas = gerarDatasOcorrencias(regra({ frequencia: 'SEMANAL' }), '2026-09-24', '2026-09-24', '2026-10-15');
    expect(datas).toEqual(['2026-09-24', '2026-10-01', '2026-10-08', '2026-10-15']);
  });

  it('na mensal, o dia 31 cai no último dia dos meses mais curtos sem perder o dia original', () => {
    const datas = gerarDatasOcorrencias(regra({ frequencia: 'MENSAL' }), '2026-08-31', '2026-08-01', '2026-12-31');
    expect(datas).toEqual(['2026-08-31', '2026-09-30', '2026-10-31', '2026-11-30', '2026-12-31']);
  });

  it('na anual, 29 de fevereiro cai em 28 nos anos não bissextos', () => {
    const datas = gerarDatasOcorrencias(regra({ frequencia: 'ANUAL' }), '2028-02-29', '2028-01-01', '2030-12-31');
    expect(datas).toEqual(['2028-02-29', '2029-02-28', '2030-02-28']);
  });

  it('só devolve as datas dentro do intervalo pedido', () => {
    const datas = gerarDatasOcorrencias(regra({ frequencia: 'SEMANAL' }), '2026-09-03', '2026-09-20', '2026-10-05');
    expect(datas).toEqual(['2026-09-24', '2026-10-01']);
  });
});

describe('descreverRecorrencia', () => {
  it('descreve dias da semana com o artigo certo', () => {
    expect(descreverRecorrencia(regra({ frequencia: 'DIAS_DA_SEMANA', diasSemana: ['SEXTA', 'SEGUNDA', 'QUARTA'] }), '2026-09-21')).toBe(
      'Às segundas, quartas e sextas',
    );
    expect(descreverRecorrencia(regra({ frequencia: 'DIAS_DA_SEMANA', diasSemana: ['TERCA', 'SABADO'] }), '2026-09-22')).toBe(
      'Às terças e aos sábados',
    );
    expect(
      descreverRecorrencia(regra({ frequencia: 'DIAS_DA_SEMANA', diasSemana: ['SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA'] }), '2026-09-21'),
    ).toBe('De segunda a sexta');
  });

  it('inclui o término quando existe', () => {
    expect(descreverRecorrencia(regra({ frequencia: 'SEMANAL', dataFim: '2026-11-30' }), '2026-09-24')).toBe(
      'Toda semana, às quintas, até 30 de novembro de 2026',
    );
    expect(descreverRecorrencia(regra({ frequencia: 'MENSAL' }), '2026-08-31')).toBe(
      'Todo mês, no dia 31 (ou no último dia, nos meses mais curtos)',
    );
    expect(descreverRecorrencia(regra({ frequencia: 'ANUAL' }), '2026-09-24')).toBe('Todo ano, em 24 de setembro');
  });
});

describe('mesmaRecorrencia', () => {
  it('ignora a ordem dos dias da semana', () => {
    const a = regra({ frequencia: 'DIAS_DA_SEMANA', diasSemana: ['SEXTA', 'SEGUNDA'] });
    const b = regra({ frequencia: 'DIAS_DA_SEMANA', diasSemana: ['SEGUNDA', 'SEXTA'] });
    expect(mesmaRecorrencia(a, b)).toBe(true);
    expect(mesmaRecorrencia(a, { ...b, dataFim: '2026-12-31' })).toBe(false);
    expect(mesmaRecorrencia(a, null)).toBe(false);
  });
});
