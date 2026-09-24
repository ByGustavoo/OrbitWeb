import type { CSSProperties } from 'react';
import { CalendarClock, Check, Repeat } from 'lucide-react';
import { IndicadorGiratorio } from '@/componentes/ui';
import { coresDaPrioridade } from '@/modelos/cores';
import type { TarefaDTO } from '@/modelos/tarefas';
import { formatarDiaRelativo } from '@/utilitarios/formatacao';
import { juntarClasses } from '@/utilitarios/juntarClasses';
import { SeloCategoria, SeloPrioridade, SeloSituacao } from './SelosTarefa';
import estilos from './ItemTarefa.module.css';

export interface ItemTarefaProps {
  tarefa: TarefaDTO;
  hojeIso: string;
  enviando?: boolean;
  mostrarDia?: boolean;
  aoAlternarConclusao: (tarefa: TarefaDTO) => void;
  indice?: number;
}

function Quando({ tarefa, className }: { tarefa: TarefaDTO; className?: string }) {
  if (tarefa.diaInteiro || !tarefa.horarioInicio) {
    return <span className={juntarClasses(className, estilos.diaTodo)}>Dia todo</span>;
  }
  return (
    <span className={className}>
      <time className={estilos.inicio}>{tarefa.horarioInicio}</time>
      {tarefa.horarioFim ? (
        <span className={estilos.fim}>até {tarefa.horarioFim}</span>
      ) : null}
    </span>
  );
}

export function ItemTarefa({ tarefa, hojeIso, enviando = false, mostrarDia = false, aoAlternarConclusao, indice = 0 }: ItemTarefaProps) {
  const concluida = tarefa.situacao === 'CONCLUIDA';
  const estilo = { '--cor-prioridade': coresDaPrioridade(tarefa.prioridade).texto, '--indice': indice } as CSSProperties;

  return (
    <li className={juntarClasses(estilos.item, 'item-em-cascata', concluida && estilos.concluida)} style={estilo}>
      <span className={estilos.marcador}>
        <input
          type="checkbox"
          className={estilos.entrada}
          checked={concluida}
          disabled={enviando}
          aria-label={concluida ? `Reabrir “${tarefa.titulo}”` : `Concluir “${tarefa.titulo}”`}
          onChange={() => aoAlternarConclusao(tarefa)}
        />
        {enviando ? (
          <IndicadorGiratorio tamanho={14} className={estilos.giratorio} />
        ) : (
          <Check className={estilos.marca} size={13} strokeWidth={3} aria-hidden="true" />
        )}
      </span>

      <Quando tarefa={tarefa} className={estilos.quando} />

      <div className={estilos.corpo}>
        <p className={estilos.titulo}>
          <span className={estilos.tituloTexto}>{tarefa.titulo}</span>
        </p>
        <div className={estilos.meta}>
          <Quando tarefa={tarefa} className={estilos.quandoCompacto} />
          {mostrarDia && tarefa.data ? (
            <span className={estilos.atraso}>
              <CalendarClock size={13} strokeWidth={2} aria-hidden="true" />
              <span className="visualmente-oculto">Era para </span>
              {formatarDiaRelativo(tarefa.data, hojeIso)}
            </span>
          ) : null}
          {tarefa.situacao === 'EM_ANDAMENTO' ? <SeloSituacao situacao="EM_ANDAMENTO" /> : null}
          {tarefa.categoria ? <SeloCategoria nome={tarefa.categoria.nome} cor={tarefa.categoria.cor} /> : null}
          {tarefa.serieId !== null ? (
            <span className={estilos.recorrente} title="Tarefa recorrente">
              <Repeat size={13} strokeWidth={2} aria-hidden="true" />
              <span className="visualmente-oculto">Tarefa recorrente</span>
            </span>
          ) : null}
        </div>
      </div>

      <span className={estilos.prioridade}>
        <SeloPrioridade prioridade={tarefa.prioridade} />
      </span>
    </li>
  );
}
