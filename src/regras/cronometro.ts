import type { ModoCronometro } from '@/modelos/enumeracoes';
import type { ResumoTarefaSessaoDTO, SessaoEnvioDTO } from '@/modelos/estudos';
import type { ResumoAtividadeDTO } from '@/modelos/tarefas';

export type FasePomodoro = 'FOCO' | 'PAUSA_CURTA' | 'PAUSA_LONGA';

export type EstadoCronometro = 'RODANDO' | 'PAUSADA';

export interface DuracoesPomodoro {
  focoSegundos: number;
  pausaCurtaSegundos: number;
  pausaLongaSegundos: number;
  ciclosAtePausaLonga: number;
}

export const DURACOES_POMODORO_PADRAO: DuracoesPomodoro = {
  focoSegundos: 25 * 60,
  pausaCurtaSegundos: 5 * 60,
  pausaLongaSegundos: 15 * 60,
  ciclosAtePausaLonga: 4,
};

export const DURACAO_MINIMA_SESSAO_SEGUNDOS = 60;

export const VERSAO_SESSAO_EM_ANDAMENTO = 1;

export interface EstadoPomodoro {
  fase: FasePomodoro;
  msFaseAcumulados: number;
  ciclosConcluidos: number;
  duracoes: DuracoesPomodoro;
}

export interface SessaoEmAndamento {
  versao: number;
  atividade: ResumoAtividadeDTO;
  tarefa: ResumoTarefaSessaoDTO | null;
  modo: ModoCronometro;
  iniciadaEm: string;
  estado: EstadoCronometro;
  retomadaEm: string | null;
  msEstudoAcumulados: number;
  pausas: number;
  pomodoro: EstadoPomodoro | null;
  encerradaEm: string | null;
  retomarAoContinuar: boolean;
}

export interface LeituraCronometro {
  segundosEstudo: number;
  fase: FasePomodoro | null;
  segundosFase: number;
  segundosRestantesFase: number;
  duracaoFaseSegundos: number;
  faseConcluida: boolean;
  ciclosConcluidos: number;
  proximaFase: FasePomodoro | null;
}

export interface NovaSessao {
  atividade: ResumoAtividadeDTO;
  tarefa?: ResumoTarefaSessaoDTO | null;
  modo: ModoCronometro;
  duracoes?: DuracoesPomodoro;
}

export function iniciarSessao({ atividade, tarefa = null, modo, duracoes = DURACOES_POMODORO_PADRAO }: NovaSessao, agora: Date): SessaoEmAndamento {
  const instante = agora.toISOString();
  return {
    versao: VERSAO_SESSAO_EM_ANDAMENTO,
    atividade,
    tarefa,
    modo,
    iniciadaEm: instante,
    estado: 'RODANDO',
    retomadaEm: instante,
    msEstudoAcumulados: 0,
    pausas: 0,
    pomodoro: modo === 'POMODORO' ? { fase: 'FOCO', msFaseAcumulados: 0, ciclosConcluidos: 0, duracoes: { ...duracoes } } : null,
    encerradaEm: null,
    retomarAoContinuar: false,
  };
}

export function duracaoDaFase(fase: FasePomodoro, duracoes: DuracoesPomodoro): number {
  if (fase === 'PAUSA_CURTA') return duracoes.pausaCurtaSegundos;
  if (fase === 'PAUSA_LONGA') return duracoes.pausaLongaSegundos;
  return duracoes.focoSegundos;
}

function msDoTrecho(sessao: SessaoEmAndamento, agora: Date): number {
  if (sessao.estado !== 'RODANDO' || !sessao.retomadaEm) return 0;
  return Math.max(0, agora.getTime() - new Date(sessao.retomadaEm).getTime());
}

function msAproveitadosNaFase(pomodoro: EstadoPomodoro, msTrecho: number): number {
  const limite = duracaoDaFase(pomodoro.fase, pomodoro.duracoes) * 1000;
  return Math.max(0, Math.min(msTrecho, limite - pomodoro.msFaseAcumulados));
}

function faseSeguinte(pomodoro: EstadoPomodoro, ciclosConcluidos: number): FasePomodoro {
  if (pomodoro.fase !== 'FOCO') return 'FOCO';
  return ciclosConcluidos > 0 && ciclosConcluidos % pomodoro.duracoes.ciclosAtePausaLonga === 0 ? 'PAUSA_LONGA' : 'PAUSA_CURTA';
}

export function lerCronometro(sessao: SessaoEmAndamento, agora: Date): LeituraCronometro {
  const msTrecho = msDoTrecho(sessao, agora);
  const pomodoro = sessao.pomodoro;

  if (!pomodoro) {
    return {
      segundosEstudo: Math.floor((sessao.msEstudoAcumulados + msTrecho) / 1000),
      fase: null,
      segundosFase: 0,
      segundosRestantesFase: 0,
      duracaoFaseSegundos: 0,
      faseConcluida: false,
      ciclosConcluidos: 0,
      proximaFase: null,
    };
  }

  const duracao = duracaoDaFase(pomodoro.fase, pomodoro.duracoes);
  const aproveitados = msAproveitadosNaFase(pomodoro, msTrecho);
  const msFase = pomodoro.msFaseAcumulados + aproveitados;
  const faseConcluida = msFase >= duracao * 1000;
  const msEstudo = sessao.msEstudoAcumulados + (pomodoro.fase === 'FOCO' ? aproveitados : 0);
  const ciclosConcluidos = pomodoro.ciclosConcluidos + (pomodoro.fase === 'FOCO' && faseConcluida ? 1 : 0);
  const segundosFase = Math.floor(msFase / 1000);

  return {
    segundosEstudo: Math.floor(msEstudo / 1000),
    fase: pomodoro.fase,
    segundosFase,
    segundosRestantesFase: Math.max(0, duracao - segundosFase),
    duracaoFaseSegundos: duracao,
    faseConcluida,
    ciclosConcluidos,
    proximaFase: faseSeguinte(pomodoro, ciclosConcluidos),
  };
}

function consolidarTrecho(sessao: SessaoEmAndamento, agora: Date): SessaoEmAndamento {
  const msTrecho = msDoTrecho(sessao, agora);
  const pomodoro = sessao.pomodoro;
  if (!pomodoro) return { ...sessao, msEstudoAcumulados: sessao.msEstudoAcumulados + msTrecho };

  const aproveitados = msAproveitadosNaFase(pomodoro, msTrecho);
  return {
    ...sessao,
    msEstudoAcumulados: sessao.msEstudoAcumulados + (pomodoro.fase === 'FOCO' ? aproveitados : 0),
    pomodoro: { ...pomodoro, msFaseAcumulados: pomodoro.msFaseAcumulados + aproveitados },
  };
}

export function pausarSessao(sessao: SessaoEmAndamento, agora: Date): SessaoEmAndamento {
  if (sessao.estado !== 'RODANDO' || sessao.encerradaEm) return sessao;
  return { ...consolidarTrecho(sessao, agora), estado: 'PAUSADA', retomadaEm: null, pausas: sessao.pausas + 1 };
}

export function retomarSessao(sessao: SessaoEmAndamento, agora: Date): SessaoEmAndamento {
  if (sessao.estado !== 'PAUSADA' || sessao.encerradaEm) return sessao;
  return { ...sessao, estado: 'RODANDO', retomadaEm: agora.toISOString() };
}

function mudarFase(sessao: SessaoEmAndamento, agora: Date, pularPausa: boolean): SessaoEmAndamento {
  if (!sessao.pomodoro || sessao.encerradaEm) return sessao;
  const leitura = lerCronometro(sessao, agora);
  const consolidada = consolidarTrecho(sessao, agora);
  const pomodoro = consolidada.pomodoro as EstadoPomodoro;
  const destino = pularPausa ? 'FOCO' : faseSeguinte(pomodoro, leitura.ciclosConcluidos);

  return {
    ...consolidada,
    estado: 'RODANDO',
    retomadaEm: agora.toISOString(),
    pomodoro: { ...pomodoro, fase: destino, msFaseAcumulados: 0, ciclosConcluidos: leitura.ciclosConcluidos },
  };
}

export function iniciarProximaFase(sessao: SessaoEmAndamento, agora: Date): SessaoEmAndamento {
  return mudarFase(sessao, agora, false);
}

export function pularPausa(sessao: SessaoEmAndamento, agora: Date): SessaoEmAndamento {
  if (!sessao.pomodoro) return sessao;
  const leitura = lerCronometro(sessao, agora);
  if (sessao.pomodoro.fase === 'FOCO' && !leitura.faseConcluida) return sessao;
  return mudarFase(sessao, agora, true);
}

export function encerrarSessao(sessao: SessaoEmAndamento, agora: Date): SessaoEmAndamento {
  if (sessao.encerradaEm) return sessao;
  return {
    ...consolidarTrecho(sessao, agora),
    estado: 'PAUSADA',
    retomadaEm: null,
    encerradaEm: agora.toISOString(),
    retomarAoContinuar: sessao.estado === 'RODANDO',
  };
}

export function continuarSessao(sessao: SessaoEmAndamento, agora: Date): SessaoEmAndamento {
  if (!sessao.encerradaEm) return sessao;
  const retomar = sessao.retomarAoContinuar;
  return {
    ...sessao,
    estado: retomar ? 'RODANDO' : 'PAUSADA',
    retomadaEm: retomar ? agora.toISOString() : null,
    encerradaEm: null,
    retomarAoContinuar: false,
  };
}

export function montarEnvioSessao(
  sessao: SessaoEmAndamento,
  opcoes: { observacao?: string | null; duracaoSegundos?: number | null },
  agora: Date,
): SessaoEnvioDTO {
  const leitura = lerCronometro(sessao, agora);
  const fim = sessao.encerradaEm ?? agora.toISOString();
  const observacao = opcoes.observacao?.trim() ?? '';
  return {
    atividadeId: sessao.atividade.id,
    tarefaId: sessao.tarefa?.id ?? null,
    modo: sessao.modo,
    origem: 'CRONOMETRO',
    inicio: sessao.iniciadaEm,
    fim,
    duracaoSegundos: opcoes.duracaoSegundos ?? leitura.segundosEstudo,
    ciclosConcluidos: sessao.pomodoro ? leitura.ciclosConcluidos : null,
    observacao: observacao ? observacao : null,
  };
}

export function segundosDeRelogio(sessao: SessaoEmAndamento, agora: Date): number {
  const fim = sessao.encerradaEm ? new Date(sessao.encerradaEm).getTime() : agora.getTime();
  return Math.max(0, Math.floor((fim - new Date(sessao.iniciadaEm).getTime()) / 1000));
}

function ehInstante(valor: unknown): valor is string {
  return typeof valor === 'string' && !Number.isNaN(new Date(valor).getTime());
}

function ehNumeroNaoNegativo(valor: unknown): valor is number {
  return typeof valor === 'number' && Number.isFinite(valor) && valor >= 0;
}

export function lerSessaoSalva(valor: unknown): SessaoEmAndamento | null {
  if (!valor || typeof valor !== 'object') return null;
  const sessao = valor as Partial<SessaoEmAndamento>;
  const atividade = sessao.atividade;
  if (sessao.versao !== VERSAO_SESSAO_EM_ANDAMENTO) return null;
  if (!atividade || typeof atividade.id !== 'number' || typeof atividade.nome !== 'string') return null;
  if (sessao.modo !== 'LIVRE' && sessao.modo !== 'POMODORO') return null;
  if (sessao.estado !== 'RODANDO' && sessao.estado !== 'PAUSADA') return null;
  if (!ehInstante(sessao.iniciadaEm) || !ehNumeroNaoNegativo(sessao.msEstudoAcumulados)) return null;
  if (sessao.estado === 'RODANDO' && !ehInstante(sessao.retomadaEm)) return null;
  if (sessao.encerradaEm !== null && !ehInstante(sessao.encerradaEm)) return null;
  if (sessao.modo === 'POMODORO') {
    const pomodoro = sessao.pomodoro;
    if (!pomodoro || !ehNumeroNaoNegativo(pomodoro.msFaseAcumulados) || !ehNumeroNaoNegativo(pomodoro.ciclosConcluidos)) return null;
    if (!['FOCO', 'PAUSA_CURTA', 'PAUSA_LONGA'].includes(pomodoro.fase)) return null;
  }
  return {
    ...(sessao as SessaoEmAndamento),
    pausas: ehNumeroNaoNegativo(sessao.pausas) ? sessao.pausas : 0,
    retomarAoContinuar: sessao.retomarAoContinuar === true,
    tarefa: sessao.tarefa ?? null,
    pomodoro: sessao.modo === 'POMODORO' ? (sessao.pomodoro as EstadoPomodoro) : null,
  };
}
