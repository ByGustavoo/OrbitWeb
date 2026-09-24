import type { AreaHistorico, TipoEventoHistorico } from './enumeracoes';
import type { SessaoEstudoDTO } from './estudos';
import type { ResumoAtividadeDTO, ResumoCategoriaDTO, TarefaDTO } from './tarefas';

export interface AlteracaoHistoricoDTO {
  anterior: string | null;
  novo: string | null;
}

export interface RegistroHistoricoDTO {
  id: string;
  tipo: TipoEventoHistorico;
  area: AreaHistorico;
  ocorridoEm: string;
  comHorario: boolean;
  titulo: string;
  tarefaId: number | null;
  sessaoId: number | null;
  categoria: ResumoCategoriaDTO | null;
  atividade: ResumoAtividadeDTO | null;
  alteracao: AlteracaoHistoricoDTO | null;
  duracaoSegundos: number | null;
}

export interface DetalheHistoricoDTO {
  registro: RegistroHistoricoDTO;
  tarefa: TarefaDTO | null;
  sessao: SessaoEstudoDTO | null;
}

export interface FiltrosHistorico {
  dataInicial: string;
  dataFinal: string;
  area?: AreaHistorico;
  busca?: string;
  pagina?: number;
  tamanho?: number;
}

export type PeriodoHistorico = 'HOJE' | 'ONTEM' | 'ULTIMOS_7_DIAS' | 'ULTIMOS_30_DIAS' | 'ESTE_MES' | 'PERSONALIZADO';

export const PERIODOS_HISTORICO: PeriodoHistorico[] = ['HOJE', 'ONTEM', 'ULTIMOS_7_DIAS', 'ULTIMOS_30_DIAS', 'ESTE_MES', 'PERSONALIZADO'];
