import { describe, expect, it } from 'vitest';
import { normalizarNomeCategoria, validarCategoria } from './validacaoCategoria';

const existentes = [
  { id: 1, nome: 'Saúde' },
  { id: 2, nome: 'Casa e família' },
];

describe('validarCategoria', () => {
  it('exige um nome', () => {
    expect(validarCategoria({ nome: '   ', cor: 'AZUL' }, existentes, null).nome).toBe('Informe um nome para a categoria.');
  });

  it('não aceita nome repetido, sem diferenciar maiúsculas nem espaços extras', () => {
    expect(validarCategoria({ nome: '  casa   e FAMÍLIA ', cor: 'VERDE' }, existentes, null).nome).toBe(
      'Já existe uma categoria chamada “Casa e família”. Escolha outro nome.',
    );
  });

  it('permite manter o próprio nome ao editar', () => {
    expect(validarCategoria({ nome: 'saúde', cor: 'ROSA' }, existentes, 1)).toEqual({});
  });

  it('limita o nome a 40 caracteres', () => {
    expect(validarCategoria({ nome: 'a'.repeat(41), cor: 'AZUL' }, existentes, null).nome).toBe(
      'Use no máximo 40 caracteres no nome. Agora são 41.',
    );
  });

  it('exige uma cor da paleta', () => {
    expect(validarCategoria({ nome: 'Viagens', cor: 'DOURADO' as never }, existentes, null).cor).toBe('Escolha uma das cores da lista.');
  });
});

describe('normalizarNomeCategoria', () => {
  it('reduz espaços extras', () => {
    expect(normalizarNomeCategoria('  Contas   da  casa ')).toBe('Contas da casa');
  });
});
