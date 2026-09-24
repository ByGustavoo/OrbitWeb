import { CORES } from '@/modelos/enumeracoes';
import type { AtividadeEnvioDTO } from '@/modelos/estudos';
import { formatarNumero } from '@/utilitarios/formatacao';

export const LIMITE_NOME_ATIVIDADE = 40;
export const LIMITE_META_SEMANAL_MINUTOS = 100 * 60;

export type CampoAtividade = 'nome' | 'cor' | 'metaSemanalMinutos';

export type ErrosAtividade = Partial<Record<CampoAtividade, string>>;

export const ORDEM_CAMPOS_ATIVIDADE: CampoAtividade[] = ['nome', 'cor', 'metaSemanalMinutos'];

export interface AtividadeExistente {
  id: number;
  nome: string;
  arquivada: boolean;
}

export function normalizarNomeAtividade(nome: string): string {
  return nome.trim().replace(/\s+/g, ' ');
}

export function chaveNomeAtividade(nome: string): string {
  return normalizarNomeAtividade(nome).toLocaleLowerCase('pt-BR');
}

export function normalizarAtividade(dados: AtividadeEnvioDTO): AtividadeEnvioDTO {
  return { ...dados, nome: normalizarNomeAtividade(dados.nome) };
}

export function buscarNomeRepetido(nome: string, existentes: AtividadeExistente[], idAtual: number | null): AtividadeExistente | null {
  const chave = chaveNomeAtividade(nome);
  return existentes.find((atividade) => atividade.id !== idAtual && !atividade.arquivada && chaveNomeAtividade(atividade.nome) === chave) ?? null;
}

export function validarAtividade(dados: AtividadeEnvioDTO, existentes: AtividadeExistente[], idAtual: number | null): ErrosAtividade {
  const erros: ErrosAtividade = {};
  const nome = normalizarNomeAtividade(dados.nome);

  if (!nome) erros.nome = 'Informe um nome para a atividade.';
  else if (nome.length > LIMITE_NOME_ATIVIDADE) {
    erros.nome = `Use no máximo ${LIMITE_NOME_ATIVIDADE} caracteres no nome. Agora são ${formatarNumero(nome.length)}.`;
  } else {
    const repetida = buscarNomeRepetido(nome, existentes, idAtual);
    if (repetida) erros.nome = `Já existe uma atividade chamada “${repetida.nome}”. Escolha outro nome.`;
  }

  if (!CORES.includes(dados.cor)) erros.cor = 'Escolha uma das cores da lista.';

  const meta = dados.metaSemanalMinutos;
  if (meta !== null) {
    if (!Number.isFinite(meta) || meta <= 0) erros.metaSemanalMinutos = 'Informe uma meta maior que zero ou deixe o campo vazio.';
    else if (meta > LIMITE_META_SEMANAL_MINUTOS) {
      erros.metaSemanalMinutos = `A meta pode ter no máximo ${formatarNumero(LIMITE_META_SEMANAL_MINUTOS / 60)} horas por semana.`;
    }
  }

  return erros;
}

export function primeiroCampoComErroAtividade(erros: ErrosAtividade): CampoAtividade | null {
  return ORDEM_CAMPOS_ATIVIDADE.find((campo) => erros[campo]) ?? null;
}
