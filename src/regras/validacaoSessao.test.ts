import { describe, expect, it } from 'vitest';
import type { SessaoEnvioDTO } from '@/modelos/estudos';
import { validarSessao } from './validacaoSessao';

const agora = new Date('2026-09-24T18:00:00.000Z');

function sessao(parcial: Partial<SessaoEnvioDTO> = {}): SessaoEnvioDTO {
  return {
    atividadeId: 1,
    tarefaId: null,
    modo: 'LIVRE',
    origem: 'MANUAL',
    inicio: '2026-09-24T16:00:00.000Z',
    fim: '2026-09-24T16:45:00.000Z',
    duracaoSegundos: 45 * 60,
    ciclosConcluidos: null,
    observacao: null,
    ...parcial,
  };
}

describe('validarSessao', () => {
  it('aceita uma sessão completa', () => {
    expect(validarSessao(sessao(), agora)).toEqual({});
  });

  it('exige atividade', () => {
    expect(validarSessao(sessao({ atividadeId: 0 }), agora).atividadeId).toBeDefined();
  });

  it('não salva sessão com menos de 1 minuto', () => {
    expect(validarSessao(sessao({ duracaoSegundos: 59, fim: '2026-09-24T16:00:59.000Z' }), agora).duracaoSegundos).toBe(
      'A sessão precisa ter pelo menos 1 minuto.',
    );
  });

  it('aceita duração menor que o intervalo, porque as pausas não contam', () => {
    expect(validarSessao(sessao({ duracaoSegundos: 20 * 60 }), agora)).toEqual({});
  });

  it('recusa duração maior que o intervalo entre início e fim', () => {
    expect(validarSessao(sessao({ duracaoSegundos: 50 * 60 }), agora).duracaoSegundos).toContain('não pode passar');
  });

  it('recusa sessão que termina no futuro', () => {
    const erros = validarSessao(sessao({ inicio: '2026-09-24T17:30:00.000Z', fim: '2026-09-24T18:30:00.000Z', duracaoSegundos: 3600 }), agora);
    expect(erros.duracaoSegundos).toContain('depois de agora');
  });

  it('limita a observação', () => {
    expect(validarSessao(sessao({ observacao: 'a'.repeat(501) }), agora).observacao).toContain('no máximo 500');
  });
});
