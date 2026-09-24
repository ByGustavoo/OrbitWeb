import { rotasApi } from '@/api/rotasApi';
import type { MetodoHttp, RequisicaoTransporte, RespostaTransporte, Transporte } from '@/api/transporte';
import { esvaziarBanco, obterBanco, restaurarBanco } from './bancoSimulado';
import type { BancoSimulado } from './bancoSimulado';
import { buscarResumo, buscarSequencia } from './manipuladores/dashboard';
import { buscarMapaCalor, buscarProgressoSemanal } from './manipuladores/estudos';
import { alterarSituacao, listarTarefas, reagendarTarefas, resumirCalendario } from './manipuladores/tarefas';
import { naoEncontrado, problema } from './resposta';

type Manipulador = (banco: BancoSimulado, requisicao: RequisicaoTransporte, agora: Date, id: number) => RespostaTransporte;

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
  { metodo: 'GET', padrao: exato(rotasApi.tarefas.resumoCalendario), manipulador: resumirCalendario },
  { metodo: 'POST', padrao: exato(rotasApi.tarefas.reagendamentos), manipulador: reagendarTarefas },
  { metodo: 'PATCH', padrao: /^\/tarefas\/(\d+)\/situacao$/, manipulador: alterarSituacao },
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

  for (const rota of rotas) {
    if (rota.metodo !== requisicao.metodo) continue;
    const correspondencia = rota.padrao.exec(requisicao.caminho);
    if (!correspondencia) continue;
    return rota.manipulador(obterBanco(), requisicao, new Date(), Number(correspondencia[1] ?? 0));
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
