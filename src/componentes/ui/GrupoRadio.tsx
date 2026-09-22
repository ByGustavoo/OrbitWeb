import { useId } from 'react';
import { juntarClasses } from '@/utilitarios/juntarClasses';
import estilos from './Marcador.module.css';

export interface OpcaoRadio<T extends string> {
  valor: T;
  rotulo: string;
  descricao?: string;
  desabilitada?: boolean;
}

export interface GrupoRadioProps<T extends string> {
  legenda: string;
  opcoes: OpcaoRadio<T>[];
  valor: T | null;
  aoMudar: (valor: T) => void;
  horizontal?: boolean;
  erro?: string;
  className?: string;
}

export function GrupoRadio<T extends string>({
  legenda,
  opcoes,
  valor,
  aoMudar,
  horizontal = false,
  erro,
  className,
}: GrupoRadioProps<T>) {
  const nome = useId();
  const idErro = `${nome}-erro`;

  return (
    <fieldset className={className} aria-describedby={erro ? idErro : undefined}>
      <legend className={estilos.legenda}>{legenda}</legend>
      <div className={juntarClasses(estilos.grupo, horizontal && estilos.grupoHorizontal)}>
        {opcoes.map((opcao) => (
          <label key={opcao.valor} className={juntarClasses(estilos.opcao, estilos.radio, erro && estilos.invalida)}>
            <span className={estilos.caixa}>
              <input
                type="radio"
                name={nome}
                value={opcao.valor}
                checked={valor === opcao.valor}
                disabled={opcao.desabilitada}
                onChange={() => aoMudar(opcao.valor)}
                className={estilos.entrada}
              />
              <span className={juntarClasses(estilos.marca, estilos.ponto)} aria-hidden="true" />
            </span>
            <span className={estilos.textos}>
              <span className={estilos.rotulo}>{opcao.rotulo}</span>
              {opcao.descricao ? <span className={estilos.descricao}>{opcao.descricao}</span> : null}
            </span>
          </label>
        ))}
      </div>
      {erro ? (
        <p className={estilos.erroGrupo} id={idErro}>
          {erro}
        </p>
      ) : null}
    </fieldset>
  );
}
