import { CalendarRange, ChevronLeft, ChevronRight } from 'lucide-react';
import { Botao, BotaoIcone, IndicadorGiratorio } from '@/componentes/ui';
import { formatarIntervaloDias } from '@/utilitarios/formatacao';
import estilos from './NavegacaoSemana.module.css';

export interface NavegacaoSemanaProps {
  inicioSemana: string;
  fimSemana: string;
  ehSemanaAtual: boolean;
  situacao: string;
  carregando: boolean;
  aoIrParaAnterior: () => void;
  aoIrParaSeguinte: () => void;
  aoIrParaAtual: () => void;
}

export function NavegacaoSemana({
  inicioSemana,
  fimSemana,
  ehSemanaAtual,
  situacao,
  carregando,
  aoIrParaAnterior,
  aoIrParaSeguinte,
  aoIrParaAtual,
}: NavegacaoSemanaProps) {
  const periodo = formatarIntervaloDias(inicioSemana, fimSemana);

  return (
    <nav className={estilos.navegacao} aria-label="Semana da revisão">
      <BotaoIcone icone={ChevronLeft} rotulo="Semana anterior" onClick={aoIrParaAnterior} className={estilos.seta} />

      <div className={estilos.centro}>
        <h2 className={estilos.periodo} aria-live="polite">
          <CalendarRange className={estilos.icone} size={18} strokeWidth={2} aria-hidden="true" />
          <span>{periodo}</span>
        </h2>
        <p className={estilos.situacao}>
          {situacao}
          <span className={estilos.carregando}>{carregando ? <IndicadorGiratorio tamanho={14} /> : null}</span>
        </p>
      </div>

      <BotaoIcone
        icone={ChevronRight}
        rotulo="Semana seguinte"
        onClick={aoIrParaSeguinte}
        disabled={ehSemanaAtual}
        className={estilos.seta}
      />

      <Botao variante="secundario" tamanho="sm" className={estilos.atual} onClick={aoIrParaAtual} aria-pressed={ehSemanaAtual}>
        Esta semana
      </Botao>
    </nav>
  );
}
