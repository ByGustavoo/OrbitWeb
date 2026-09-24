import type { CSSProperties } from 'react';
import { juntarClasses } from '@/utilitarios/juntarClasses';
import estilos from './BarraProgresso.module.css';

export interface BarraProgressoProps {
  valor: number;
  maximo: number;
  rotulo: string;
  textoValor?: string;
  tom?: 'destaque' | 'sucesso';
  cor?: string;
  className?: string;
}

export function BarraProgresso({ valor, maximo, rotulo, textoValor, tom = 'destaque', cor, className }: BarraProgressoProps) {
  const proporcao = maximo > 0 ? Math.min(1, Math.max(0, valor / maximo)) : 0;
  const estilo = { '--proporcao': proporcao, ...(cor ? { '--cor-barra': cor } : {}) } as CSSProperties;

  return (
    <div
      className={juntarClasses(estilos.trilho, estilos[tom], className)}
      role="progressbar"
      aria-label={rotulo}
      aria-valuemin={0}
      aria-valuemax={maximo}
      aria-valuenow={Math.min(valor, maximo)}
      aria-valuetext={textoValor}
      style={estilo}
    >
      <span className={estilos.preenchimento} />
    </div>
  );
}
