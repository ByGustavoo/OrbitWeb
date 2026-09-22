import { forwardRef, useRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import { Search, X } from 'lucide-react';
import { BotaoIcone } from './BotaoIcone';
import { classesControle } from './classesControle';
import { EstruturaCampo } from './EstruturaCampo';
import type { PropriedadesMensagensCampo } from './EstruturaCampo';
import estilos from './Campo.module.css';

export interface CampoBuscaProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className' | 'type' | 'value' | 'onChange'>,
    PropriedadesMensagensCampo {
  valor: string;
  aoMudar: (valor: string) => void;
}

export const CampoBusca = forwardRef<HTMLInputElement, CampoBuscaProps>(function CampoBusca(
  { rotulo, dica, erro, className, id, valor, aoMudar, ...resto },
  ref,
) {
  const referenciaInterna = useRef<HTMLInputElement | null>(null);

  const limpar = () => {
    aoMudar('');
    referenciaInterna.current?.focus();
  };

  return (
    <EstruturaCampo id={id} rotulo={rotulo} dica={dica} erro={erro} className={className}>
      {({ idControle, idDescricao }) => (
        <div className={classesControle(erro)} role="search">
          <Search className={estilos.icone} size={16} strokeWidth={2} aria-hidden="true" />
          <input
            ref={(elemento) => {
              referenciaInterna.current = elemento;
              if (typeof ref === 'function') ref(elemento);
              else if (ref) ref.current = elemento;
            }}
            id={idControle}
            type="search"
            className={estilos.entrada}
            value={valor}
            onChange={(evento) => aoMudar(evento.target.value)}
            onKeyDown={(evento) => {
              if (evento.key === 'Escape' && valor) {
                evento.stopPropagation();
                aoMudar('');
              }
            }}
            aria-describedby={idDescricao}
            {...resto}
          />
          {valor ? (
            <BotaoIcone icone={X} rotulo="Limpar busca" tamanho="sm" className={estilos.acaoCampo} onClick={limpar} />
          ) : null}
        </div>
      )}
    </EstruturaCampo>
  );
});
