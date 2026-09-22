import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import { Check } from 'lucide-react';
import { juntarClasses } from '@/utilitarios/juntarClasses';
import estilos from './Marcador.module.css';

export interface CaixaSelecaoProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  rotulo: string;
  descricao?: string;
  invalida?: boolean;
}

export const CaixaSelecao = forwardRef<HTMLInputElement, CaixaSelecaoProps>(function CaixaSelecao(
  { rotulo, descricao, invalida, className, ...resto },
  ref,
) {
  return (
    <label className={juntarClasses(estilos.opcao, invalida && estilos.invalida, className)}>
      <span className={estilos.caixa}>
        <input ref={ref} type="checkbox" className={estilos.entrada} aria-invalid={invalida || undefined} {...resto} />
        <Check className={estilos.marca} size={14} strokeWidth={3} aria-hidden="true" />
      </span>
      <span className={estilos.textos}>
        <span className={estilos.rotulo}>{rotulo}</span>
        {descricao ? <span className={estilos.descricao}>{descricao}</span> : null}
      </span>
    </label>
  );
});
