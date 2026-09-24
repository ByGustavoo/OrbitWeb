import { describe, expect, it } from 'vitest';
import type { RevisaoSemanalDTO, ResumoSemanaDTO } from '@/modelos/revisao';
import {
  compararComSemanaAnterior,
  compararTaxas,
  inicioDaSemanaIso,
  lerSemana,
  montarDestaques,
  montarPontosDeAtencao,
  semanaSemRegistros,
} from './revisaoSemanal';

const resumoVazio: ResumoSemanaDTO = {
  concluidas: 0,
  criadas: 0,
  atrasadas: 0,
  planejadas: 0,
  planejadasConcluidas: 0,
  taxaConclusao: null,
  minutosEstudo: 0,
  sessoes: 0,
  diasComAtividade: 0,
};

function revisao(parcial: Partial<RevisaoSemanalDTO> = {}): RevisaoSemanalDTO {
  return {
    inicioSemana: '2026-09-13',
    fimSemana: '2026-09-19',
    emAndamento: false,
    diasDecorridos: 7,
    resumo: resumoVazio,
    semanaAnterior: resumoVazio,
    porDia: [],
    estudos: { minutos: 0, sessoes: 0, porAtividade: [], metas: [] },
    tarefas: {
      planejadas: 0,
      concluidas: 0,
      concluidasComAtraso: 0,
      emAberto: 0,
      atrasadas: 0,
      naoRealizadas: 0,
      canceladas: 0,
      pendentes: [],
      importantesPendentes: 0,
    },
    proximaSemana: { inicioSemana: '2026-09-20', fimSemana: '2026-09-26', agendadas: 0, altaPrioridade: 0, atrasadasEmAberto: 0, tarefas: [] },
    nota: null,
    ...parcial,
  };
}

const atividade = { id: 1, nome: 'Inglês', cor: 'AZUL' as const };

describe('lerSemana', () => {
  it('leva qualquer dia para o domingo da semana', () => {
    expect(inicioDaSemanaIso('2026-09-24')).toBe('2026-09-20');
    expect(lerSemana('2026-09-16', '2026-09-24')).toBe('2026-09-13');
  });

  it('usa a semana atual quando o valor falta, é inválido ou está no futuro', () => {
    expect(lerSemana(null, '2026-09-24')).toBe('2026-09-20');
    expect(lerSemana('2026-02-31', '2026-09-24')).toBe('2026-09-20');
    expect(lerSemana('2026-10-04', '2026-09-24')).toBe('2026-09-20');
  });
});

describe('comparações com a semana anterior', () => {
  it('descreve a diferença sem julgamento', () => {
    expect(compararComSemanaAnterior(8, 5, String)).toBe('3 a mais que na semana anterior');
    expect(compararComSemanaAnterior(2, 5, String)).toBe('3 a menos que na semana anterior');
    expect(compararComSemanaAnterior(4, 4, String)).toBe('Igual à semana anterior');
  });

  it('compara taxas em pontos percentuais', () => {
    expect(compararTaxas(0.8, 0.5)).toBe('30 pontos a mais que na semana anterior');
    expect(compararTaxas(0.5, 0.5)).toBe('Igual à semana anterior');
    expect(compararTaxas(0.5, null)).toBe('Sem tarefas planejadas na semana anterior');
    expect(compararTaxas(null, 0.75)).toBe('Semana anterior: 75%');
  });
});

describe('semanaSemRegistros', () => {
  it('reconhece uma semana sem nada', () => {
    expect(semanaSemRegistros(revisao())).toBe(true);
  });

  it('uma sessão já basta para não ser vazia', () => {
    expect(semanaSemRegistros(revisao({ resumo: { ...resumoVazio, sessoes: 1, minutosEstudo: 30 } }))).toBe(false);
  });
});

describe('montarDestaques', () => {
  it('só lista números maiores que zero', () => {
    expect(montarDestaques(revisao())).toEqual([]);
  });

  it('descreve concluídas, estudo, metas e dias', () => {
    const destaques = montarDestaques(
      revisao({
        resumo: { ...resumoVazio, concluidas: 18, minutosEstudo: 395, sessoes: 9, diasComAtividade: 5 },
        estudos: {
          minutos: 395,
          sessoes: 9,
          porAtividade: [],
          metas: [{ atividade, metaMinutos: 120, minutosRealizados: 130 }],
        },
      }),
    ).map((fato) => fato.texto);
    expect(destaques).toEqual([
      '18 tarefas concluídas',
      '6h 35min de estudo em 9 sessões',
      '1 meta de estudo atingida',
      '5 dias com atividades registradas',
    ]);
  });
});

describe('montarPontosDeAtencao', () => {
  it('não inventa pontos numa semana sem pendências', () => {
    expect(montarPontosDeAtencao(revisao({ resumo: { ...resumoVazio, diasComAtividade: 7 } }))).toEqual([]);
  });

  it('usa frases factuais, no singular e no plural', () => {
    const pontos = montarPontosDeAtencao(
      revisao({
        resumo: { ...resumoVazio, diasComAtividade: 5 },
        tarefas: { ...revisao().tarefas, atrasadas: 3, importantesPendentes: 1, naoRealizadas: 2, concluidasComAtraso: 1 },
        estudos: { minutos: 0, sessoes: 0, porAtividade: [], metas: [{ atividade, metaMinutos: 120, minutosRealizados: 30 }] },
      }),
    ).map((fato) => fato.texto);
    expect(pontos).toEqual([
      '3 tarefas planejadas para a semana estão atrasadas.',
      '1 tarefa de prioridade alta ou urgente continua em aberto.',
      '2 ocorrências de tarefas recorrentes não foram realizadas.',
      '1 tarefa foi concluída depois do prazo.',
      'Atividades registradas em 5 dos 7 dias.',
      '1 meta de estudo não foi atingida.',
    ]);
  });

  it('na semana em andamento, conta só os dias até hoje e não fala de metas', () => {
    const pontos = montarPontosDeAtencao(
      revisao({
        emAndamento: true,
        diasDecorridos: 5,
        resumo: { ...resumoVazio, diasComAtividade: 4 },
        estudos: { minutos: 0, sessoes: 0, porAtividade: [], metas: [{ atividade, metaMinutos: 120, minutosRealizados: 30 }] },
      }),
    ).map((fato) => fato.texto);
    expect(pontos).toEqual(['Atividades registradas em 4 dos 5 dias até hoje.']);
  });
});
