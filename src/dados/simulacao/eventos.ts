import type { TipoEventoTarefa } from '@/modelos/enumeracoes';
import { gerarId } from './bancoSimulado';
import type { BancoSimulado, TarefaArmazenada } from './bancoSimulado';

export interface AlteracaoEvento {
  anterior: string | null;
  novo: string | null;
}

export function registrarEvento(
  banco: BancoSimulado,
  tarefa: TarefaArmazenada,
  tipo: TipoEventoTarefa,
  agora: Date,
  alteracao: AlteracaoEvento = { anterior: null, novo: null },
): void {
  banco.eventos.push({
    id: gerarId(),
    tipo,
    tarefaId: tarefa.id,
    titulo: tarefa.titulo,
    ocorridoEm: agora.toISOString(),
    anterior: alteracao.anterior,
    novo: alteracao.novo,
  });
}

export interface EstadoAntesDaEdicao {
  prioridade: TarefaArmazenada['prioridade'];
  data: TarefaArmazenada['data'];
}

export function registrarMudancasRelevantes(
  banco: BancoSimulado,
  tarefa: TarefaArmazenada,
  antes: EstadoAntesDaEdicao,
  agora: Date,
): void {
  if (antes.prioridade !== tarefa.prioridade) {
    registrarEvento(banco, tarefa, 'PRIORIDADE_ALTERADA', agora, { anterior: antes.prioridade, novo: tarefa.prioridade });
  }
  if (antes.data !== tarefa.data) {
    registrarEvento(banco, tarefa, 'DATA_ALTERADA', agora, { anterior: antes.data, novo: tarefa.data });
  }
}

export function removerEventosDasTarefas(banco: BancoSimulado, ids: ReadonlySet<number>): void {
  banco.eventos = banco.eventos.filter((evento) => !ids.has(evento.tarefaId));
}
