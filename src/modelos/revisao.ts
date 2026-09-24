import type { ProgressoMetaDTO } from './estudos';
import type { ResumoAtividadeDTO, TarefaDTO } from './tarefas';

export interface ResumoSemanaDTO {
  concluidas: number;
  criadas: number;
  atrasadas: number;
  planejadas: number;
  planejadasConcluidas: number;
  taxaConclusao: number | null;
  minutosEstudo: number;
  sessoes: number;
  diasComAtividade: number;
}

export interface DiaRevisaoDTO {
  data: string;
  tarefasConcluidas: number;
  minutosEstudo: number;
}

export interface EstudoAtividadeSemanaDTO {
  atividade: ResumoAtividadeDTO;
  minutos: number;
  sessoes: number;
}

export interface EstudosSemanaDTO {
  minutos: number;
  sessoes: number;
  porAtividade: EstudoAtividadeSemanaDTO[];
  metas: ProgressoMetaDTO[];
}

export interface TarefasSemanaDTO {
  planejadas: number;
  concluidas: number;
  concluidasComAtraso: number;
  emAberto: number;
  atrasadas: number;
  naoRealizadas: number;
  canceladas: number;
  pendentes: TarefaDTO[];
  importantesPendentes: number;
}

export interface ProximaSemanaDTO {
  inicioSemana: string;
  fimSemana: string;
  agendadas: number;
  altaPrioridade: number;
  atrasadasEmAberto: number;
  tarefas: TarefaDTO[];
}

export interface NotaSemanaDTO {
  texto: string;
  atualizadoEm: string;
}

export interface RevisaoSemanalDTO {
  inicioSemana: string;
  fimSemana: string;
  emAndamento: boolean;
  diasDecorridos: number;
  resumo: ResumoSemanaDTO;
  semanaAnterior: ResumoSemanaDTO;
  porDia: DiaRevisaoDTO[];
  estudos: EstudosSemanaDTO;
  tarefas: TarefasSemanaDTO;
  proximaSemana: ProximaSemanaDTO;
  nota: NotaSemanaDTO | null;
}

export const LIMITE_NOTA_SEMANA = 1000;
