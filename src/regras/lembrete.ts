import type { TarefaDTO } from '@/modelos/tarefas';
import { deDataIso } from '@/utilitarios/datas';

export const TOLERANCIA_LEMBRETE_MS = 10 * 60000;

type DadosLembrete = Pick<TarefaDTO, 'data' | 'diaInteiro' | 'horarioInicio' | 'lembreteMinutosAntes' | 'situacao'>;

export function inicioDaTarefa(tarefa: Pick<TarefaDTO, 'data' | 'diaInteiro' | 'horarioInicio'>): Date | null {
  if (!tarefa.data || tarefa.diaInteiro || !tarefa.horarioInicio) return null;
  const dia = deDataIso(tarefa.data);
  const [horas = 0, minutos = 0] = tarefa.horarioInicio.split(':').map(Number);
  return new Date(dia.getFullYear(), dia.getMonth(), dia.getDate(), horas, minutos);
}

export function momentoDoLembrete(tarefa: DadosLembrete): Date | null {
  const inicio = inicioDaTarefa(tarefa);
  if (!inicio || tarefa.lembreteMinutosAntes === null) return null;
  return new Date(inicio.getTime() - tarefa.lembreteMinutosAntes * 60000);
}

export function lembreteDevido(tarefa: DadosLembrete, agora: Date): boolean {
  if (tarefa.situacao !== 'PENDENTE' && tarefa.situacao !== 'EM_ANDAMENTO') return false;
  const momento = momentoDoLembrete(tarefa);
  if (!momento) return false;
  const passou = agora.getTime() - momento.getTime();
  return passou >= 0 && passou < TOLERANCIA_LEMBRETE_MS;
}

export function chaveDoLembrete(tarefa: Pick<TarefaDTO, 'id' | 'data' | 'horarioInicio' | 'lembreteMinutosAntes'>): string {
  return `${tarefa.id}@${tarefa.data}T${tarefa.horarioInicio}-${tarefa.lembreteMinutosAntes}`;
}
