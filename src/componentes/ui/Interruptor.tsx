import { useId } from 'react';
import { juntarClasses } from '@/utilitarios/juntarClasses';
import estilos from './Interruptor.module.css';

export interface InterruptorProps {
  rotulo: string;
  descricao?: string;
  ligado: boolean;
  aoMudar: (ligado: boolean) => void;
  desabilitado?: boolean;
  className?: string;
}

export function Interruptor({ rotulo, descricao, ligado, aoMudar, desabilitado, className }: InterruptorProps) {
  const id = useId();

  return (
    <div className={juntarClasses(estilos.interruptor, desabilitado && estilos.desabilitado, className)}>
      <span className={estilos.textos}>
        <label className={estilos.rotulo} htmlFor={id}>
          {rotulo}
        </label>
        {descricao ? (
          <span className={estilos.descricao} id={`${id}-descricao`}>
            {descricao}
          </span>
        ) : null}
      </span>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={ligado}
        aria-describedby={descricao ? `${id}-descricao` : undefined}
        disabled={desabilitado}
        className={estilos.trilho}
        onClick={() => aoMudar(!ligado)}
      >
        <span className={estilos.botao} aria-hidden="true" />
      </button>
    </div>
  );
}
