import type {
  Cor,
  DiaSemana,
  Frequencia,
  OrdenacaoTarefas,
  Prazo,
  Prioridade,
  Situacao,
} from './enumeracoes';

export interface ResumoCategoriaDTO {
  id: number;
  nome: string;
  cor: Cor;
}

export interface ResumoAtividadeDTO {
  id: number;
  nome: string;
  cor: Cor;
}

export interface RecorrenciaDTO {
  frequencia: Frequencia;
  diasSemana: DiaSemana[] | null;
  dataFim: string | null;
}

export type MinutosLembrete = 0 | 5 | 15 | 30 | 60;

export interface TarefaDTO {
  id: number;
  titulo: string;
  descricao: string | null;
  data: string | null;
  diaInteiro: boolean;
  horarioInicio: string | null;
  horarioFim: string | null;
  prioridade: Prioridade;
  situacao: Situacao;
  prazo: Prazo;
  categoria: ResumoCategoriaDTO | null;
  atividade: ResumoAtividadeDTO | null;
  lembreteMinutosAntes: MinutosLembrete | null;
  serieId: number | null;
  recorrencia: RecorrenciaDTO | null;
  dataConclusao: string | null;
  criadoEm: string;
  atualizadoEm: string;
}

export interface FiltrosTarefas {
  data?: string;
  dataInicial?: string;
  dataFinal?: string;
  semData?: boolean;
  situacao?: Situacao[];
  prioridade?: Prioridade[];
  prazo?: Prazo;
  categoriaId?: number;
  busca?: string;
  ordenacao?: OrdenacaoTarefas;
  pagina?: number;
  tamanho?: number;
}

export interface ReagendamentoDTO {
  itens: { id: number; data: string }[];
}

export interface DiaCalendarioDTO {
  data: string;
  quantidade: number;
  maiorPrioridade: Prioridade | null;
  atrasadas: number;
  concluidas: number;
}
