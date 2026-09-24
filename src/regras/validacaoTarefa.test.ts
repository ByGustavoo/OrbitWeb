import { describe, expect, it } from 'vitest';
import type { TarefaEnvioDTO } from '@/modelos/tarefas';
import { normalizarTarefa, primeiroCampoComErro, validarTarefa } from './validacaoTarefa';

const base: TarefaEnvioDTO = {
  titulo: 'Pagar a conta de luz',
  descricao: null,
  data: '2026-09-24',
  diaInteiro: false,
  horarioInicio: '08:00',
  horarioFim: '09:30',
  prioridade: 'ALTA',
  situacao: 'PENDENTE',
  categoriaId: null,
  atividadeId: null,
  lembreteMinutosAntes: null,
  recorrencia: null,
};

describe('validarTarefa', () => {
  it('aceita uma tarefa completa', () => {
    expect(validarTarefa(base)).toEqual({});
  });

  it('exige título', () => {
    expect(validarTarefa({ ...base, titulo: '   ' }).titulo).toBe('Informe um título para a tarefa.');
  });

  it('exige que o fim seja depois do início', () => {
    expect(validarTarefa({ ...base, horarioFim: '08:00' }).horarioFim).toBe('O fim precisa ser depois do início (08:00).');
    expect(validarTarefa({ ...base, horarioInicio: null }).horarioFim).toBe('Informe o horário de início antes do fim.');
  });

  it('recusa formatos inválidos de data e horário', () => {
    expect(validarTarefa({ ...base, data: '2026-02-30' }).data).toBe('Informe uma data válida.');
    expect(validarTarefa({ ...base, horarioInicio: '25:00', horarioFim: null }).horarioInicio).toBe(
      'Informe um horário válido, como 08:30.',
    );
  });

  it('recusa valores fora das enumerações', () => {
    const erros = validarTarefa({ ...base, prioridade: 'MAXIMA' as never, situacao: 'ATRASADA' as never });
    expect(erros.prioridade).toBeDefined();
    expect(erros.situacao).toBeDefined();
  });

  it('valida a recorrência', () => {
    const semDias = validarTarefa({ ...base, recorrencia: { frequencia: 'DIAS_DA_SEMANA', diasSemana: [], dataFim: null } });
    expect(semDias.diasSemana).toBe('Escolha pelo menos um dia da semana.');
    const terminoAntes = validarTarefa({ ...base, recorrencia: { frequencia: 'DIARIA', diasSemana: null, dataFim: '2026-09-20' } });
    expect(terminoAntes.dataFim).toBe('O término precisa ser a partir da primeira ocorrência (24/09/2026).');
    const semData = validarTarefa({
      ...base,
      data: null,
      horarioInicio: null,
      horarioFim: null,
      recorrencia: { frequencia: 'DIARIA', diasSemana: null, dataFim: null },
    });
    expect(semData.frequencia).toBe('Escolha a data da primeira ocorrência para repetir a tarefa.');
  });

  it('aponta o primeiro campo com erro na ordem do formulário', () => {
    expect(primeiroCampoComErro({ horarioFim: 'x', titulo: 'y' })).toBe('titulo');
  });
});

describe('normalizarTarefa', () => {
  it('sem data, descarta horários, lembrete e recorrência', () => {
    const normalizada = normalizarTarefa({
      ...base,
      data: null,
      lembreteMinutosAntes: 15,
      recorrencia: { frequencia: 'DIARIA', diasSemana: null, dataFim: null },
    });
    expect(normalizada).toMatchObject({
      horarioInicio: null,
      horarioFim: null,
      lembreteMinutosAntes: null,
      recorrencia: null,
      diaInteiro: false,
    });
  });

  it('sem horário de início, a tarefa vale para o dia inteiro', () => {
    expect(normalizarTarefa({ ...base, horarioInicio: null, horarioFim: null }).diaInteiro).toBe(true);
  });

  it('limpa espaços e descrição vazia', () => {
    const normalizada = normalizarTarefa({ ...base, titulo: '  Ler  ', descricao: '   ' });
    expect(normalizada.titulo).toBe('Ler');
    expect(normalizada.descricao).toBeNull();
  });
});
