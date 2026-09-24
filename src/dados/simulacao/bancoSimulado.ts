import type { CategoriaDTO } from '@/modelos/comum';
import type { Cor, ModoCronometro, OrigemSessao, TipoEventoTarefa } from '@/modelos/enumeracoes';
import type { NotaSemanaDTO } from '@/modelos/revisao';
import type { RecorrenciaDTO, TarefaDTO } from '@/modelos/tarefas';
import { VERSAO_BANCO, gerarSementes } from './sementes';

export type TarefaArmazenada = Omit<TarefaDTO, 'prazo'>;

export interface AtividadeArmazenada {
  id: number;
  nome: string;
  cor: Cor;
  metaSemanalMinutos: number | null;
  arquivada: boolean;
}

export interface SessaoArmazenada {
  id: number;
  atividadeId: number;
  tarefaId: number | null;
  modo: ModoCronometro;
  origem: OrigemSessao;
  inicio: string;
  fim: string;
  duracaoSegundos: number;
  ciclosConcluidos: number | null;
  observacao: string | null;
}

export interface SerieArmazenada {
  id: number;
  dataInicial: string;
  recorrencia: RecorrenciaDTO;
  geradaAte: string;
}

export interface EventoArmazenado {
  id: number;
  tipo: TipoEventoTarefa;
  tarefaId: number;
  titulo: string;
  ocorridoEm: string;
  anterior: string | null;
  novo: string | null;
}

export interface BancoSimulado {
  versao: number;
  proximoId: number;
  categorias: CategoriaDTO[];
  atividades: AtividadeArmazenada[];
  tarefas: TarefaArmazenada[];
  series: SerieArmazenada[];
  sessoes: SessaoArmazenada[];
  eventos: EventoArmazenado[];
  notasSemana: Record<string, NotaSemanaDTO>;
}

const CHAVE_BANCO = 'orbit:simulacao:banco';

let banco: BancoSimulado | null = null;

function lerBancoSalvo(): BancoSimulado | null {
  try {
    const salvo = window.localStorage.getItem(CHAVE_BANCO);
    if (!salvo) return null;
    const lido = JSON.parse(salvo) as BancoSimulado;
    return lido.versao === VERSAO_BANCO ? lido : null;
  } catch {
    return null;
  }
}

export function obterBanco(): BancoSimulado {
  if (banco) return banco;
  const salvo = lerBancoSalvo();
  if (salvo) {
    banco = salvo;
    return banco;
  }
  banco = gerarSementes(new Date());
  salvarBanco();
  return banco;
}

export function salvarBanco(): void {
  if (!banco) return;
  try {
    window.localStorage.setItem(CHAVE_BANCO, JSON.stringify(banco));
  } catch {
    return;
  }
}

export function restaurarBanco(): void {
  banco = gerarSementes(new Date());
  salvarBanco();
}

export function esvaziarBanco(): void {
  banco = {
    versao: VERSAO_BANCO,
    proximoId: 1,
    categorias: [],
    atividades: [],
    tarefas: [],
    series: [],
    sessoes: [],
    eventos: [],
    notasSemana: {},
  };
  salvarBanco();
}

export function gerarId(): number {
  const atual = obterBanco();
  atual.proximoId += 1;
  return atual.proximoId;
}
