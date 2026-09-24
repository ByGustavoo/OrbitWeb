import { clienteHttp } from '@/api/clienteHttp';
import { rotasApi } from '@/api/rotasApi';
import type { MapaCalorDTO, ProgressoMetaDTO } from '@/modelos/estudos';

export const servicoSessoes = {
  buscarMapaCalor(periodo: { dataInicial: string; dataFinal: string }, signal?: AbortSignal): Promise<MapaCalorDTO> {
    return clienteHttp.get<MapaCalorDTO>(rotasApi.estudos.mapaCalor, { consulta: { ...periodo }, signal });
  },

  buscarProgressoSemanal(inicioSemana: string, signal?: AbortSignal): Promise<ProgressoMetaDTO[]> {
    return clienteHttp.get<ProgressoMetaDTO[]>(rotasApi.estudos.progressoSemanal, { consulta: { inicioSemana }, signal });
  },
};
