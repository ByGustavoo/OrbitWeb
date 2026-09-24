import type { ValorConsulta } from '@/api/transporte';
import type { Prioridade } from '@/modelos/enumeracoes';
import type { TarefaDTO } from '@/modelos/tarefas';
import { calcularPrazo, marcarNaoRealizadas } from '@/regras/prazo';
import { dataIsoLocal } from '@/utilitarios/datas';
import type { BancoSimulado, SessaoArmazenada } from './bancoSimulado';

export const PESO_PRIORIDADE: Record<Prioridade, number> = { BAIXA: 0, MEDIA: 1, ALTA: 2, URGENTE: 3 };

export function tarefasComPrazo(banco: BancoSimulado, agora: Date): TarefaDTO[] {
  return marcarNaoRealizadas(banco.tarefas.map((tarefa) => ({ ...tarefa, prazo: calcularPrazo(tarefa, agora) })));
}

export function diaDoInstante(instante: string): string {
  return dataIsoLocal(new Date(instante));
}

export function minutosDaSessao(sessao: SessaoArmazenada): number {
  return Math.round(sessao.duracaoSegundos / 60);
}

export function emAberto(tarefa: TarefaDTO): boolean {
  return tarefa.situacao === 'PENDENTE' || tarefa.situacao === 'EM_ANDAMENTO';
}

export function texto(consulta: Record<string, ValorConsulta>, chave: string): string | undefined {
  const valor = consulta[chave];
  if (valor === undefined || valor === null || valor === '') return undefined;
  return Array.isArray(valor) ? String(valor[0]) : String(valor);
}

export function lista(consulta: Record<string, ValorConsulta>, chave: string): string[] {
  const valor = consulta[chave];
  if (valor === undefined || valor === null || valor === '') return [];
  return Array.isArray(valor) ? valor.map(String) : String(valor).split(',');
}

export function numero(consulta: Record<string, ValorConsulta>, chave: string, padrao: number): number {
  const valor = Number(texto(consulta, chave));
  return Number.isFinite(valor) ? valor : padrao;
}
