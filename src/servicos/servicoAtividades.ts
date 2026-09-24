import { clienteHttp } from '@/api/clienteHttp';
import { rotasApi } from '@/api/rotasApi';
import type { AtividadeEnvioDTO, AtividadeEstudoDTO } from '@/modelos/estudos';

export const servicoAtividades = {
  buscarAtividades(signal?: AbortSignal): Promise<AtividadeEstudoDTO[]> {
    return clienteHttp.get<AtividadeEstudoDTO[]>(rotasApi.atividades.lista, { signal });
  },

  criarAtividade(dados: AtividadeEnvioDTO, signal?: AbortSignal): Promise<AtividadeEstudoDTO> {
    return clienteHttp.post<AtividadeEstudoDTO>(rotasApi.atividades.lista, dados, { signal });
  },

  atualizarAtividade(id: number, dados: AtividadeEnvioDTO, signal?: AbortSignal): Promise<AtividadeEstudoDTO> {
    return clienteHttp.put<AtividadeEstudoDTO>(rotasApi.atividades.porId(id), dados, { signal });
  },

  arquivarAtividade(id: number, signal?: AbortSignal): Promise<AtividadeEstudoDTO> {
    return clienteHttp.patch<AtividadeEstudoDTO>(rotasApi.atividades.arquivamento(id), { arquivada: true }, { signal });
  },

  desarquivarAtividade(id: number, signal?: AbortSignal): Promise<AtividadeEstudoDTO> {
    return clienteHttp.patch<AtividadeEstudoDTO>(rotasApi.atividades.arquivamento(id), { arquivada: false }, { signal });
  },

  excluirAtividade(id: number, signal?: AbortSignal): Promise<void> {
    return clienteHttp.delete<void>(rotasApi.atividades.porId(id), { signal });
  },
};
