import { clienteHttp } from '@/api/clienteHttp';
import { rotasApi } from '@/api/rotasApi';
import type { PaginaDTO } from '@/modelos/comum';
import type { FiltrosSessoes, MapaCalorDTO, ProgressoMetaDTO, ResumoEstudosDTO, SessaoEnvioDTO, SessaoEstudoDTO } from '@/modelos/estudos';

export const servicoSessoes = {
  buscarSessoes(filtros: FiltrosSessoes, signal?: AbortSignal): Promise<PaginaDTO<SessaoEstudoDTO>> {
    return clienteHttp.get<PaginaDTO<SessaoEstudoDTO>>(rotasApi.sessoes.lista, { consulta: { ...filtros }, signal });
  },

  criarSessao(dados: SessaoEnvioDTO, signal?: AbortSignal): Promise<SessaoEstudoDTO> {
    return clienteHttp.post<SessaoEstudoDTO>(rotasApi.sessoes.lista, dados, { signal });
  },

  atualizarSessao(id: number, dados: SessaoEnvioDTO, signal?: AbortSignal): Promise<SessaoEstudoDTO> {
    return clienteHttp.put<SessaoEstudoDTO>(rotasApi.sessoes.porId(id), dados, { signal });
  },

  excluirSessao(id: number, signal?: AbortSignal): Promise<void> {
    return clienteHttp.delete<void>(rotasApi.sessoes.porId(id), { signal });
  },

  buscarResumoEstudos(
    filtros: { dataInicial?: string; dataFinal?: string; atividadeId?: number },
    signal?: AbortSignal,
  ): Promise<ResumoEstudosDTO> {
    return clienteHttp.get<ResumoEstudosDTO>(rotasApi.estudos.resumo, { consulta: { ...filtros }, signal });
  },

  buscarMapaCalor(periodo: { dataInicial: string; dataFinal: string }, signal?: AbortSignal): Promise<MapaCalorDTO> {
    return clienteHttp.get<MapaCalorDTO>(rotasApi.estudos.mapaCalor, { consulta: { ...periodo }, signal });
  },

  buscarProgressoSemanal(inicioSemana: string, signal?: AbortSignal): Promise<ProgressoMetaDTO[]> {
    return clienteHttp.get<ProgressoMetaDTO[]>(rotasApi.estudos.progressoSemanal, { consulta: { inicioSemana }, signal });
  },
};
