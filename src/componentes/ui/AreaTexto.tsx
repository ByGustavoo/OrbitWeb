import { forwardRef } from 'react';
import type { TextareaHTMLAttributes } from 'react';
import { juntarClasses } from '@/utilitarios/juntarClasses';
import { classesControle } from './classesControle';
import { EstruturaCampo } from './EstruturaCampo';
import type { PropriedadesMensagensCampo } from './EstruturaCampo';
import estilos from './Campo.module.css';

export interface AreaTextoProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'>,
    PropriedadesMensagensCampo {}

export const AreaTexto = forwardRef<HTMLTextAreaElement, AreaTextoProps>(function AreaTexto(
  { rotulo, dica, erro, sucesso, className, id, required, rows = 3, ...resto },
  ref,
) {
  return (
    <EstruturaCampo
      id={id}
      rotulo={rotulo}
      dica={dica}
      erro={erro}
      sucesso={sucesso}
      obrigatorio={required}
      className={className}
    >
      {({ idControle, idDescricao }) => (
        <div className={classesControle(erro, sucesso, estilos.controleMultilinha)}>
          <textarea
            ref={ref}
            id={idControle}
            rows={rows}
            className={juntarClasses(estilos.entrada, estilos.areaTexto)}
            required={required}
            aria-invalid={erro ? true : undefined}
            aria-describedby={idDescricao}
            {...resto}
          />
        </div>
      )}
    </EstruturaCampo>
  );
});
