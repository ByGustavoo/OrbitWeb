import type {
  AreaHistorico,
  Cor,
  DiaSemana,
  EscopoAlteracao,
  Frequencia,
  OrdenacaoTarefas,
  Prazo,
  Prioridade,
  Situacao,
  TipoEventoHistorico,
} from './enumeracoes';
import type { PeriodoHistorico } from './historico';
import type { MinutosLembrete } from './tarefas';

export const rotuloPrioridade: Record<Prioridade, string> = {
  BAIXA: 'Baixa',
  MEDIA: 'Média',
  ALTA: 'Alta',
  URGENTE: 'Urgente',
};

export const rotuloSituacao: Record<Situacao, string> = {
  PENDENTE: 'Pendente',
  EM_ANDAMENTO: 'Em andamento',
  CONCLUIDA: 'Concluída',
  CANCELADA: 'Cancelada',
};

export const rotuloPrazo: Record<Prazo, string> = {
  SEM_DATA: 'Sem data',
  NO_PRAZO: 'No prazo',
  ATRASADA: 'Atrasada',
  NAO_REALIZADA: 'Não realizada',
  CONCLUIDA_NO_PRAZO: 'Concluída no prazo',
  CONCLUIDA_COM_ATRASO: 'Concluída com atraso',
};

export const rotuloCor: Record<Cor, string> = {
  AZUL: 'Azul',
  VERDE: 'Verde',
  AMARELO: 'Amarelo',
  LARANJA: 'Laranja',
  VERMELHO: 'Vermelho',
  ROSA: 'Rosa',
  ROXO: 'Roxo',
  CIANO: 'Ciano',
  CINZA: 'Cinza',
};

export const rotuloFrequencia: Record<Frequencia, string> = {
  DIARIA: 'Todos os dias',
  DIAS_DA_SEMANA: 'Em dias da semana escolhidos',
  SEMANAL: 'Toda semana',
  MENSAL: 'Todo mês',
  ANUAL: 'Todo ano',
};

export const rotuloDiaSemana: Record<DiaSemana, string> = {
  DOMINGO: 'Domingo',
  SEGUNDA: 'Segunda-feira',
  TERCA: 'Terça-feira',
  QUARTA: 'Quarta-feira',
  QUINTA: 'Quinta-feira',
  SEXTA: 'Sexta-feira',
  SABADO: 'Sábado',
};

export const rotuloLembrete: Record<MinutosLembrete, string> = {
  0: 'No horário de início',
  5: '5 minutos antes',
  15: '15 minutos antes',
  30: '30 minutos antes',
  60: '1 hora antes',
};

export const rotuloEscopo: Record<EscopoAlteracao, string> = {
  SOMENTE_ESTA: 'Só esta',
  ESTA_E_PROXIMAS: 'Esta e as próximas',
};

export const rotuloOrdenacao: Record<OrdenacaoTarefas, string> = {
  DATA: 'Data e horário',
  PRIORIDADE: 'Prioridade',
  ATUALIZACAO: 'Atualizadas recentemente',
};

export const rotuloEventoHistorico: Record<TipoEventoHistorico, string> = {
  TAREFA_CRIADA: 'Tarefa criada',
  TAREFA_CONCLUIDA: 'Tarefa concluída',
  TAREFA_CANCELADA: 'Tarefa cancelada',
  TAREFA_REABERTA: 'Tarefa reaberta',
  TAREFA_NAO_REALIZADA: 'Tarefa não realizada',
  PRIORIDADE_ALTERADA: 'Prioridade alterada',
  DATA_ALTERADA: 'Data alterada',
  SESSAO_ESTUDO: 'Sessão de estudo',
};

export const rotuloAreaHistorico: Record<AreaHistorico, string> = {
  TAREFAS: 'Tarefas',
  ESTUDOS: 'Estudos',
};

export const rotuloPeriodoHistorico: Record<PeriodoHistorico, string> = {
  HOJE: 'Hoje',
  ONTEM: 'Ontem',
  ULTIMOS_7_DIAS: 'Últimos 7 dias',
  ULTIMOS_30_DIAS: 'Últimos 30 dias',
  ESTE_MES: 'Este mês',
  PERSONALIZADO: 'Personalizado',
};
