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

export const FREQUENCIAS: Frequencia[] = ['DIARIA', 'DIAS_DA_SEMANA', 'SEMANAL', 'MENSAL', 'ANUAL'];
export const DIAS_SEMANA: DiaSemana[] = ['DOMINGO', 'SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO'];

export type ModoCronometro = 'LIVRE' | 'POMODORO';

export type OrigemSessao = 'CRONOMETRO' | 'MANUAL';

export type TipoEventoRecente = 'TAREFA_CRIADA' | 'TAREFA_CONCLUIDA' | 'TAREFA_CANCELADA' | 'TAREFA_REABERTA' | 'SESSAO_SALVA';

export type TipoEventoTarefa =
  | 'TAREFA_CRIADA'
  | 'TAREFA_CONCLUIDA'
  | 'TAREFA_CANCELADA'
  | 'TAREFA_REABERTA'
  | 'PRIORIDADE_ALTERADA'
  | 'DATA_ALTERADA';

export type TipoEventoHistorico = TipoEventoTarefa | 'TAREFA_NAO_REALIZADA' | 'SESSAO_ESTUDO';

export type AreaHistorico = 'TAREFAS' | 'ESTUDOS';

export const AREAS_HISTORICO: AreaHistorico[] = ['TAREFAS', 'ESTUDOS'];

export type OrdenacaoTarefas = 'DATA' | 'PRIORIDADE' | 'ATUALIZACAO';
