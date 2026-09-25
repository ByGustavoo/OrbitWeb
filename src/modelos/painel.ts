import type { Prioridade, TipoEventoRecente } from './enumeracoes';
import type { MinutosDiaDTO } from './estudos';

export interface ContagensDashboardDTO {
  concluidas: number;
  pendentes: number;
  emAndamento: number;
  atrasadas: number;
  urgentes: number;
}

export interface EventoRecenteDTO {
  tipo: TipoEventoRecente;
  descricao: string;
  ocorridoEm: string;
  referenciaId: number;
}

export interface ResumoDashboardDTO {
  dataInicial: string;
  dataFinal: string;
  contagens: ContagensDashboardDTO;
  concluidasPorDia: { data: string; quantidade: number }[];
  minutosEstudoPorDia: MinutosDiaDTO[];
  distribuicaoPrioridade: { prioridade: Prioridade; quantidade: number }[];
  eventosRecentes: EventoRecenteDTO[];
}

export interface SequenciaDTO {
  atual: number;
  recorde: number;
  contaHoje: boolean;
}
