import type { ReactNode } from 'react';
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
  aguardandoDados: boolean;
  aoIrParaAnterior: () => void;
  aoIrParaSeguinte: () => void;
  aoIrParaAtual: () => void;
}

function TextoDaSemana({ aguardando, children }: { aguardando: boolean; children: ReactNode }) {
  return (
    <span className={aguardando ? undefined : estilos.textoRevelado}>
      <span className={aguardando ? estilos.textoAguardando : undefined}>{children}</span>
    </span>
  );
}

export function NavegacaoSemana({
  inicioSemana,
  fimSemana,
  ehSemanaAtual,
  situacao,
  carregando,
  aguardandoDados,
  aoIrParaAnterior,
  aoIrParaSeguinte,
  aoIrParaAtual,
}: NavegacaoSemanaProps) {
  const periodo = formatarIntervaloDias(inicioSemana, fimSemana);

  return (
    <nav className={estilos.navegacao} aria-label="Semana da revisão">
      <BotaoIcone icone={ChevronLeft} rotulo="Semana anterior" onClick={aoIrParaAnterior} className={estilos.seta} />

      <div className={estilos.centro}>
        <h2 className={estilos.periodo} aria-live="polite" aria-busy={aguardandoDados}>
          <CalendarRange className={estilos.icone} size={18} strokeWidth={2} aria-hidden="true" />
          <TextoDaSemana aguardando={aguardandoDados}>{periodo}</TextoDaSemana>
        </h2>
        <p className={estilos.situacao}>
          <TextoDaSemana aguardando={aguardandoDados}>{situacao}</TextoDaSemana>
          <span className={estilos.carregando}>
            {carregando && !aguardandoDados ? <IndicadorGiratorio tamanho={14} /> : null}
          </span>
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
