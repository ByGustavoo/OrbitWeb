import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { CHAVE_TEMA } from '@/configuracoes/aplicacao';
import { gravarArmazenamentoLocal, lerArmazenamentoLocal } from '@/ganchos/useArmazenamentoLocal';

export type ModoTema = 'claro' | 'escuro' | 'sistema';
export type TemaAplicado = 'claro' | 'escuro';

interface ValorContextoTema {
  modo: ModoTema;
  tema: TemaAplicado;
  definirModo: (modo: ModoTema) => void;
  alternarTema: () => void;
}

const ContextoTema = createContext<ValorContextoTema | null>(null);

const CONSULTA_TEMA_ESCURO = '(prefers-color-scheme: dark)';
const CLASSE_TROCANDO_TEMA = 'trocando-tema';
const DURACAO_TROCA_TEMA_MS = 420;

let temporizadorTroca = 0;

function suavizarTroca(): void {
  const raiz = document.documentElement;
  raiz.classList.add(CLASSE_TROCANDO_TEMA);
  window.clearTimeout(temporizadorTroca);
  temporizadorTroca = window.setTimeout(() => raiz.classList.remove(CLASSE_TROCANDO_TEMA), DURACAO_TROCA_TEMA_MS);
}

function lerModoSalvo(): ModoTema {
  const salvo = lerArmazenamentoLocal<string>(CHAVE_TEMA, 'sistema');
  return salvo === 'claro' || salvo === 'escuro' ? salvo : 'sistema';
}

function temaDoSistema(): TemaAplicado {
  return window.matchMedia(CONSULTA_TEMA_ESCURO).matches ? 'escuro' : 'claro';
}

export function ProvedorTema({ children }: { children: ReactNode }) {
  const [modo, setModo] = useState<ModoTema>(lerModoSalvo);
  const [preferenciaSistema, setPreferenciaSistema] = useState<TemaAplicado>(temaDoSistema);

  useEffect(() => {
    const consulta = window.matchMedia(CONSULTA_TEMA_ESCURO);
    const atualizar = (evento: MediaQueryListEvent) => setPreferenciaSistema(evento.matches ? 'escuro' : 'claro');
    consulta.addEventListener('change', atualizar);
    return () => consulta.removeEventListener('change', atualizar);
  }, []);

  const tema: TemaAplicado = modo === 'sistema' ? preferenciaSistema : modo;

  useEffect(() => {
    document.documentElement.dataset.tema = tema;
  }, [tema]);

  const definirModo = useCallback((proximo: ModoTema) => {
    suavizarTroca();
    setModo(proximo);
    gravarArmazenamentoLocal(CHAVE_TEMA, proximo);
  }, []);

  const alternarTema = useCallback(() => {
    definirModo(tema === 'escuro' ? 'claro' : 'escuro');
  }, [definirModo, tema]);

  const valor = useMemo<ValorContextoTema>(
    () => ({ modo, tema, definirModo, alternarTema }),
    [modo, tema, definirModo, alternarTema],
  );

  return <ContextoTema.Provider value={valor}>{children}</ContextoTema.Provider>;
}

export function useTema(): ValorContextoTema {
  const contexto = useContext(ContextoTema);
  if (!contexto) throw new Error('useTema precisa estar dentro de <ProvedorTema>.');
  return contexto;
}
