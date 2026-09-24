import { useId } from 'react';
import type { CSSProperties } from 'react';
import { Check } from 'lucide-react';
import type { Cor } from '@/modelos/enumeracoes';
import { CORES } from '@/modelos/enumeracoes';
import { coresDaPaleta } from '@/modelos/cores';
import { rotuloCor } from '@/modelos/rotulos';
import { juntarClasses } from '@/utilitarios/juntarClasses';
import estilosCampo from './Campo.module.css';
import estilos from './SeletorCor.module.css';

export interface SeletorCorProps {
  rotulo: string;
  valor: Cor;
  aoMudar: (cor: Cor) => void;
  erro?: string;
  dica?: string;
  id?: string;
  className?: string;
}

export function SeletorCor({ rotulo, valor, aoMudar, erro, dica, id, className }: SeletorCorProps) {
  const idGerado = useId();
  const idBase = id ?? idGerado;
  const idRotulo = `${idBase}-rotulo`;
  const idMensagem = `${idBase}-mensagem`;
  const mensagem = erro ?? dica;

  return (
    <div className={juntarClasses(estilosCampo.campo, className)}>
      <span className={estilosCampo.rotulo} id={idRotulo}>
        {rotulo}
      </span>
      <div
        role="radiogroup"
        aria-labelledby={idRotulo}
        aria-describedby={mensagem ? idMensagem : undefined}
        className={estilos.grupo}
        id={idBase}
        tabIndex={-1}
      >
        {CORES.map((cor) => {
          const selecionada = cor === valor;
          return (
            <label key={cor} className={estilos.opcao} title={rotuloCor[cor]}>
              <input
                type="radio"
                name={idBase}
                value={cor}
                checked={selecionada}
                onChange={() => aoMudar(cor)}
                className={estilos.entrada}
                aria-label={rotuloCor[cor]}
              />
              <span
                className={juntarClasses(estilos.amostra, selecionada && estilos.selecionada)}
                style={{ '--cor-amostra': coresDaPaleta(cor).texto } as CSSProperties}
                aria-hidden="true"
              >
                {selecionada ? <Check size={14} strokeWidth={3} /> : null}
              </span>
            </label>
          );
        })}
      </div>
      {mensagem ? (
        <p className={juntarClasses(estilosCampo.mensagem, erro && estilosCampo.mensagemErro)} id={idMensagem}>
          {mensagem}
        </p>
      ) : null}
    </div>
  );
}
