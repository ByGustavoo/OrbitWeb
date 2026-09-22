export type Prioridade = 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE';

export type Situacao = 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA';

export type Prazo =
  | 'SEM_DATA'
  | 'NO_PRAZO'
  | 'ATRASADA'
  | 'NAO_REALIZADA'
  | 'CONCLUIDA_NO_PRAZO'
  | 'CONCLUIDA_COM_ATRASO';

export type Cor = 'AZUL' | 'VERDE' | 'AMARELO' | 'LARANJA' | 'VERMELHO' | 'ROSA' | 'ROXO' | 'CIANO' | 'CINZA';

export const PRIORIDADES: Prioridade[] = ['BAIXA', 'MEDIA', 'ALTA', 'URGENTE'];
export const SITUACOES: Situacao[] = ['PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA'];
export const CORES: Cor[] = ['AZUL', 'VERDE', 'AMARELO', 'LARANJA', 'VERMELHO', 'ROSA', 'ROXO', 'CIANO', 'CINZA'];
