import { clienteHttp } from '@/api/clienteHttp';
import { rotasApi } from '@/api/rotasApi';
import type { PaginaDTO } from '@/modelos/comum';
import type { Situacao } from '@/modelos/enumeracoes';
import type { DiaCalendarioDTO, FiltrosTarefas, ReagendamentoDTO, TarefaDTO } from '@/modelos/tarefas';

export const servicoTarefas = {
  buscarTarefas(filtros: FiltrosTarefas, signal?: AbortSignal): Promise<PaginaDTO<TarefaDTO>> {
    return clienteHttp.get<PaginaDTO<TarefaDTO>>(rotasApi.tarefas.lista, { consulta: { ...filtros }, signal });
  },

  alterarSituacao(id: number, situacao: Situacao, signal?: AbortSignal): Promise<TarefaDTO> {
    return clienteHttp.patch<TarefaDTO>(rotasApi.tarefas.situacao(id), { situacao }, { signal });
  },

  concluirTarefa(id: number, signal?: AbortSignal): Promise<TarefaDTO> {
    return servicoTarefas.alterarSituacao(id, 'CONCLUIDA', signal);
  },

  reagendarTarefas(reagendamento: ReagendamentoDTO, signal?: AbortSignal): Promise<TarefaDTO[]> {
    return clienteHttp.post<TarefaDTO[]>(rotasApi.tarefas.reagendamentos, reagendamento, { signal });
  },

  buscarResumoCalendario(
    periodo: { dataInicial: string; dataFinal: string },
    signal?: AbortSignal,
  ): Promise<DiaCalendarioDTO[]> {
    return clienteHttp.get<DiaCalendarioDTO[]>(rotasApi.tarefas.resumoCalendario, { consulta: { ...periodo }, signal });
  },
};
