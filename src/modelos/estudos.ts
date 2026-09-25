import type { Cor, ModoCronometro, OrigemSessao } from './enumeracoes';
import type { ResumoAtividadeDTO } from './tarefas';

export interface AtividadeEstudoDTO {
  id: number;
  nome: string;
  cor: Cor;
  metaSemanalMinutos: number | null;
  arquivada: boolean;
}

export interface AtividadeEnvioDTO {
  nome: string;
  cor: Cor;
  metaSemanalMinutos: number | null;
}

export interface ResumoTarefaSessaoDTO {
  id: number;
  titulo: string;
}

export interface SessaoEstudoDTO {
  id: number;
  atividade: ResumoAtividadeDTO;
  tarefa: ResumoTarefaSessaoDTO | null;
  modo: ModoCronometro;
  origem: OrigemSessao;
  inicio: string;
  fim: string;
  duracaoSegundos: number;
  ciclosConcluidos: number | null;
  observacao: string | null;
}

export interface SessaoEnvioDTO {
  atividadeId: number;
  tarefaId: number | null;
  modo: ModoCronometro;
  origem: OrigemSessao;
  inicio: string;
  fim: string;
  duracaoSegundos: number;
  ciclosConcluidos: number | null;
  observacao: string | null;
}

export interface FiltrosSessoes {
  dataInicial?: string;
  dataFinal?: string;
  atividadeId?: number;
  pagina?: number;
  tamanho?: number;
}

export interface EstudoPorAtividadeDTO {
  atividade: ResumoAtividadeDTO;
  segundos: number;
  sessoes: number;
  ultimaSessaoEm: string | null;
}

export interface SegundosDiaDTO {
  data: string;
  segundos: number;
  sessoes: number;
}

export interface ResumoEstudosDTO {
  totalSegundos: number;
  totalSessoes: number;
  mediaSegundosPorSessao: number;
  porDia: SegundosDiaDTO[];
  porAtividade: EstudoPorAtividadeDTO[];
}

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
