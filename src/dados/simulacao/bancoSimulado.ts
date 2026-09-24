import type { CategoriaDTO } from '@/modelos/comum';
import type { Cor, ModoCronometro, OrigemSessao } from '@/modelos/enumeracoes';
import type { EventoRecenteDTO } from '@/modelos/painel';
import type { TarefaDTO } from '@/modelos/tarefas';
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
}

export interface BancoSimulado {
  versao: number;
  proximoId: number;
  categorias: CategoriaDTO[];
  atividades: AtividadeArmazenada[];
  tarefas: TarefaArmazenada[];
  sessoes: SessaoArmazenada[];
  eventos: EventoRecenteDTO[];
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
    sessoes: [],
    eventos: [],
  };
  salvarBanco();
}

export function gerarId(): number {
  const atual = obterBanco();
  atual.proximoId += 1;
  return atual.proximoId;
}
