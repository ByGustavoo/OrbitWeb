import type { ReactNode } from 'react';
import type { ResultadoAssincrono } from '@/ganchos/useDadosAssincronos';
import { EstadoErro } from './EstadoErro';

export interface ConteudoAssincronoProps<T> {
  resultado: ResultadoAssincrono<T>;
  esqueleto: ReactNode;
  tituloErro: string;
  children: (dados: T) => ReactNode;
}

export function ConteudoAssincrono<T>({ resultado, esqueleto, tituloErro, children }: ConteudoAssincronoProps<T>) {
  if (resultado.dados !== null) return <>{children(resultado.dados)}</>;
  if (resultado.erro) {
    return (
      <EstadoErro
        compacto
        titulo={tituloErro}
        erro={resultado.erro}
        aoTentarNovamente={resultado.recarregar}
        tentando={resultado.carregando}
      />
    );
  }
  return <>{esqueleto}</>;
}
