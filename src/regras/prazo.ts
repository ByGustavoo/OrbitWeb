import type { Prazo, Situacao } from '@/modelos/enumeracoes';
import { adicionarDias, deDataIso } from '@/utilitarios/datas';

export interface DadosPrazo {
  data: string | null;
  diaInteiro: boolean;
  horarioFim: string | null;
  situacao: Situacao;
  dataConclusao: string | null;
}

export function limiteDaTarefa(tarefa: Pick<DadosPrazo, 'data' | 'diaInteiro' | 'horarioFim'>): Date | null {
  if (!tarefa.data) return null;
  const dia = deDataIso(tarefa.data);
  if (tarefa.diaInteiro || !tarefa.horarioFim) return adicionarDias(dia, 1);
  const [horas = 0, minutos = 0] = tarefa.horarioFim.split(':').map(Number);
  return new Date(dia.getFullYear(), dia.getMonth(), dia.getDate(), horas, minutos);
}

export function calcularPrazo(tarefa: DadosPrazo, agora: Date): Prazo {
  const limite = limiteDaTarefa(tarefa);

  if (tarefa.situacao === 'CONCLUIDA') {
    if (!limite || !tarefa.dataConclusao) return 'CONCLUIDA_NO_PRAZO';
    return new Date(tarefa.dataConclusao).getTime() > limite.getTime() ? 'CONCLUIDA_COM_ATRASO' : 'CONCLUIDA_NO_PRAZO';
  }

  if (!limite) return 'SEM_DATA';
  if (tarefa.situacao === 'CANCELADA') return 'NO_PRAZO';
  return agora.getTime() >= limite.getTime() ? 'ATRASADA' : 'NO_PRAZO';
}

export interface TarefaComSerie {
  serieId: number | null;
  data: string | null;
  horarioInicio: string | null;
  prazo: Prazo;
}

function chaveOrdenacao(tarefa: TarefaComSerie): string {
  return `${tarefa.data ?? ''}T${tarefa.horarioInicio ?? '00:00'}`;
}

export function marcarNaoRealizadas<T extends TarefaComSerie>(tarefas: T[]): T[] {
  const maisRecentePorSerie = new Map<number, T>();

  for (const tarefa of tarefas) {
    if (tarefa.prazo !== 'ATRASADA' || tarefa.serieId === null) continue;
    const atual = maisRecentePorSerie.get(tarefa.serieId);
    if (!atual || chaveOrdenacao(tarefa) > chaveOrdenacao(atual)) maisRecentePorSerie.set(tarefa.serieId, tarefa);
  }

  return tarefas.map((tarefa) =>
    tarefa.prazo === 'ATRASADA' && tarefa.serieId !== null && maisRecentePorSerie.get(tarefa.serieId) !== tarefa
      ? { ...tarefa, prazo: 'NAO_REALIZADA' }
      : tarefa,
  );
}
