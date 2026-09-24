import type { RequisicaoTransporte, RespostaTransporte } from '@/api/transporte';
import type { PaginaDTO } from '@/modelos/comum';
import type { Situacao } from '@/modelos/enumeracoes';
import { SITUACOES } from '@/modelos/enumeracoes';
import type { DiaCalendarioDTO, ReagendamentoDTO, TarefaDTO } from '@/modelos/tarefas';
import { salvarBanco } from '../bancoSimulado';
import type { BancoSimulado } from '../bancoSimulado';
import { PESO_PRIORIDADE, lista, numero, tarefasComPrazo, texto } from '../consultas';
import { naoEncontrado, ok, requisicaoInvalida } from '../resposta';

function compararPorData(a: TarefaDTO, b: TarefaDTO): number {
  const dataA = a.data ?? '9999-12-31';
  const dataB = b.data ?? '9999-12-31';
  if (dataA !== dataB) return dataA < dataB ? -1 : 1;
  const horarioA = a.diaInteiro ? '' : (a.horarioInicio ?? '');
  const horarioB = b.diaInteiro ? '' : (b.horarioInicio ?? '');
  if (horarioA !== horarioB) return horarioA < horarioB ? -1 : 1;
  return PESO_PRIORIDADE[b.prioridade] - PESO_PRIORIDADE[a.prioridade];
}

export function listarTarefas(banco: BancoSimulado, requisicao: RequisicaoTransporte, agora: Date): RespostaTransporte {
  const { consulta } = requisicao;
  const data = texto(consulta, 'data');
  const dataInicial = texto(consulta, 'dataInicial');
  const dataFinal = texto(consulta, 'dataFinal');
  const semData = texto(consulta, 'semData') === 'true';
  const situacoes = lista(consulta, 'situacao');
  const prioridades = lista(consulta, 'prioridade');
  const prazo = texto(consulta, 'prazo');
  const categoriaId = texto(consulta, 'categoriaId');
  const busca = texto(consulta, 'busca')?.toLocaleLowerCase('pt-BR');
  const ordenacao = texto(consulta, 'ordenacao') ?? 'DATA';
  const pagina = Math.max(0, numero(consulta, 'pagina', 0));
  const tamanho = Math.min(100, Math.max(1, numero(consulta, 'tamanho', 20)));

  const filtradas = tarefasComPrazo(banco, agora).filter((tarefa) => {
    if (data && tarefa.data !== data) return false;
    if (dataInicial && (!tarefa.data || tarefa.data < dataInicial)) return false;
    if (dataFinal && (!tarefa.data || tarefa.data > dataFinal)) return false;
    if (semData && tarefa.data !== null) return false;
    if (situacoes.length > 0 && !situacoes.includes(tarefa.situacao)) return false;
    if (prioridades.length > 0 && !prioridades.includes(tarefa.prioridade)) return false;
    if (prazo && tarefa.prazo !== prazo) return false;
    if (categoriaId && String(tarefa.categoria?.id) !== categoriaId) return false;
    if (busca && !`${tarefa.titulo} ${tarefa.descricao ?? ''}`.toLocaleLowerCase('pt-BR').includes(busca)) return false;
    return true;
  });

  filtradas.sort((a, b) => {
    if (ordenacao === 'PRIORIDADE') return PESO_PRIORIDADE[b.prioridade] - PESO_PRIORIDADE[a.prioridade] || compararPorData(a, b);
    if (ordenacao === 'ATUALIZACAO') return b.atualizadoEm.localeCompare(a.atualizadoEm);
    return compararPorData(a, b);
  });

  const resposta: PaginaDTO<TarefaDTO> = {
    itens: filtradas.slice(pagina * tamanho, (pagina + 1) * tamanho),
    pagina,
    tamanho,
    totalItens: filtradas.length,
    totalPaginas: Math.ceil(filtradas.length / tamanho),
  };
  return ok(resposta);
}

export function alterarSituacao(
  banco: BancoSimulado,
  requisicao: RequisicaoTransporte,
  agora: Date,
  id: number,
): RespostaTransporte {
  const situacao = (requisicao.corpo as { situacao?: Situacao } | undefined)?.situacao;
  if (!situacao || !SITUACOES.includes(situacao)) return requisicaoInvalida('Informe uma situação válida.');

  const tarefa = banco.tarefas.find((item) => item.id === id);
  if (!tarefa) return naoEncontrado('Esta tarefa não existe mais.');

  const anterior = tarefa.situacao;
  tarefa.situacao = situacao;
  tarefa.dataConclusao = situacao === 'CONCLUIDA' ? (anterior === 'CONCLUIDA' ? tarefa.dataConclusao : agora.toISOString()) : null;
  tarefa.atualizadoEm = agora.toISOString();

  if (situacao === 'CONCLUIDA' && anterior !== 'CONCLUIDA') {
    banco.eventos.push({ tipo: 'TAREFA_CONCLUIDA', descricao: tarefa.titulo, ocorridoEm: agora.toISOString(), referenciaId: id });
  }
  if (situacao === 'CANCELADA' && anterior !== 'CANCELADA') {
    banco.eventos.push({ tipo: 'TAREFA_CANCELADA', descricao: tarefa.titulo, ocorridoEm: agora.toISOString(), referenciaId: id });
  }
  if (anterior === 'CONCLUIDA' && situacao !== 'CONCLUIDA') {
    const indices = banco.eventos
      .map((evento, indice) => (evento.tipo === 'TAREFA_CONCLUIDA' && evento.referenciaId === id ? indice : -1))
      .filter((indice) => indice >= 0);
    const ultimo = indices[indices.length - 1];
    if (ultimo !== undefined) banco.eventos.splice(ultimo, 1);
  }

  salvarBanco();
  return ok(tarefasComPrazo(banco, agora).find((item) => item.id === id));
}

export function reagendarTarefas(banco: BancoSimulado, requisicao: RequisicaoTransporte, agora: Date): RespostaTransporte {
  const itens = (requisicao.corpo as ReagendamentoDTO | undefined)?.itens;
  if (!Array.isArray(itens) || itens.length === 0) return requisicaoInvalida('Informe ao menos uma tarefa para reagendar.');

  const ausente = itens.find((item) => !banco.tarefas.some((tarefa) => tarefa.id === item.id));
  if (ausente) return naoEncontrado('Uma das tarefas não existe mais.');

  for (const item of itens) {
    const tarefa = banco.tarefas.find((atual) => atual.id === item.id);
    if (!tarefa) continue;
    tarefa.data = item.data;
    tarefa.atualizadoEm = agora.toISOString();
  }

  salvarBanco();
  const ids = new Set(itens.map((item) => item.id));
  return ok(tarefasComPrazo(banco, agora).filter((tarefa) => ids.has(tarefa.id)));
}

export function resumirCalendario(banco: BancoSimulado, requisicao: RequisicaoTransporte, agora: Date): RespostaTransporte {
  const dataInicial = texto(requisicao.consulta, 'dataInicial');
  const dataFinal = texto(requisicao.consulta, 'dataFinal');
  if (!dataInicial || !dataFinal) return requisicaoInvalida('Informe dataInicial e dataFinal.');

  const dias = new Map<string, DiaCalendarioDTO>();
  for (const tarefa of tarefasComPrazo(banco, agora)) {
    if (!tarefa.data || tarefa.data < dataInicial || tarefa.data > dataFinal || tarefa.situacao === 'CANCELADA') continue;
    const dia = dias.get(tarefa.data) ?? { data: tarefa.data, quantidade: 0, maiorPrioridade: null, atrasadas: 0, concluidas: 0 };
    dia.quantidade += 1;
    if (tarefa.prazo === 'ATRASADA') dia.atrasadas += 1;
    if (tarefa.situacao === 'CONCLUIDA') dia.concluidas += 1;
    if (!dia.maiorPrioridade || PESO_PRIORIDADE[tarefa.prioridade] > PESO_PRIORIDADE[dia.maiorPrioridade]) {
      dia.maiorPrioridade = tarefa.prioridade;
    }
    dias.set(tarefa.data, dia);
  }

  return ok([...dias.values()].sort((a, b) => a.data.localeCompare(b.data)));
}
