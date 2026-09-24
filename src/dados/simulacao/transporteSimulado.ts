import { rotasApi } from '@/api/rotasApi';
import type { MetodoHttp, RequisicaoTransporte, RespostaTransporte, Transporte } from '@/api/transporte';
import { esvaziarBanco, obterBanco, restaurarBanco, salvarBanco } from './bancoSimulado';
import type { BancoSimulado } from './bancoSimulado';
import {
  alterarArquivamento,
  atualizarAtividade,
  criarAtividade,
  excluirAtividade,
  listarAtividades,
  listarCategorias,
} from './manipuladores/cadastros';
import { buscarResumo, buscarSequencia } from './manipuladores/dashboard';
import {
  atualizarSessao,
  buscarMapaCalor,
  buscarProgressoSemanal,
  buscarResumoEstudos,
  criarSessao,
  excluirSessao,
  listarSessoes,
} from './manipuladores/estudos';
import { buscarDetalheHistorico, listarHistorico } from './manipuladores/historico';
import { buscarRevisaoSemanal, salvarNotaSemana } from './manipuladores/revisao';
import {
  alterarSituacao,
  atualizarTarefa,
  buscarTarefa,
  criarTarefa,
  excluirTarefa,
  listarTarefas,
  reagendarTarefas,
  resumirCalendario,
} from './manipuladores/tarefas';
import { estenderSeries } from './series';
import { naoEncontrado, problema } from './resposta';

type Manipulador = (
  banco: BancoSimulado,
  requisicao: RequisicaoTransporte,
  agora: Date,
  id: number,
  identificador: string,
) => RespostaTransporte;

interface Rota {
  metodo: MetodoHttp;
  padrao: RegExp;
  manipulador: Manipulador;
}

const CHAVE_FALHAS = 'orbit:simulacao:falhas';
const CHAVE_LATENCIA = 'orbit:simulacao:latencia';
const LATENCIA_MINIMA_MS = 200;
const LATENCIA_MAXIMA_MS = 500;

function exato(caminho: string): RegExp {
  return new RegExp(`^${caminho.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);
}

const rotas: Rota[] = [
  { metodo: 'GET', padrao: exato(rotasApi.tarefas.lista), manipulador: listarTarefas },
  { metodo: 'POST', padrao: exato(rotasApi.tarefas.lista), manipulador: criarTarefa },
  { metodo: 'GET', padrao: exato(rotasApi.tarefas.resumoCalendario), manipulador: resumirCalendario },
  { metodo: 'POST', padrao: exato(rotasApi.tarefas.reagendamentos), manipulador: reagendarTarefas },
  { metodo: 'PATCH', padrao: /^\/tarefas\/(\d+)\/situacao$/, manipulador: alterarSituacao },
  { metodo: 'GET', padrao: /^\/tarefas\/(\d+)$/, manipulador: buscarTarefa },
  { metodo: 'PUT', padrao: /^\/tarefas\/(\d+)$/, manipulador: atualizarTarefa },
  { metodo: 'DELETE', padrao: /^\/tarefas\/(\d+)$/, manipulador: excluirTarefa },
  { metodo: 'GET', padrao: exato(rotasApi.categorias.lista), manipulador: listarCategorias },
  { metodo: 'GET', padrao: exato(rotasApi.atividades.lista), manipulador: listarAtividades },
  { metodo: 'POST', padrao: exato(rotasApi.atividades.lista), manipulador: criarAtividade },
  { metodo: 'PATCH', padrao: /^\/atividades\/(\d+)\/arquivamento$/, manipulador: alterarArquivamento },
  { metodo: 'PUT', padrao: /^\/atividades\/(\d+)$/, manipulador: atualizarAtividade },
  { metodo: 'DELETE', padrao: /^\/atividades\/(\d+)$/, manipulador: excluirAtividade },
  { metodo: 'GET', padrao: exato(rotasApi.sessoes.lista), manipulador: listarSessoes },
  { metodo: 'POST', padrao: exato(rotasApi.sessoes.lista), manipulador: criarSessao },
  { metodo: 'PUT', padrao: /^\/sessoes\/(\d+)$/, manipulador: atualizarSessao },
  { metodo: 'DELETE', padrao: /^\/sessoes\/(\d+)$/, manipulador: excluirSessao },
  { metodo: 'GET', padrao: exato(rotasApi.estudos.resumo), manipulador: buscarResumoEstudos },
  { metodo: 'GET', padrao: exato(rotasApi.historico.lista), manipulador: listarHistorico },
  { metodo: 'GET', padrao: /^\/historico\/([a-z-]+-\d+)$/, manipulador: buscarDetalheHistorico },
  { metodo: 'GET', padrao: exato(rotasApi.revisaoSemanal.resumo), manipulador: buscarRevisaoSemanal },
  { metodo: 'PUT', padrao: /^\/revisao-semanal\/(\d{4}-\d{2}-\d{2})\/nota$/, manipulador: salvarNotaSemana },
  { metodo: 'GET', padrao: exato(rotasApi.dashboard.resumo), manipulador: buscarResumo },
  { metodo: 'GET', padrao: exato(rotasApi.dashboard.sequencia), manipulador: buscarSequencia },
  { metodo: 'GET', padrao: exato(rotasApi.estudos.mapaCalor), manipulador: buscarMapaCalor },
  { metodo: 'GET', padrao: exato(rotasApi.estudos.progressoSemanal), manipulador: buscarProgressoSemanal },
];

function deveFalhar(caminho: string): boolean {
  try {
    const configuracao = window.localStorage.getItem(CHAVE_FALHAS);
    if (!configuracao) return false;
    return configuracao === '*' || configuracao.split(',').some((trecho) => trecho && caminho.startsWith(trecho.trim()));
  } catch {
    return false;
  }
}

function latenciaConfigurada(): number | null {
  try {
    const valor = Number(window.localStorage.getItem(CHAVE_LATENCIA));
    return Number.isFinite(valor) && valor > 0 ? valor : null;
  } catch {
    return null;
  }
}

function esperar(signal: AbortSignal): Promise<void> {
  const atraso = latenciaConfigurada() ?? LATENCIA_MINIMA_MS + Math.random() * (LATENCIA_MAXIMA_MS - LATENCIA_MINIMA_MS);
  return new Promise((resolver, rejeitar) => {
    const temporizador = window.setTimeout(resolver, atraso);
    signal.addEventListener(
      'abort',
      () => {
        window.clearTimeout(temporizador);
        rejeitar(new DOMException('Requisição cancelada.', 'AbortError'));
      },
      { once: true },
    );
  });
}

export const transporteSimulado: Transporte = async (requisicao) => {
  await esperar(requisicao.signal);

  if (deveFalhar(requisicao.caminho)) {
    return problema(503, 'Serviço indisponível', 'Falha simulada pelo modo de desenvolvimento.');
  }

  const banco = obterBanco();
  const agora = new Date();
  if (estenderSeries(banco, agora)) salvarBanco();

  for (const rota of rotas) {
    if (rota.metodo !== requisicao.metodo) continue;
    const correspondencia = rota.padrao.exec(requisicao.caminho);
    if (!correspondencia) continue;
    const parametro = decodeURIComponent(correspondencia[1] ?? '');
    return rota.manipulador(banco, requisicao, agora, Number(parametro), parametro);
  }

  return naoEncontrado(`Rota ${requisicao.metodo} ${requisicao.caminho} não existe no simulador.`);
};

if (import.meta.env.DEV) {
  Object.assign(window, {
    orbitSimulacao: {
      restaurar: restaurarBanco,
      esvaziar: esvaziarBanco,
      falhar: (rotas: string | false = '*') => {
        if (rotas) window.localStorage.setItem(CHAVE_FALHAS, rotas);
        else window.localStorage.removeItem(CHAVE_FALHAS);
      },
      latencia: (milissegundos: number | false) => {
        if (milissegundos) window.localStorage.setItem(CHAVE_LATENCIA, String(milissegundos));
        else window.localStorage.removeItem(CHAVE_LATENCIA);
      },
    },
  });
}
