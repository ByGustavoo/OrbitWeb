import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

export type RecursoAlteravel = 'tarefas' | 'sessoes' | 'atividades' | 'categorias';

type Versoes = Record<RecursoAlteravel, number>;

interface ValorContextoAlteracoes {
  versoes: Versoes;
  notificarAlteracao: (...recursos: RecursoAlteravel[]) => void;
}

const ContextoAlteracoes = createContext<ValorContextoAlteracoes | null>(null);

export function ProvedorAlteracoes({ children }: { children: ReactNode }) {
  const [versoes, setVersoes] = useState<Versoes>({ tarefas: 0, sessoes: 0, atividades: 0, categorias: 0 });

  const notificarAlteracao = useCallback((...recursos: RecursoAlteravel[]) => {
    setVersoes((atuais) => {
      const proximas = { ...atuais };
      recursos.forEach((recurso) => {
        proximas[recurso] += 1;
      });
      return proximas;
    });
  }, []);

  const valor = useMemo(() => ({ versoes, notificarAlteracao }), [versoes, notificarAlteracao]);

  return <ContextoAlteracoes.Provider value={valor}>{children}</ContextoAlteracoes.Provider>;
}

export function useAlteracoes(): ValorContextoAlteracoes {
  const contexto = useContext(ContextoAlteracoes);
  if (!contexto) throw new Error('useAlteracoes precisa estar dentro de <ProvedorAlteracoes>.');
  return contexto;
}
