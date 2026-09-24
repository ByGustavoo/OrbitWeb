import { clienteHttp } from '@/api/clienteHttp';
import { rotasApi } from '@/api/rotasApi';
import type { ResumoDashboardDTO, SequenciaDTO } from '@/modelos/painel';

export const servicoDashboard = {
  buscarResumoDashboard(
    periodo: { dataInicial: string; dataFinal: string },
    signal?: AbortSignal,
  ): Promise<ResumoDashboardDTO> {
    return clienteHttp.get<ResumoDashboardDTO>(rotasApi.dashboard.resumo, { consulta: { ...periodo }, signal });
  },

  buscarSequencia(data: string, signal?: AbortSignal): Promise<SequenciaDTO> {
    return clienteHttp.get<SequenciaDTO>(rotasApi.dashboard.sequencia, { consulta: { data }, signal });
  },
};
