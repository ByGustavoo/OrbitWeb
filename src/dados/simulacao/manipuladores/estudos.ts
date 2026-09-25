import type { RequisicaoTransporte, RespostaTransporte } from '@/api/transporte';
import type { ErroCampoDTO, PaginaDTO } from '@/modelos/comum';
import type {
  EstudoPorAtividadeDTO,
  MapaCalorDTO,
  ProgressoMetaDTO,
  ResumoEstudosDTO,
  SessaoEnvioDTO,
  SessaoEstudoDTO,
} from '@/modelos/estudos';
import { validarSessao } from '@/regras/validacaoSessao';
import { adicionarDiasIso, ehDataIsoValida, intervaloDeDias } from '@/utilitarios/datas';
import { gerarId, salvarBanco } from '../bancoSimulado';
import type { BancoSimulado, SessaoArmazenada } from '../bancoSimulado';
import { diaDoInstante, minutosDaSessao, numero, texto } from '../consultas';
import { criado, dadosInvalidos, naoEncontrado, ok, requisicaoInvalida, semConteudo } from '../resposta';

export function minutosPorDia(banco: BancoSimulado, dataInicial: string, dataFinal: string): Map<string, number> {
  const minutos = new Map(intervaloDeDias(dataInicial, dataFinal).map((dia) => [dia, 0]));
  for (const sessao of banco.sessoes) {
    const dia = diaDoInstante(sessao.inicio);
    if (minutos.has(dia)) minutos.set(dia, (minutos.get(dia) ?? 0) + minutosDaSessao(sessao));
  }
  return minutos;
}

export function minutosPorAtividade(banco: BancoSimulado, dataInicial: string, dataFinal: string) {
  const totais = new Map<number, number>();
  for (const sessao of banco.sessoes) {
    const dia = diaDoInstante(sessao.inicio);
    if (dia < dataInicial || dia > dataFinal) continue;
    totais.set(sessao.atividadeId, (totais.get(sessao.atividadeId) ?? 0) + minutosDaSessao(sessao));
  }
  return banco.atividades
    .filter((atividade) => (totais.get(atividade.id) ?? 0) > 0)
    .map((atividade) => ({
      atividade: { id: atividade.id, nome: atividade.nome, cor: atividade.cor },
      minutos: totais.get(atividade.id) ?? 0,
    }))
    .sort((a, b) => b.minutos - a.minutos);
}

export function buscarMapaCalor(banco: BancoSimulado, requisicao: RequisicaoTransporte): RespostaTransporte {
  const dataInicial = texto(requisicao.consulta, 'dataInicial');
  const dataFinal = texto(requisicao.consulta, 'dataFinal');
  if (!dataInicial || !dataFinal) return requisicaoInvalida('Informe dataInicial e dataFinal.');

  const [maisEstudada] = minutosPorAtividade(banco, dataInicial, dataFinal);
  const resposta: MapaCalorDTO = {
    dias: [...minutosPorDia(banco, dataInicial, dataFinal)].map(([data, minutos]) => ({ data, minutos })),
    atividadeMaisEstudada: maisEstudada ? { ...maisEstudada.atividade, minutos: maisEstudada.minutos } : null,
  };
  return ok(resposta);
}

export function buscarProgressoSemanal(banco: BancoSimulado, requisicao: RequisicaoTransporte): RespostaTransporte {
  const inicioSemana = texto(requisicao.consulta, 'inicioSemana');
  if (!inicioSemana) return requisicaoInvalida('Informe inicioSemana.');

  return ok(progressoDasMetas(banco, inicioSemana));
}

export function progressoDasMetas(banco: BancoSimulado, inicioSemana: string): ProgressoMetaDTO[] {
  const realizados = new Map(
    minutosPorAtividade(banco, inicioSemana, adicionarDiasIso(inicioSemana, 6)).map((item) => [item.atividade.id, item.minutos]),
  );
  return banco.atividades
    .filter((atividade) => !atividade.arquivada && atividade.metaSemanalMinutos !== null)
    .map((atividade) => ({
      atividade: { id: atividade.id, nome: atividade.nome, cor: atividade.cor },
      metaMinutos: atividade.metaSemanalMinutos ?? 0,
      minutosRealizados: realizados.get(atividade.id) ?? 0,
    }));
}

export function paraDTO(banco: BancoSimulado, sessao: SessaoArmazenada): SessaoEstudoDTO {
  const atividade = banco.atividades.find((item) => item.id === sessao.atividadeId);
  const tarefa = sessao.tarefaId === null ? undefined : banco.tarefas.find((item) => item.id === sessao.tarefaId);
  return {
    id: sessao.id,
    atividade: atividade
      ? { id: atividade.id, nome: atividade.nome, cor: atividade.cor }
      : { id: sessao.atividadeId, nome: 'Atividade removida', cor: 'CINZA' },
    tarefa: tarefa ? { id: tarefa.id, titulo: tarefa.titulo } : null,
    modo: sessao.modo,
    origem: sessao.origem,
    inicio: sessao.inicio,
    fim: sessao.fim,
    duracaoSegundos: sessao.duracaoSegundos,
    ciclosConcluidos: sessao.ciclosConcluidos ?? null,
    observacao: sessao.observacao ?? null,
  };
}

interface FiltroPeriodo {
  dataInicial?: string;
  dataFinal?: string;
  atividadeId?: number;
}

function lerFiltroPeriodo(requisicao: RequisicaoTransporte): FiltroPeriodo | RespostaTransporte {
  const dataInicial = texto(requisicao.consulta, 'dataInicial');
  const dataFinal = texto(requisicao.consulta, 'dataFinal');
  const atividade = Number(texto(requisicao.consulta, 'atividadeId'));
  if ((dataInicial && !ehDataIsoValida(dataInicial)) || (dataFinal && !ehDataIsoValida(dataFinal))) {
    return requisicaoInvalida('Informe datas no formato AAAA-MM-DD.');
  }
  if (dataInicial && dataFinal && dataInicial > dataFinal) return requisicaoInvalida('A data inicial precisa ser antes da final.');
  return { dataInicial, dataFinal, atividadeId: Number.isInteger(atividade) && atividade > 0 ? atividade : undefined };
}

function ehRespostaTransporte(valor: object): valor is RespostaTransporte {
  return 'status' in valor;
}

function sessoesDoPeriodo(banco: BancoSimulado, filtro: FiltroPeriodo): SessaoArmazenada[] {
  return banco.sessoes.filter((sessao) => {
    const dia = diaDoInstante(sessao.inicio);
    if (filtro.dataInicial && dia < filtro.dataInicial) return false;
    if (filtro.dataFinal && dia > filtro.dataFinal) return false;
    if (filtro.atividadeId && sessao.atividadeId !== filtro.atividadeId) return false;
    return true;
  });
}

export function listarSessoes(banco: BancoSimulado, requisicao: RequisicaoTransporte): RespostaTransporte {
  const filtro = lerFiltroPeriodo(requisicao);
  if (ehRespostaTransporte(filtro)) return filtro;
  const pagina = Math.max(0, numero(requisicao.consulta, 'pagina', 0));
  const tamanho = Math.min(100, Math.max(1, numero(requisicao.consulta, 'tamanho', 20)));

  const filtradas = sessoesDoPeriodo(banco, filtro).sort((a, b) => b.inicio.localeCompare(a.inicio));
  const resposta: PaginaDTO<SessaoEstudoDTO> = {
    itens: filtradas.slice(pagina * tamanho, (pagina + 1) * tamanho).map((sessao) => paraDTO(banco, sessao)),
    pagina,
    tamanho,
    totalItens: filtradas.length,
    totalPaginas: Math.ceil(filtradas.length / tamanho),
  };
  return ok(resposta);
}

function lerEnvioSessao(
  banco: BancoSimulado,
  corpo: unknown,
  agora: Date,
  atividadeAtual: number | null,
): SessaoEnvioDTO | RespostaTransporte {
  if (!corpo || typeof corpo !== 'object' || typeof (corpo as SessaoEnvioDTO).inicio !== 'string') {
    return requisicaoInvalida('Envie os dados da sessão.');
  }
  const bruto = corpo as SessaoEnvioDTO;
  const observacao = typeof bruto.observacao === 'string' ? bruto.observacao.trim() : '';
  const dados: SessaoEnvioDTO = {
    ...bruto,
    modo: bruto.modo === 'POMODORO' ? 'POMODORO' : 'LIVRE',
    origem: bruto.origem === 'CRONOMETRO' ? 'CRONOMETRO' : 'MANUAL',
    duracaoSegundos: Math.round(Number(bruto.duracaoSegundos)),
    ciclosConcluidos: bruto.modo === 'POMODORO' && Number.isInteger(bruto.ciclosConcluidos) ? bruto.ciclosConcluidos : null,
    observacao: observacao ? observacao : null,
  };

  const erros: ErroCampoDTO[] = Object.entries(validarSessao(dados, agora)).map(([campo, mensagem]) => ({ campo, mensagem: mensagem ?? '' }));
  const atividade = banco.atividades.find((item) => item.id === dados.atividadeId);
  if (!erros.some((erro) => erro.campo === 'atividadeId')) {
    if (!atividade) erros.push({ campo: 'atividadeId', mensagem: 'Esta atividade não existe mais. Escolha outra.' });
    else if (atividade.arquivada && atividade.id !== atividadeAtual) {
      erros.push({ campo: 'atividadeId', mensagem: 'Esta atividade está arquivada. Escolha outra ou desarquive-a.' });
    }
  }
  if (erros.length > 0) return dadosInvalidos(erros);

  const tarefaExiste = dados.tarefaId !== null && banco.tarefas.some((tarefa) => tarefa.id === dados.tarefaId);
  return { ...dados, tarefaId: tarefaExiste ? dados.tarefaId : null };
}

export function criarSessao(banco: BancoSimulado, requisicao: RequisicaoTransporte, agora: Date): RespostaTransporte {
  const dados = lerEnvioSessao(banco, requisicao.corpo, agora, null);
  if (ehRespostaTransporte(dados)) return dados;

  const sessao: SessaoArmazenada = { id: gerarId(), ...dados };
  banco.sessoes.push(sessao);
  salvarBanco();
  return criado(paraDTO(banco, sessao));
}

export function atualizarSessao(banco: BancoSimulado, requisicao: RequisicaoTransporte, agora: Date, id: number): RespostaTransporte {
  const sessao = banco.sessoes.find((item) => item.id === id);
  if (!sessao) return naoEncontrado('Esta sessão não existe mais.');

  const dados = lerEnvioSessao(banco, requisicao.corpo, agora, sessao.atividadeId);
  if (ehRespostaTransporte(dados)) return dados;

  Object.assign(sessao, { ...dados, modo: sessao.modo, origem: sessao.origem, tarefaId: sessao.tarefaId });
  salvarBanco();
  return ok(paraDTO(banco, sessao));
}

export function excluirSessao(banco: BancoSimulado, _requisicao: RequisicaoTransporte, _agora: Date, id: number): RespostaTransporte {
  if (!banco.sessoes.some((item) => item.id === id)) return naoEncontrado('Esta sessão não existe mais.');
  banco.sessoes = banco.sessoes.filter((item) => item.id !== id);
  salvarBanco();
  return semConteudo();
}

export function buscarResumoEstudos(banco: BancoSimulado, requisicao: RequisicaoTransporte): RespostaTransporte {
  const filtro = lerFiltroPeriodo(requisicao);
  if (ehRespostaTransporte(filtro)) return filtro;
  const sessoes = sessoesDoPeriodo(banco, filtro);

  const porAtividade = new Map<number, EstudoPorAtividadeDTO>();
  const porDia = new Map(
    filtro.dataInicial && filtro.dataFinal
      ? intervaloDeDias(filtro.dataInicial, filtro.dataFinal).map((dia) => [dia, { segundos: 0, sessoes: 0 }])
      : [],
  );
  let totalSegundos = 0;

  for (const sessao of sessoes) {
    totalSegundos += sessao.duracaoSegundos;
    const dia = diaDoInstante(sessao.inicio);
    const totalDia = porDia.get(dia);
    if (totalDia) {
      totalDia.segundos += sessao.duracaoSegundos;
      totalDia.sessoes += 1;
    }

    const { atividade } = paraDTO(banco, sessao);
    const atual = porAtividade.get(atividade.id) ?? { atividade, segundos: 0, sessoes: 0, ultimaSessaoEm: null };
    atual.segundos += sessao.duracaoSegundos;
    atual.sessoes += 1;
    if (!atual.ultimaSessaoEm || sessao.fim > atual.ultimaSessaoEm) atual.ultimaSessaoEm = sessao.fim;
    porAtividade.set(atividade.id, atual);
  }

  const resposta: ResumoEstudosDTO = {
    totalSegundos,
    totalSessoes: sessoes.length,
    mediaSegundosPorSessao: sessoes.length > 0 ? Math.round(totalSegundos / sessoes.length) : 0,
    porDia: [...porDia].map(([data, total]) => ({ data, ...total })),
    porAtividade: [...porAtividade.values()].sort((a, b) => b.segundos - a.segundos),
  };
  return ok(resposta);
}
