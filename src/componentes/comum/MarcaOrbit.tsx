import { juntarClasses } from '@/utilitarios/juntarClasses';
import estilos from './MarcaOrbit.module.css';

interface MarcaOrbitProps {
  tamanho?: number;
  animarEntrada?: boolean;
}

export function MarcaOrbit({ tamanho = 32, animarEntrada = false }: MarcaOrbitProps) {
  return (
    <svg
      className={juntarClasses(estilos.marca, animarEntrada && estilos.entrando)}
      width={tamanho}
      height={tamanho}
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="32" height="32" rx="9" className={estilos.fundo} />
      <g transform="rotate(-28 16 16)">
        <ellipse cx="16" cy="16" rx="10.5" ry="5.5" className={estilos.orbita} fill="none" strokeWidth="2" />
        <circle cx="16" cy="16" r="4.2" className={juntarClasses(estilos.nucleo, estilos.centro)} />
        <g className={estilos.satelite}>
          <circle r="2.2" className={estilos.nucleo} />
        </g>
      </g>
    </svg>
  );
}
