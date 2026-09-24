import type { ResumoAtividadeDTO } from './tarefas';

export interface ProgressoMetaDTO {
  atividade: ResumoAtividadeDTO;
  metaMinutos: number;
  minutosRealizados: number;
}

export interface MinutosDiaDTO {
  data: string;
  minutos: number;
}

export interface MapaCalorDTO {
  dias: MinutosDiaDTO[];
  atividadeMaisEstudada: (ResumoAtividadeDTO & { minutos: number }) | null;
}
