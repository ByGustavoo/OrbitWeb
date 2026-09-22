import type { Cor, Prioridade } from './enumeracoes';

export interface ParCores {
  texto: string;
  fundo: string;
}

export function coresDaPaleta(cor: Cor): ParCores {
  const nome = cor.toLowerCase();
  return { texto: `var(--cor-${nome})`, fundo: `var(--cor-${nome}-suave)` };
}

export function coresDaPrioridade(prioridade: Prioridade): ParCores {
  const nome = prioridade.toLowerCase();
  return { texto: `var(--prioridade-${nome})`, fundo: `var(--prioridade-${nome}-suave)` };
}
