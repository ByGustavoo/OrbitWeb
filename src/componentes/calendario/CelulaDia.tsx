import { AlertTriangle, ArrowUp, Clock } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { rotuloPrioridade } from '@/modelos/rotulos';
import type { DiaCalendarioDTO } from '@/modelos/tarefas';
import { formatarDataPorExtenso } from '@/utilitarios/datas';
import { pluralizar } from '@/utilitarios/formatacao';
import { juntarClasses } from '@/utilitarios/juntarClasses';
import estilos from './CelulaDia.module.css';

const MAXIMO_MARCADORES = 4;

type TipoMarcador = 'atrasada' | 'aFazer' | 'naoRealizada' | 'concluida';

export interface CelulaDiaProps {
  dia: Date;
  iso: string;
  resumo: DiaCalendarioDTO | undefined;
  foraDoMes: boolean;
  ehHoje: boolean;
  passado: boolean;
  selecionado: boolean;
  focavel: boolean;
  aoSelecionar: (iso: string) => void;
}

function sinalDoDia(resumo: DiaCalendarioDTO): { icone: LucideIcon; classe: string } | null {
  const abertas = resumo.quantidade - resumo.concluidas;
  if (resumo.atrasadas > 0) return { icone: Clock, classe: estilos.sinalAtraso ?? '' };
  if (abertas > 0 && resumo.maiorPrioridade === 'URGENTE') return { icone: AlertTriangle, classe: estilos.sinalUrgente ?? '' };
  if (abertas > 0 && resumo.maiorPrioridade === 'ALTA') return { icone: ArrowUp, classe: estilos.sinalAlta ?? '' };
  return null;
}

function marcadores(resumo: DiaCalendarioDTO, passado: boolean): TipoMarcador[] {
  const outrasAbertas = Math.max(0, resumo.quantidade - resumo.concluidas - resumo.atrasadas);
  const todos: TipoMarcador[] = [
    ...Array<TipoMarcador>(resumo.atrasadas).fill('atrasada'),
    ...Array<TipoMarcador>(outrasAbertas).fill(passado ? 'naoRealizada' : 'aFazer'),
    ...Array<TipoMarcador>(resumo.concluidas).fill('concluida'),
  ];
  return todos.slice(0, MAXIMO_MARCADORES);
}

function descrever(dia: Date, ehHoje: boolean, passado: boolean, resumo: DiaCalendarioDTO | undefined): string {
  const partes = [`${formatarDataPorExtenso(dia)}${ehHoje ? ', hoje' : ''}`];
  if (!resumo || resumo.quantidade === 0) {
    partes.push('sem tarefas');
    return partes.join('. ');
  }
  const detalhes: string[] = [];
  if (resumo.concluidas > 0) detalhes.push(pluralizar(resumo.concluidas, 'concluída', 'concluídas'));
  if (resumo.atrasadas > 0) detalhes.push(pluralizar(resumo.atrasadas, 'atrasada', 'atrasadas'));
  const outrasAbertas = resumo.quantidade - resumo.concluidas - resumo.atrasadas;
  if (passado && outrasAbertas > 0) detalhes.push(pluralizar(outrasAbertas, 'não realizada', 'não realizadas'));
  partes.push(`${pluralizar(resumo.quantidade, 'tarefa', 'tarefas')}${detalhes.length ? `: ${detalhes.join(', ')}` : ''}`);
  if (resumo.maiorPrioridade) partes.push(`prioridade mais alta: ${rotuloPrioridade[resumo.maiorPrioridade].toLowerCase()}`);
  return partes.join('. ');
}

export function CelulaDia({ dia, iso, resumo, foraDoMes, ehHoje, passado, selecionado, focavel, aoSelecionar }: CelulaDiaProps) {
  const sinal = resumo ? sinalDoDia(resumo) : null;
  const pontos = resumo ? marcadores(resumo, passado) : [];
  const excedente = resumo ? resumo.quantidade - pontos.length : 0;
  const Sinal = sinal?.icone;

  return (
    <div
      role="gridcell"
      aria-selected={selecionado}
      className={juntarClasses(estilos.celula, foraDoMes && estilos.foraDoMes, selecionado && estilos.selecionada)}
    >
      <button
        type="button"
        className={estilos.botao}
        tabIndex={focavel ? 0 : -1}
        data-iso={iso}
        aria-label={descrever(dia, ehHoje, passado, resumo)}
        aria-current={ehHoje ? 'date' : undefined}
        onClick={() => aoSelecionar(iso)}
      >
        <span className={juntarClasses(estilos.numero, ehHoje && estilos.hoje)}>{dia.getDate()}</span>
        {Sinal ? <Sinal className={juntarClasses(estilos.sinal, sinal.classe)} size={14} strokeWidth={2.5} aria-hidden="true" /> : null}
        {pontos.length > 0 ? (
          <span className={estilos.marcadores} aria-hidden="true">
            {pontos.map((tipo, indice) => (
              <span key={indice} className={juntarClasses(estilos.ponto, estilos[tipo])} />
            ))}
            {excedente > 0 ? <span className={estilos.excedente}>+{excedente}</span> : null}
          </span>
        ) : null}
      </button>
    </div>
  );
}
