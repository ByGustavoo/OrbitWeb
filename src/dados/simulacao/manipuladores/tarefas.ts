import type { RequisicaoTransporte, RespostaTransporte } from '@/api/transporte';
import type { ErroCampoDTO, PaginaDTO } from '@/modelos/comum';
import type { EscopoAlteracao, Situacao } from '@/modelos/enumeracoes';
import { SITUACOES } from '@/modelos/enumeracoes';
import type { DiaCalendarioDTO, ReagendamentoDTO, TarefaDTO, TarefaEnvioDTO } from '@/modelos/tarefas';
import { mesmaRecorrencia } from '@/regras/recorrencia';
import { normalizarTarefa, validarTarefa } from '@/regras/validacaoTarefa';
import { gerarId, salvarBanco } from '../bancoSimulado';
import type { BancoSimulado, TarefaArmazenada } from '../bancoSimulado';
import { PESO_PRIORIDADE, lista, numero, tarefasComPrazo, texto } from '../consultas';
import { criado, dadosInvalidos, naoEncontrado, ok, requisicaoInvalida, semConteudo } from '../resposta';
import { registrarEvento, registrarMudancasRelevantes, removerEventosDasTarefas } from '../eventos';
import { encerrarSerieAntesDe, iniciarSerie, ocorrenciasDaSerie } from '../series';

export function compararPorData(a: TarefaDTO, b: TarefaDTO): number {
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

function aplicarSituacao(banco: BancoSimulado, tarefa: TarefaArmazenada, situacao: Situacao, agora: Date): void {
  const anterior = tarefa.situacao;
  if (anterior === situacao) return;
  tarefa.situacao = situacao;
  tarefa.dataConclusao = situacao === 'CONCLUIDA' ? agora.toISOString() : null;
  tarefa.atualizadoEm = agora.toISOString();

  if (situacao === 'CONCLUIDA') registrarEvento(banco, tarefa, 'TAREFA_CONCLUIDA', agora);
  if (situacao === 'CANCELADA') registrarEvento(banco, tarefa, 'TAREFA_CANCELADA', agora);
  const encerrada = anterior === 'CONCLUIDA' || anterior === 'CANCELADA';
  if (encerrada && (situacao === 'PENDENTE' || situacao === 'EM_ANDAMENTO')) {
    registrarEvento(banco, tarefa, 'TAREFA_REABERTA', agora, { anterior, novo: situacao });
  }
}

function comPrazo(banco: BancoSimulado, agora: Date, id: number): TarefaDTO | undefined {
  return tarefasComPrazo(banco, agora).find((item) => item.id === id);
}

export function buscarTarefa(banco: BancoSimulado, _requisicao: RequisicaoTransporte, agora: Date, id: number): RespostaTransporte {
  const tarefa = comPrazo(banco, agora, id);
  return tarefa ? ok(tarefa) : naoEncontrado('Esta tarefa não existe mais.');
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

  aplicarSituacao(banco, tarefa, situacao, agora);
  salvarBanco();
  return ok(comPrazo(banco, agora, id));
}

interface EnvioResolvido {
  dados: TarefaEnvioDTO;
  categoria: TarefaArmazenada['categoria'];
  atividade: TarefaArmazenada['atividade'];
}

function lerEnvio(banco: BancoSimulado, corpo: unknown): EnvioResolvido | RespostaTransporte {
  if (!corpo || typeof corpo !== 'object' || typeof (corpo as TarefaEnvioDTO).titulo !== 'string') {
    return requisicaoInvalida('Envie os dados da tarefa.');
  }
  const dados = normalizarTarefa(corpo as TarefaEnvioDTO);
  const erros: ErroCampoDTO[] = Object.entries(validarTarefa(dados)).map(([campo, mensagem]) => ({ campo, mensagem: mensagem ?? '' }));

  const categoria = dados.categoriaId === null ? null : banco.categorias.find((item) => item.id === dados.categoriaId) ?? null;
  if (dados.categoriaId !== null && !categoria) erros.push({ campo: 'categoriaId', mensagem: 'Esta categoria não existe mais. Escolha outra.' });

  const atividade = dados.atividadeId === null ? null : banco.atividades.find((item) => item.id === dados.atividadeId) ?? null;
  if (dados.atividadeId !== null && (!atividade || atividade.arquivada)) {
    erros.push({ campo: 'atividadeId', mensagem: 'Esta atividade não está mais disponível. Escolha outra.' });
  }

  if (erros.length > 0) return dadosInvalidos(erros);
  return {
    dados,
    categoria: categoria ? { ...categoria } : null,
    atividade: atividade ? { id: atividade.id, nome: atividade.nome, cor: atividade.cor } : null,
  };
}

function ehResposta(valor: EnvioResolvido | RespostaTransporte): valor is RespostaTransporte {
  return 'status' in valor;
}

function aplicarConteudo(tarefa: TarefaArmazenada, envio: EnvioResolvido, agora: Date): void {
  const { dados } = envio;
  tarefa.titulo = dados.titulo;
  tarefa.descricao = dados.descricao;
  tarefa.diaInteiro = dados.diaInteiro;
  tarefa.horarioInicio = dados.horarioInicio;
  tarefa.horarioFim = dados.horarioFim;
  tarefa.prioridade = dados.prioridade;
  tarefa.categoria = envio.categoria ? { ...envio.categoria } : null;
  tarefa.atividade = envio.atividade ? { ...envio.atividade } : null;
  tarefa.lembreteMinutosAntes = dados.lembreteMinutosAntes;
  tarefa.atualizadoEm = agora.toISOString();
}

export function criarTarefa(banco: BancoSimulado, requisicao: RequisicaoTransporte, agora: Date): RespostaTransporte {
  const envio = lerEnvio(banco, requisicao.corpo);
  if (ehResposta(envio)) return envio;
  const { dados } = envio;

  const tarefa: TarefaArmazenada = {
    id: gerarId(),
    titulo: dados.titulo,
    descricao: dados.descricao,
    data: dados.data,
    diaInteiro: dados.diaInteiro,
    horarioInicio: dados.horarioInicio,
    horarioFim: dados.horarioFim,
    prioridade: dados.prioridade,
    situacao: dados.situacao,
    categoria: envio.categoria,
    atividade: envio.atividade,
    lembreteMinutosAntes: dados.lembreteMinutosAntes,
    serieId: null,
    recorrencia: null,
    dataConclusao: dados.situacao === 'CONCLUIDA' ? agora.toISOString() : null,
    criadoEm: agora.toISOString(),
    atualizadoEm: agora.toISOString(),
  };
  banco.tarefas.push(tarefa);
  registrarEvento(banco, tarefa, 'TAREFA_CRIADA', agora);
  if (dados.situacao === 'CONCLUIDA') registrarEvento(banco, tarefa, 'TAREFA_CONCLUIDA', agora);
  if (dados.recorrencia) iniciarSerie(banco, tarefa, dados.recorrencia, agora);

  salvarBanco();
  return criado(comPrazo(banco, agora, tarefa.id));
}

function lerEscopo(requisicao: RequisicaoTransporte): EscopoAlteracao {
  return texto(requisicao.consulta, 'escopo') === 'ESTA_E_PROXIMAS' ? 'ESTA_E_PROXIMAS' : 'SOMENTE_ESTA';
}

function emAbertoArmazenada(tarefa: TarefaArmazenada): boolean {
  return tarefa.situacao === 'PENDENTE' || tarefa.situacao === 'EM_ANDAMENTO';
}

export function atualizarTarefa(banco: BancoSimulado, requisicao: RequisicaoTransporte, agora: Date, id: number): RespostaTransporte {
  const tarefa = banco.tarefas.find((item) => item.id === id);
  if (!tarefa) return naoEncontrado('Esta tarefa não existe mais.');

  const envio = lerEnvio(banco, requisicao.corpo);
  if (ehResposta(envio)) return envio;
  const { dados } = envio;
  const serieId = tarefa.serieId;
  const antes = { prioridade: tarefa.prioridade, data: tarefa.data };
  const concluir = () => {
    registrarMudancasRelevantes(banco, tarefa, antes, agora);
    salvarBanco();
    return ok(comPrazo(banco, agora, id));
  };

  if (serieId === null) {
    aplicarConteudo(tarefa, envio, agora);
    tarefa.data = dados.data;
    aplicarSituacao(banco, tarefa, dados.situacao, agora);
    if (dados.recorrencia) iniciarSerie(banco, tarefa, dados.recorrencia, agora);
    return concluir();
  }

  const regraMudou = !mesmaRecorrencia(tarefa.recorrencia, dados.recorrencia);
  if (lerEscopo(requisicao) === 'SOMENTE_ESTA') {
    if (regraMudou) {
      return dadosInvalidos([{ campo: 'frequencia', mensagem: 'Para mudar a repetição, aplique a alteração a esta e às próximas.' }]);
    }
    aplicarConteudo(tarefa, envio, agora);
    tarefa.data = dados.data;
    aplicarSituacao(banco, tarefa, dados.situacao, agora);
    return concluir();
  }

  const dataOriginal = tarefa.data ?? '';
  const seguintes = ocorrenciasDaSerie(banco, serieId).filter((item) => item.id !== id && item.data !== null && item.data > dataOriginal);

  if (!regraMudou && dados.data === tarefa.data) {
    [tarefa, ...seguintes].forEach((item) => aplicarConteudo(item, envio, agora));
    aplicarSituacao(banco, tarefa, dados.situacao, agora);
    return concluir();
  }

  encerrarSerieAntesDe(banco, serieId, dataOriginal);
  const idsRemovidos = new Set(seguintes.filter(emAbertoArmazenada).map((item) => item.id));
  banco.tarefas = banco.tarefas.filter((item) => !idsRemovidos.has(item.id));
  removerEventosDasTarefas(banco, idsRemovidos);
  const datasPreservadas = new Set(seguintes.filter((item) => !idsRemovidos.has(item.id)).map((item) => item.data ?? ''));

  aplicarConteudo(tarefa, envio, agora);
  tarefa.data = dados.data;
  tarefa.serieId = null;
  tarefa.recorrencia = null;
  aplicarSituacao(banco, tarefa, dados.situacao, agora);
  if (dados.recorrencia) iniciarSerie(banco, tarefa, dados.recorrencia, agora, datasPreservadas);
  return concluir();
}

export function excluirTarefa(banco: BancoSimulado, requisicao: RequisicaoTransporte, _agora: Date, id: number): RespostaTransporte {
  const tarefa = banco.tarefas.find((item) => item.id === id);
  if (!tarefa) return naoEncontrado('Esta tarefa não existe mais.');

  const idsRemovidos = new Set([id]);
  if (tarefa.serieId !== null && lerEscopo(requisicao) === 'ESTA_E_PROXIMAS' && tarefa.data) {
    const data = tarefa.data;
    ocorrenciasDaSerie(banco, tarefa.serieId)
      .filter((item) => item.data !== null && item.data > data && emAbertoArmazenada(item))
      .forEach((item) => idsRemovidos.add(item.id));
    encerrarSerieAntesDe(banco, tarefa.serieId, data);
  }

  banco.tarefas = banco.tarefas.filter((item) => !idsRemovidos.has(item.id));
  removerEventosDasTarefas(banco, idsRemovidos);
  salvarBanco();
  return semConteudo();
}

export function reagendarTarefas(banco: BancoSimulado, requisicao: RequisicaoTransporte, agora: Date): RespostaTransporte {
  const itens = (requisicao.corpo as ReagendamentoDTO | undefined)?.itens;
  if (!Array.isArray(itens) || itens.length === 0) return requisicaoInvalida('Informe ao menos uma tarefa para reagendar.');

  const ausente = itens.find((item) => !banco.tarefas.some((tarefa) => tarefa.id === item.id));
  if (ausente) return naoEncontrado('Uma das tarefas não existe mais.');

  for (const item of itens) {
    const tarefa = banco.tarefas.find((atual) => atual.id === item.id);
    if (!tarefa || tarefa.data === item.data) continue;
    const antes = { prioridade: tarefa.prioridade, data: tarefa.data };
    tarefa.data = item.data;
    tarefa.atualizadoEm = agora.toISOString();
    registrarMudancasRelevantes(banco, tarefa, antes, agora);
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
