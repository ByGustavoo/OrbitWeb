import type { RequisicaoTransporte, RespostaTransporte } from '@/api/transporte';
import type { Prioridade } from '@/modelos/enumeracoes';
import type {
  DiaRevisaoDTO,
  EstudoAtividadeSemanaDTO,
  NotaSemanaDTO,
  ProximaSemanaDTO,
  ResumoSemanaDTO,
  RevisaoSemanalDTO,
  TarefasSemanaDTO,
} from '@/modelos/revisao';
import { LIMITE_NOTA_SEMANA } from '@/modelos/revisao';
import type { TarefaDTO } from '@/modelos/tarefas';
import { adicionarDiasIso, dataIsoLocal, deDataIso, diasEntre, ehDataIsoValida, intervaloDeDias } from '@/utilitarios/datas';
import { salvarBanco } from '../bancoSimulado';
import type { BancoSimulado } from '../bancoSimulado';
import { diaDoInstante, emAberto, minutosDaSessao, tarefasComPrazo, texto } from '../consultas';
import { dadosInvalidos, ok, requisicaoInvalida } from '../resposta';
import { paraDTO, progressoDasMetas } from './estudos';
import { compararPorData } from './tarefas';

const PRIORIDADES_IMPORTANTES: Prioridade[] = ['ALTA', 'URGENTE'];
const LIMITE_TAREFAS_PROXIMA_SEMANA = 10;

function ehInicioDeSemana(iso: string | undefined): iso is string {
  return iso !== undefined && ehDataIsoValida(iso) && deDataIso(iso).getDay() === 0;
}

function dentro(inicio: string, fim: string) {
  return (data: string | null | undefined) => data !== null && data !== undefined && data >= inicio && data <= fim;
}

function resumirSemana(banco: BancoSimulado, tarefas: TarefaDTO[], inicio: string, agora: Date): ResumoSemanaDTO {
  const fim = adicionarDiasIso(inicio, 6);
  const naSemana = dentro(inicio, fim);
  const agoraIso = agora.toISOString();

  const concluidasNaSemana = tarefas.filter((tarefa) => tarefa.dataConclusao && naSemana(diaDoInstante(tarefa.dataConclusao)));
  const hoje = dataIsoLocal(agora);
  const ateHoje = dentro(inicio, fim < hoje ? fim : hoje);
  const planejadas = tarefas.filter((tarefa) => naSemana(tarefa.data));
  const planejadasValidas = planejadas.filter((tarefa) => tarefa.situacao !== 'CANCELADA' && ateHoje(tarefa.data));
  const planejadasConcluidas = planejadasValidas.filter((tarefa) => tarefa.situacao === 'CONCLUIDA').length;
  const sessoes = banco.sessoes.filter((sessao) => naSemana(diaDoInstante(sessao.inicio)));

  const dias = new Set<string>();
  sessoes.forEach((sessao) => dias.add(diaDoInstante(sessao.inicio)));
  concluidasNaSemana.forEach((tarefa) => dias.add(diaDoInstante(tarefa.dataConclusao ?? '')));

  return {
    concluidas: concluidasNaSemana.length,
    criadas: banco.eventos.filter(
      (evento) => evento.tipo === 'TAREFA_CRIADA' && evento.ocorridoEm <= agoraIso && naSemana(diaDoInstante(evento.ocorridoEm)),
    ).length,
    atrasadas: planejadas.filter((tarefa) => tarefa.prazo === 'ATRASADA').length,
    planejadas: planejadasValidas.length,
    planejadasConcluidas,
    taxaConclusao: planejadasValidas.length > 0 ? planejadasConcluidas / planejadasValidas.length : null,
    minutosEstudo: sessoes.reduce((soma, sessao) => soma + minutosDaSessao(sessao), 0),
    sessoes: sessoes.length,
    diasComAtividade: dias.size,
  };
}

function porDia(banco: BancoSimulado, tarefas: TarefaDTO[], inicio: string): DiaRevisaoDTO[] {
  const dias = new Map<string, DiaRevisaoDTO>(
    intervaloDeDias(inicio, adicionarDiasIso(inicio, 6)).map((data) => [data, { data, tarefasConcluidas: 0, minutosEstudo: 0 }]),
  );
  for (const tarefa of tarefas) {
    const dia = tarefa.dataConclusao ? dias.get(diaDoInstante(tarefa.dataConclusao)) : undefined;
    if (dia) dia.tarefasConcluidas += 1;
  }
  for (const sessao of banco.sessoes) {
    const dia = dias.get(diaDoInstante(sessao.inicio));
    if (dia) dia.minutosEstudo += minutosDaSessao(sessao);
  }
  return [...dias.values()];
}

function estudosPorAtividade(banco: BancoSimulado, inicio: string): EstudoAtividadeSemanaDTO[] {
  const naSemana = dentro(inicio, adicionarDiasIso(inicio, 6));
  const totais = new Map<number, EstudoAtividadeSemanaDTO>();
  for (const sessao of banco.sessoes) {
    if (!naSemana(diaDoInstante(sessao.inicio))) continue;
    const { atividade } = paraDTO(banco, sessao);
    const atual = totais.get(atividade.id) ?? { atividade, minutos: 0, sessoes: 0 };
    atual.minutos += minutosDaSessao(sessao);
    atual.sessoes += 1;
    totais.set(atividade.id, atual);
  }
  return [...totais.values()].sort((a, b) => b.minutos - a.minutos || a.atividade.nome.localeCompare(b.atividade.nome, 'pt-BR'));
}

function tarefasDaSemana(tarefas: TarefaDTO[], inicio: string): TarefasSemanaDTO {
  const planejadas = tarefas.filter((tarefa) => dentro(inicio, adicionarDiasIso(inicio, 6))(tarefa.data));
  const pendentes = planejadas.filter((tarefa) => emAberto(tarefa) && tarefa.prazo !== 'NAO_REALIZADA').sort(compararPorData);
  const contar = (condicao: (tarefa: TarefaDTO) => boolean) => planejadas.filter(condicao).length;
  return {
    planejadas: contar((tarefa) => tarefa.situacao !== 'CANCELADA'),
    concluidas: contar((tarefa) => tarefa.situacao === 'CONCLUIDA'),
    concluidasComAtraso: contar((tarefa) => tarefa.prazo === 'CONCLUIDA_COM_ATRASO'),
    emAberto: contar((tarefa) => emAberto(tarefa) && tarefa.prazo === 'NO_PRAZO'),
    atrasadas: contar((tarefa) => tarefa.prazo === 'ATRASADA'),
    naoRealizadas: contar((tarefa) => tarefa.prazo === 'NAO_REALIZADA'),
    canceladas: contar((tarefa) => tarefa.situacao === 'CANCELADA'),
    pendentes,
    importantesPendentes: pendentes.filter((tarefa) => PRIORIDADES_IMPORTANTES.includes(tarefa.prioridade)).length,
  };
}

function proximaSemana(tarefas: TarefaDTO[], inicio: string): ProximaSemanaDTO {
  const inicioProxima = adicionarDiasIso(inicio, 7);
  const fimProxima = adicionarDiasIso(inicio, 13);
  const agendadas = tarefas
    .filter((tarefa) => dentro(inicioProxima, fimProxima)(tarefa.data) && emAberto(tarefa))
    .sort(compararPorData);
  return {
    inicioSemana: inicioProxima,
    fimSemana: fimProxima,
    agendadas: agendadas.length,
    altaPrioridade: agendadas.filter((tarefa) => PRIORIDADES_IMPORTANTES.includes(tarefa.prioridade)).length,
    atrasadasEmAberto: tarefas.filter((tarefa) => tarefa.prazo === 'ATRASADA').length,
    tarefas: agendadas.slice(0, LIMITE_TAREFAS_PROXIMA_SEMANA),
  };
}

export function buscarRevisaoSemanal(banco: BancoSimulado, requisicao: RequisicaoTransporte, agora: Date): RespostaTransporte {
  const inicio = texto(requisicao.consulta, 'inicioSemana');
  if (!ehInicioDeSemana(inicio)) return requisicaoInvalida('Informe inicioSemana como um domingo no formato AAAA-MM-DD.');

  const fim = adicionarDiasIso(inicio, 6);
  const hoje = dataIsoLocal(agora);
  const tarefas = tarefasComPrazo(banco, agora);
  const diasDecorridos = inicio > hoje ? 0 : Math.min(7, diasEntre(inicio, hoje) + 1);

  const resposta: RevisaoSemanalDTO = {
    inicioSemana: inicio,
    fimSemana: fim,
    emAndamento: hoje >= inicio && hoje <= fim,
    diasDecorridos,
    resumo: resumirSemana(banco, tarefas, inicio, agora),
    semanaAnterior: resumirSemana(banco, tarefas, adicionarDiasIso(inicio, -7), agora),
    porDia: porDia(banco, tarefas, inicio),
    estudos: {
      minutos: banco.sessoes
        .filter((sessao) => dentro(inicio, fim)(diaDoInstante(sessao.inicio)))
        .reduce((soma, sessao) => soma + minutosDaSessao(sessao), 0),
      sessoes: banco.sessoes.filter((sessao) => dentro(inicio, fim)(diaDoInstante(sessao.inicio))).length,
      porAtividade: estudosPorAtividade(banco, inicio),
      metas: progressoDasMetas(banco, inicio),
    },
    tarefas: tarefasDaSemana(tarefas, inicio),
    proximaSemana: proximaSemana(tarefas, inicio),
    nota: banco.notasSemana[inicio] ?? null,
  };
  return ok(resposta);
}

export function salvarNotaSemana(
  banco: BancoSimulado,
  requisicao: RequisicaoTransporte,
  agora: Date,
  _numero: number,
  inicio: string,
): RespostaTransporte {
  if (!ehInicioDeSemana(inicio)) return requisicaoInvalida('A semana precisa começar num domingo.');
  const bruto = (requisicao.corpo as { texto?: unknown } | undefined)?.texto;
  if (typeof bruto !== 'string') return requisicaoInvalida('Envie o texto da nota.');

  const conteudo = bruto.trim();
  if (conteudo.length > LIMITE_NOTA_SEMANA) {
    return dadosInvalidos([{ campo: 'texto', mensagem: `A nota pode ter até ${LIMITE_NOTA_SEMANA} caracteres.` }]);
  }

  if (!conteudo) {
    delete banco.notasSemana[inicio];
    salvarBanco();
    return ok(null);
  }

  const nota: NotaSemanaDTO = { texto: conteudo, atualizadoEm: agora.toISOString() };
  banco.notasSemana[inicio] = nota;
  salvarBanco();
  return ok(nota);
}
