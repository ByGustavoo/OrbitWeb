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

export type Frequencia = 'DIARIA' | 'DIAS_DA_SEMANA' | 'SEMANAL' | 'MENSAL' | 'ANUAL';

export type DiaSemana = 'DOMINGO' | 'SEGUNDA' | 'TERCA' | 'QUARTA' | 'QUINTA' | 'SEXTA' | 'SABADO';

export type EscopoAlteracao = 'SOMENTE_ESTA' | 'ESTA_E_PROXIMAS';

export type ModoCronometro = 'LIVRE' | 'POMODORO';

export type OrigemSessao = 'CRONOMETRO' | 'MANUAL';

export type TipoEventoRecente = 'TAREFA_CRIADA' | 'TAREFA_CONCLUIDA' | 'TAREFA_CANCELADA' | 'SESSAO_SALVA';

export type OrdenacaoTarefas = 'DATA' | 'PRIORIDADE' | 'ATUALIZACAO';
