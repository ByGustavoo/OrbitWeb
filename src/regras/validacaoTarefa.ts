import { FREQUENCIAS, PRIORIDADES, SITUACOES } from '@/modelos/enumeracoes';
import type { TarefaEnvioDTO } from '@/modelos/tarefas';
import { MINUTOS_LEMBRETE } from '@/modelos/tarefas';
import { ehDataIsoValida, ehHorarioValido, formatarDataCurta } from '@/utilitarios/datas';
import { formatarNumero } from '@/utilitarios/formatacao';

export const LIMITE_TITULO = 120;
export const LIMITE_DESCRICAO = 2000;

export type CampoTarefa =
  | 'titulo'
  | 'descricao'
  | 'data'
  | 'horarioInicio'
  | 'horarioFim'
  | 'prioridade'
  | 'situacao'
  | 'lembreteMinutosAntes'
  | 'frequencia'
  | 'diasSemana'
  | 'dataFim';

export type ErrosTarefa = Partial<Record<CampoTarefa, string>>;

export const ORDEM_CAMPOS_TAREFA: CampoTarefa[] = [
  'titulo',
  'descricao',
  'data',
  'horarioInicio',
  'horarioFim',
  'prioridade',
  'situacao',
  'lembreteMinutosAntes',
  'frequencia',
  'diasSemana',
  'dataFim',
];

export function normalizarTarefa(dados: TarefaEnvioDTO): TarefaEnvioDTO {
  const descricao = dados.descricao?.trim() ?? '';
  const semData = !dados.data;
  const semHorario = semData || dados.diaInteiro || !dados.horarioInicio;
  const recorrencia =
    semData || !dados.recorrencia
      ? null
      : {
          frequencia: dados.recorrencia.frequencia,
          diasSemana: dados.recorrencia.frequencia === 'DIAS_DA_SEMANA' ? dados.recorrencia.diasSemana ?? [] : null,
          dataFim: dados.recorrencia.dataFim || null,
        };

  return {
    ...dados,
    titulo: dados.titulo.trim(),
    descricao: descricao ? descricao : null,
    data: dados.data || null,
    diaInteiro: semData ? false : semHorario && !dados.horarioFim ? true : dados.diaInteiro,
    horarioInicio: semData || dados.diaInteiro ? null : dados.horarioInicio || null,
    horarioFim: semData || dados.diaInteiro ? null : dados.horarioFim || null,
    lembreteMinutosAntes: semHorario ? null : dados.lembreteMinutosAntes,
    recorrencia,
  };
}

export function validarTarefa(dados: TarefaEnvioDTO): ErrosTarefa {
  const erros: ErrosTarefa = {};
  const titulo = dados.titulo.trim();

  if (!titulo) erros.titulo = 'Informe um título para a tarefa.';
  else if (titulo.length > LIMITE_TITULO) {
    erros.titulo = `Use no máximo ${LIMITE_TITULO} caracteres no título. Agora são ${formatarNumero(titulo.length)}.`;
  }

  if ((dados.descricao?.length ?? 0) > LIMITE_DESCRICAO) {
    erros.descricao = `Use no máximo ${formatarNumero(LIMITE_DESCRICAO)} caracteres na descrição. Agora são ${formatarNumero(dados.descricao?.length ?? 0)}.`;
  }

  if (dados.data && !ehDataIsoValida(dados.data)) erros.data = 'Informe uma data válida.';

  const usaHorario = !dados.diaInteiro;
  if (usaHorario && dados.horarioInicio) {
    if (!ehHorarioValido(dados.horarioInicio)) erros.horarioInicio = 'Informe um horário válido, como 08:30.';
    else if (!dados.data) erros.horarioInicio = 'Escolha uma data para definir o horário.';
  }

  if (usaHorario && dados.horarioFim) {
    if (!ehHorarioValido(dados.horarioFim)) erros.horarioFim = 'Informe um horário válido, como 09:30.';
    else if (!dados.horarioInicio) erros.horarioFim = 'Informe o horário de início antes do fim.';
    else if (ehHorarioValido(dados.horarioInicio) && dados.horarioFim <= dados.horarioInicio) {
      erros.horarioFim = `O fim precisa ser depois do início (${dados.horarioInicio}).`;
    }
  }

  if (!PRIORIDADES.includes(dados.prioridade)) erros.prioridade = 'Escolha uma das prioridades da lista.';
  if (!SITUACOES.includes(dados.situacao)) erros.situacao = 'Escolha uma das situações da lista.';

  if (dados.lembreteMinutosAntes !== null) {
    if (!MINUTOS_LEMBRETE.includes(dados.lembreteMinutosAntes)) erros.lembreteMinutosAntes = 'Escolha um dos lembretes da lista.';
    else if (!dados.data || dados.diaInteiro || !dados.horarioInicio) {
      erros.lembreteMinutosAntes = 'Defina a data e o horário de início para receber o lembrete.';
    }
  }

  const recorrencia = dados.recorrencia;
  if (recorrencia) {
    if (!FREQUENCIAS.includes(recorrencia.frequencia)) erros.frequencia = 'Escolha uma das frequências da lista.';
    else if (!dados.data) erros.frequencia = 'Escolha a data da primeira ocorrência para repetir a tarefa.';

    if (recorrencia.frequencia === 'DIAS_DA_SEMANA' && (recorrencia.diasSemana ?? []).length === 0) {
      erros.diasSemana = 'Escolha pelo menos um dia da semana.';
    }

    if (recorrencia.dataFim) {
      if (!ehDataIsoValida(recorrencia.dataFim)) erros.dataFim = 'Informe uma data de término válida.';
      else if (dados.data && recorrencia.dataFim < dados.data) {
        erros.dataFim = `O término precisa ser a partir da primeira ocorrência (${formatarDataCurta(dados.data)}).`;
      }
    }
  }

  return erros;
}

export function primeiroCampoComErro(erros: ErrosTarefa): CampoTarefa | null {
  return ORDEM_CAMPOS_TAREFA.find((campo) => erros[campo]) ?? null;
}
