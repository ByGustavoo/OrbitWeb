import type { CSSProperties } from 'react';
import { CalendarClock, CalendarDays, Check, Repeat } from 'lucide-react';
import { IndicadorGiratorio } from '@/componentes/ui';
import { coresDaPrioridade } from '@/modelos/cores';
import type { TarefaDTO } from '@/modelos/tarefas';
import { formatarDiaRelativo } from '@/utilitarios/formatacao';
import { juntarClasses } from '@/utilitarios/juntarClasses';
import { SeloCategoria, SeloPrazo, SeloPrioridade, SeloSituacao } from './SelosTarefa';
import estilos from './ItemTarefa.module.css';

export interface ItemTarefaProps {
  tarefa: TarefaDTO;
  hojeIso: string;
  enviando?: boolean;
  mostrarDia?: boolean;
  mostrarSituacao?: boolean;
  aoAlternarConclusao: (tarefa: TarefaDTO) => void;
  aoAbrir?: (tarefa: TarefaDTO) => void;
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

function rotuloMarcador(tarefa: TarefaDTO): string {
  if (tarefa.situacao === 'CANCELADA') return `“${tarefa.titulo}” está cancelada`;
  return tarefa.situacao === 'CONCLUIDA' ? `Reabrir “${tarefa.titulo}”` : `Concluir “${tarefa.titulo}”`;
}

export function ItemTarefa({
  tarefa,
  hojeIso,
  enviando = false,
  mostrarDia = false,
  mostrarSituacao = false,
  aoAlternarConclusao,
  aoAbrir,
  indice = 0,
}: ItemTarefaProps) {
  const concluida = tarefa.situacao === 'CONCLUIDA';
  const cancelada = tarefa.situacao === 'CANCELADA';
  const atrasada = tarefa.prazo === 'ATRASADA';
  const prazoEmDestaque = atrasada || tarefa.prazo === 'NAO_REALIZADA';
  const estilo = { '--cor-prioridade': coresDaPrioridade(tarefa.prioridade).texto, '--indice': indice } as CSSProperties;

  return (
    <li
      className={juntarClasses(
        estilos.item,
        'item-em-cascata',
        concluida && estilos.concluida,
        cancelada && estilos.cancelada,
        aoAbrir && estilos.abrivel,
      )}
      style={estilo}
    >
      <span className={estilos.marcador}>
        <input
          type="checkbox"
          className={estilos.entrada}
          checked={concluida}
          disabled={enviando || cancelada}
          aria-label={rotuloMarcador(tarefa)}
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
          {aoAbrir ? (
            <button type="button" className={estilos.abrir} onClick={() => aoAbrir(tarefa)}>
              <span className={estilos.tituloTexto}>{tarefa.titulo}</span>
              <span className="visualmente-oculto">, ver detalhes</span>
            </button>
          ) : (
            <span className={estilos.tituloTexto}>{tarefa.titulo}</span>
          )}
        </p>
        <div className={estilos.meta}>
          <Quando tarefa={tarefa} className={estilos.quandoCompacto} />
          {mostrarDia && tarefa.data ? (
            <span className={juntarClasses(estilos.dia, atrasada && estilos.atraso)}>
              {atrasada ? (
                <CalendarClock size={13} strokeWidth={2} aria-hidden="true" />
              ) : (
                <CalendarDays size={13} strokeWidth={2} aria-hidden="true" />
              )}
              {atrasada ? <span className="visualmente-oculto">Era para </span> : null}
              {formatarDiaRelativo(tarefa.data, hojeIso)}
            </span>
          ) : null}
          {mostrarSituacao ? (
            <>
              {tarefa.situacao !== 'PENDENTE' || !prazoEmDestaque ? <SeloSituacao situacao={tarefa.situacao} /> : null}
              <SeloPrazo prazo={tarefa.prazo} />
            </>
          ) : tarefa.situacao === 'EM_ANDAMENTO' ? (
            <SeloSituacao situacao="EM_ANDAMENTO" />
          ) : null}
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
