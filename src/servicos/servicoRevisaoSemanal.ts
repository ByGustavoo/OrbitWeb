import { clienteHttp } from '@/api/clienteHttp';
import { rotasApi } from '@/api/rotasApi';
import type { NotaSemanaDTO, RevisaoSemanalDTO } from '@/modelos/revisao';

export const servicoRevisaoSemanal = {
  buscarRevisaoSemanal(inicioSemana: string, signal?: AbortSignal): Promise<RevisaoSemanalDTO> {
    return clienteHttp.get<RevisaoSemanalDTO>(rotasApi.revisaoSemanal.resumo, { consulta: { inicioSemana }, signal });
  },

  salvarNotaSemana(inicioSemana: string, texto: string, signal?: AbortSignal): Promise<NotaSemanaDTO | null> {
    return clienteHttp.put<NotaSemanaDTO | null>(rotasApi.revisaoSemanal.nota(inicioSemana), { texto }, { signal });
  },
};
