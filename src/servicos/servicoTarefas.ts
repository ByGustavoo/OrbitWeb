import { clienteHttp } from '@/api/clienteHttp';
import { rotasApi } from '@/api/rotasApi';
import type { PaginaDTO } from '@/modelos/comum';
import type { EscopoAlteracao, Situacao } from '@/modelos/enumeracoes';
import type { DiaCalendarioDTO, FiltrosTarefas, ReagendamentoDTO, TarefaDTO, TarefaEnvioDTO } from '@/modelos/tarefas';

const LIMITE_DIA = 100;

export const servicoTarefas = {
  buscarTarefas(filtros: FiltrosTarefas, signal?: AbortSignal): Promise<PaginaDTO<TarefaDTO>> {
    return clienteHttp.get<PaginaDTO<TarefaDTO>>(rotasApi.tarefas.lista, { consulta: { ...filtros }, signal });
  },

  async buscarTarefasPorData(data: string, signal?: AbortSignal): Promise<TarefaDTO[]> {
    const pagina = await servicoTarefas.buscarTarefas({ data, ordenacao: 'DATA', tamanho: LIMITE_DIA }, signal);
    return pagina.itens;
  },

  buscarTarefa(id: number, signal?: AbortSignal): Promise<TarefaDTO> {
    return clienteHttp.get<TarefaDTO>(rotasApi.tarefas.porId(id), { signal });
  },

  criarTarefa(dados: TarefaEnvioDTO, signal?: AbortSignal): Promise<TarefaDTO> {
    return clienteHttp.post<TarefaDTO>(rotasApi.tarefas.lista, dados, { signal });
  },

  atualizarTarefa(id: number, dados: TarefaEnvioDTO, escopo: EscopoAlteracao = 'SOMENTE_ESTA', signal?: AbortSignal): Promise<TarefaDTO> {
    return clienteHttp.put<TarefaDTO>(rotasApi.tarefas.porId(id), dados, { consulta: { escopo }, signal });
  },

  alterarSituacao(id: number, situacao: Situacao, signal?: AbortSignal): Promise<TarefaDTO> {
    return clienteHttp.patch<TarefaDTO>(rotasApi.tarefas.situacao(id), { situacao }, { signal });
  },

  concluirTarefa(id: number, signal?: AbortSignal): Promise<TarefaDTO> {
    return servicoTarefas.alterarSituacao(id, 'CONCLUIDA', signal);
  },

  reabrirTarefa(id: number, signal?: AbortSignal): Promise<TarefaDTO> {
    return servicoTarefas.alterarSituacao(id, 'PENDENTE', signal);
  },

  cancelarTarefa(id: number, signal?: AbortSignal): Promise<TarefaDTO> {
    return servicoTarefas.alterarSituacao(id, 'CANCELADA', signal);
  },

  excluirTarefa(id: number, escopo: EscopoAlteracao = 'SOMENTE_ESTA', signal?: AbortSignal): Promise<void> {
    return clienteHttp.delete<void>(rotasApi.tarefas.porId(id), { consulta: { escopo }, signal });
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
