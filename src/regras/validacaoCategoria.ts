import type { CategoriaEnvioDTO } from '@/modelos/comum';
import { CORES } from '@/modelos/enumeracoes';
import { formatarNumero } from '@/utilitarios/formatacao';

export const LIMITE_NOME_CATEGORIA = 40;

export type CampoCategoria = 'nome' | 'cor';

export type ErrosCategoria = Partial<Record<CampoCategoria, string>>;

export const ORDEM_CAMPOS_CATEGORIA: CampoCategoria[] = ['nome', 'cor'];

export interface CategoriaExistente {
  id: number;
  nome: string;
}

export function normalizarNomeCategoria(nome: string): string {
  return nome.trim().replace(/\s+/g, ' ');
}

function chaveNomeCategoria(nome: string): string {
  return normalizarNomeCategoria(nome).toLocaleLowerCase('pt-BR');
}

export function normalizarCategoria(dados: CategoriaEnvioDTO): CategoriaEnvioDTO {
  return { ...dados, nome: normalizarNomeCategoria(dados.nome) };
}

export function buscarCategoriaComMesmoNome(
  nome: string,
  existentes: CategoriaExistente[],
  idAtual: number | null,
): CategoriaExistente | null {
  const chave = chaveNomeCategoria(nome);
  return existentes.find((categoria) => categoria.id !== idAtual && chaveNomeCategoria(categoria.nome) === chave) ?? null;
}

export function validarCategoria(dados: CategoriaEnvioDTO, existentes: CategoriaExistente[], idAtual: number | null): ErrosCategoria {
  const erros: ErrosCategoria = {};
  const nome = normalizarNomeCategoria(dados.nome);

  if (!nome) erros.nome = 'Informe um nome para a categoria.';
  else if (nome.length > LIMITE_NOME_CATEGORIA) {
    erros.nome = `Use no máximo ${LIMITE_NOME_CATEGORIA} caracteres no nome. Agora são ${formatarNumero(nome.length)}.`;
  } else {
    const repetida = buscarCategoriaComMesmoNome(nome, existentes, idAtual);
    if (repetida) erros.nome = `Já existe uma categoria chamada “${repetida.nome}”. Escolha outro nome.`;
  }

  if (!CORES.includes(dados.cor)) erros.cor = 'Escolha uma das cores da lista.';

  return erros;
}

export function primeiroCampoComErroCategoria(erros: ErrosCategoria): CampoCategoria | null {
  return ORDEM_CAMPOS_CATEGORIA.find((campo) => erros[campo]) ?? null;
}
