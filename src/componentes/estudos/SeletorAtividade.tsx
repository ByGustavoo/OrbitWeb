import { useId } from 'react';
import type { CSSProperties } from 'react';
import { Plus } from 'lucide-react';
import { coresDaPaleta } from '@/modelos/cores';
import type { AtividadeEstudoDTO } from '@/modelos/estudos';
import { juntarClasses } from '@/utilitarios/juntarClasses';
import estilos from './SeletorAtividade.module.css';

export interface SeletorAtividadeProps {
  atividades: AtividadeEstudoDTO[];
  selecionadaId: number | null;
  idDestacada?: number | null;
  aoSelecionar: (id: number) => void;
  aoCriar: () => void;
  idRotulo: string;
}

export function SeletorAtividade({ atividades, selecionadaId, idDestacada, aoSelecionar, aoCriar, idRotulo }: SeletorAtividadeProps) {
  const nome = useId();

  return (
    <div role="radiogroup" aria-labelledby={idRotulo} className={estilos.seletor}>
      {atividades.map((atividade) => {
        const cores = coresDaPaleta(atividade.cor);
        return (
          <label
            key={atividade.id}
            className={juntarClasses(estilos.opcao, atividade.id === idDestacada && estilos.nova)}
            style={{ '--cor-opcao': cores.texto, '--cor-opcao-suave': cores.fundo } as CSSProperties}
          >
            <input
              type="radio"
              name={nome}
              value={atividade.id}
              checked={atividade.id === selecionadaId}
              onChange={() => aoSelecionar(atividade.id)}
              className={estilos.entrada}
            />
            <span className={estilos.rotulo}>
              <span className={estilos.ponto} aria-hidden="true" />
              {atividade.nome}
            </span>
          </label>
        );
      })}
    <button type="button" className={estilos.criar} onClick={aoCriar}>
        <Plus size={15} strokeWidth={2.25} aria-hidden="true" />
        Nova atividade
      </button>
    </div>
  );
}
