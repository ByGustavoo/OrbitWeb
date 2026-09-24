import { ambiente } from '@/configuracoes/ambiente';
import type { ProblemaDTO } from '@/modelos/comum';
import { ErroApi, tipoPorStatus } from './ErroApi';
import type { MetodoHttp, Transporte, ValorConsulta } from './transporte';
import { transporteFetch } from './transporteFetch';

export interface OpcoesRequisicao {
  consulta?: Record<string, ValorConsulta>;
  signal?: AbortSignal;
}

const TEMPO_LIMITE_MS = 15000;

let transporteCarregado: Promise<Transporte> | null = null;

function obterTransporte(): Promise<Transporte> {
  transporteCarregado ??=
    ambiente.fonteDados === 'simulada'
      ? import('@/dados/simulacao/transporteSimulado').then((modulo) => modulo.transporteSimulado)
      : Promise.resolve(transporteFetch);
  return transporteCarregado;
}

function fusoHorario(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'America/Sao_Paulo';
  }
}

function mensagemDoProblema(corpo: unknown, status: number): { mensagem: string; problema: ProblemaDTO } {
  const problema = corpo && typeof corpo === 'object' ? (corpo as ProblemaDTO) : {};
  return { mensagem: problema.detail ?? problema.title ?? `Falha na requisição (${status}).`, problema };
}

async function requisitar<T>(metodo: MetodoHttp, caminho: string, corpo: unknown, opcoes: OpcoesRequisicao = {}): Promise<T> {
  if (opcoes.signal?.aborted) throw new ErroApi('CANCELADO', 'A requisição foi cancelada.');

  const controlador = new AbortController();
  let expirou = false;
  const temporizador = window.setTimeout(() => {
    expirou = true;
    controlador.abort();
  }, TEMPO_LIMITE_MS);
  const cancelarExterno = () => controlador.abort();
  opcoes.signal?.addEventListener('abort', cancelarExterno, { once: true });

  try {
    const transporte = await obterTransporte();
    const resposta = await transporte({
      metodo,
      caminho,
      consulta: opcoes.consulta ?? {},
      corpo,
      cabecalhos: { 'X-Fuso-Horario': fusoHorario() },
      signal: controlador.signal,
    });

    if (resposta.status >= 400) {
      const { mensagem, problema } = mensagemDoProblema(resposta.corpo, resposta.status);
      throw new ErroApi(tipoPorStatus(resposta.status), mensagem, resposta.status, problema.erros ?? []);
    }

    return resposta.corpo as T;
  } catch (erro) {
    if (erro instanceof ErroApi) throw erro;
    if (controlador.signal.aborted) {
      if (expirou) throw new ErroApi('TEMPO_ESGOTADO', 'O servidor demorou demais para responder.');
      throw new ErroApi('CANCELADO', 'A requisição foi cancelada.');
    }
    throw new ErroApi('REDE', 'Não foi possível falar com o servidor.');
  } finally {
    window.clearTimeout(temporizador);
    opcoes.signal?.removeEventListener('abort', cancelarExterno);
  }
}

export const clienteHttp = {
  get: <T>(caminho: string, opcoes?: OpcoesRequisicao) => requisitar<T>('GET', caminho, undefined, opcoes),
  post: <T>(caminho: string, corpo?: unknown, opcoes?: OpcoesRequisicao) => requisitar<T>('POST', caminho, corpo, opcoes),
  put: <T>(caminho: string, corpo?: unknown, opcoes?: OpcoesRequisicao) => requisitar<T>('PUT', caminho, corpo, opcoes),
  patch: <T>(caminho: string, corpo?: unknown, opcoes?: OpcoesRequisicao) => requisitar<T>('PATCH', caminho, corpo, opcoes),
  delete: <T>(caminho: string, opcoes?: OpcoesRequisicao) => requisitar<T>('DELETE', caminho, undefined, opcoes),
};
