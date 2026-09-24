import type { Prioridade, TipoEventoRecente } from './enumeracoes';
import type { MinutosDiaDTO } from './estudos';
import type { ResumoAtividadeDTO } from './tarefas';

export interface ContagensDashboardDTO {
  concluidas: number;
  pendentes: number;
  emAndamento: number;
  atrasadas: number;
  urgentes: number;
  hoje: number;
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
  inicioSemana: string;
  fimSemana: string;
  contagens: ContagensDashboardDTO;
  concluidasPorDia: { data: string; quantidade: number }[];
  minutosEstudoPorDia: MinutosDiaDTO[];
  distribuicaoPrioridade: { prioridade: Prioridade; quantidade: number }[];
  minutosPorAtividade: { atividade: ResumoAtividadeDTO; minutos: number }[];
  eventosRecentes: EventoRecenteDTO[];
}

export interface SequenciaDTO {
  atual: number;
  recorde: number;
  contaHoje: boolean;
}
