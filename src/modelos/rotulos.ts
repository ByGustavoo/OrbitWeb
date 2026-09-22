import type { Cor, Prazo, Prioridade, Situacao } from './enumeracoes';

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
