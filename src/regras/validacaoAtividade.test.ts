import { describe, expect, it } from 'vitest';
import { normalizarNomeAtividade, validarAtividade } from './validacaoAtividade';

const existentes = [
  { id: 1, nome: 'Inglês', arquivada: false },
  { id: 2, nome: 'Violão', arquivada: true },
];

describe('validarAtividade', () => {
  it('exige um nome', () => {
    expect(validarAtividade({ nome: '   ', cor: 'AZUL', metaSemanalMinutos: null }, existentes, null).nome).toBe(
      'Informe um nome para a atividade.',
    );
  });

  it('não aceita nome repetido, sem diferenciar maiúsculas nem espaços extras', () => {
    const erros = validarAtividade({ nome: '  inglês ', cor: 'AZUL', metaSemanalMinutos: null }, existentes, null);
    expect(erros.nome).toBe('Já existe uma atividade chamada “Inglês”. Escolha outro nome.');
  });

  it('permite manter o próprio nome ao editar', () => {
    expect(validarAtividade({ nome: 'Inglês', cor: 'AZUL', metaSemanalMinutos: 300 }, existentes, 1)).toEqual({});
  });

  it('permite repetir o nome de uma atividade arquivada', () => {
    expect(validarAtividade({ nome: 'Violão', cor: 'ROXO', metaSemanalMinutos: null }, existentes, null)).toEqual({});
  });

  it('limita o tamanho do nome e da meta', () => {
    const erros = validarAtividade({ nome: 'a'.repeat(41), cor: 'AZUL', metaSemanalMinutos: 101 * 60 }, existentes, null);
    expect(erros.nome).toContain('no máximo 40 caracteres');
    expect(erros.metaSemanalMinutos).toContain('no máximo 100 horas');
  });

  it('recusa meta zerada', () => {
    expect(validarAtividade({ nome: 'Leitura', cor: 'AZUL', metaSemanalMinutos: 0 }, existentes, null).metaSemanalMinutos).toBeDefined();
  });

  it('junta espaços repetidos no nome', () => {
    expect(normalizarNomeAtividade('  Aulas   de  canto ')).toBe('Aulas de canto');
  });
});
