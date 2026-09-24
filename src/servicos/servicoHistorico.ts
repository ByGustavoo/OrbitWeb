import { clienteHttp } from '@/api/clienteHttp';
import { rotasApi } from '@/api/rotasApi';
import type { PaginaDTO } from '@/modelos/comum';
import type { DetalheHistoricoDTO, FiltrosHistorico, RegistroHistoricoDTO } from '@/modelos/historico';

export const servicoHistorico = {
  buscarHistorico(filtros: FiltrosHistorico, signal?: AbortSignal): Promise<PaginaDTO<RegistroHistoricoDTO>> {
    return clienteHttp.get<PaginaDTO<RegistroHistoricoDTO>>(rotasApi.historico.lista, { consulta: { ...filtros }, signal });
  },

  buscarDetalhesHistorico(id: string, signal?: AbortSignal): Promise<DetalheHistoricoDTO> {
    return clienteHttp.get<DetalheHistoricoDTO>(rotasApi.historico.porId(id), { signal });
  },
};
