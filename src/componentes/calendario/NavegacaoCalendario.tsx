import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Botao, BotaoIcone, Flutuante, IndicadorGiratorio } from '@/componentes/ui';
import { NOMES_MESES, capitalizar } from '@/utilitarios/datas';
import { formatarMesAno } from '@/utilitarios/formatacao';
import { juntarClasses } from '@/utilitarios/juntarClasses';
import estilos from './NavegacaoCalendario.module.css';

export interface NavegacaoCalendarioProps {
  mes: Date;
  hoje: Date;
  carregando: boolean;
  noDiaDeHoje: boolean;
  aoMudarMes: (mes: Date) => void;
  aoIrParaHoje: () => void;
}

const COLUNAS_MESES = 3;

export function NavegacaoCalendario({ mes, hoje, carregando, noDiaDeHoje, aoMudarMes, aoIrParaHoje }: NavegacaoCalendarioProps) {
  const gatilhoRef = useRef<HTMLButtonElement>(null);
  const idPainel = useId();
  const [aberto, setAberto] = useState(false);
  const titulo = formatarMesAno(mes);

  const fechar = useCallback((devolverFoco: boolean) => {
    setAberto(false);
    if (devolverFoco) gatilhoRef.current?.focus();
  }, []);

  const deslocar = (meses: number) => aoMudarMes(new Date(mes.getFullYear(), mes.getMonth() + meses, 1));

  return (
    <div className={estilos.navegacao}>
      <h2 className={estilos.titulo}>
        <button
          ref={gatilhoRef}
          type="button"
          className={estilos.botaoTitulo}
          aria-haspopup="dialog"
          aria-expanded={aberto}
          aria-controls={aberto ? idPainel : undefined}
          onClick={() => setAberto((atual) => !atual)}
        >
          <span>{titulo}</span>
          <span className="visualmente-oculto">. Escolher mês e ano</span>
          <ChevronDown size={18} strokeWidth={2.25} aria-hidden="true" className={juntarClasses(estilos.seta, aberto && estilos.setaAberta)} />
        </button>
      </h2>
      <span className="visualmente-oculto" aria-live="polite">
        {titulo}
      </span>

      <span className={estilos.carregando}>{carregando ? <IndicadorGiratorio tamanho={16} /> : null}</span>

      <div className={estilos.acoes}>
        <Botao variante="secundario" tamanho="sm" onClick={aoIrParaHoje} aria-pressed={noDiaDeHoje}>
          Hoje
        </Botao>
        <div className={estilos.setas}>
          <BotaoIcone icone={ChevronLeft} rotulo="Mês anterior" onClick={() => deslocar(-1)} />
          <BotaoIcone icone={ChevronRight} rotulo="Próximo mês" onClick={() => deslocar(1)} />
        </div>
      </div>

      <Flutuante aberto={aberto} ancora={gatilhoRef} aoFechar={fechar} id={idPainel} rotulo="Escolher mês e ano">
        <SeletorMesAno
          mes={mes}
          hoje={hoje}
          aoEscolher={(escolhido) => {
            aoMudarMes(escolhido);
            fechar(true);
          }}
        />
      </Flutuante>
    </div>
  );
}

interface SeletorMesAnoProps {
  mes: Date;
  hoje: Date;
  aoEscolher: (mes: Date) => void;
}

function SeletorMesAno({ mes, hoje, aoEscolher }: SeletorMesAnoProps) {
  const [ano, setAno] = useState(mes.getFullYear());
  const [focado, setFocado] = useState(mes.getMonth());
  const gradeRef = useRef<HTMLDivElement>(null);
  const idAno = useId();

  const primeiraAbertura = useRef(true);

  useEffect(() => {
    const focar = () => gradeRef.current?.querySelector<HTMLElement>('[tabindex="0"]')?.focus({ preventScroll: true });
    if (!primeiraAbertura.current) {
      focar();
      return;
    }
    primeiraAbertura.current = false;
    const quadro = requestAnimationFrame(focar);
    return () => cancelAnimationFrame(quadro);
  }, [ano, focado]);

  const moverFoco = (passo: number) => {
    const alvo = focado + passo;
    if (alvo < 0) {
      setAno((atual) => atual - 1);
      setFocado(alvo + 12);
    } else if (alvo > 11) {
      setAno((atual) => atual + 1);
      setFocado(alvo - 12);
    } else {
      setFocado(alvo);
    }
  };

  const aoTeclar = (evento: KeyboardEvent<HTMLDivElement>) => {
    const acoes: Record<string, () => void> = {
      ArrowLeft: () => moverFoco(-1),
      ArrowRight: () => moverFoco(1),
      ArrowUp: () => moverFoco(-COLUNAS_MESES),
      ArrowDown: () => moverFoco(COLUNAS_MESES),
      PageUp: () => setAno((atual) => atual - 1),
      PageDown: () => setAno((atual) => atual + 1),
      Home: () => setFocado(0),
      End: () => setFocado(11),
    };
    const acao = acoes[evento.key];
    if (!acao) return;
    evento.preventDefault();
    acao();
  };

  return (
    <div className={estilos.seletor}>
      <div className={estilos.cabecalhoSeletor}>
        <BotaoIcone icone={ChevronLeft} rotulo="Ano anterior" tamanho="sm" onClick={() => setAno((atual) => atual - 1)} />
        <span className={estilos.ano} id={idAno} aria-live="polite">
          {ano}
        </span>
        <BotaoIcone icone={ChevronRight} rotulo="Próximo ano" tamanho="sm" onClick={() => setAno((atual) => atual + 1)} />
      </div>
      <div ref={gradeRef} className={estilos.meses} role="group" aria-labelledby={idAno} onKeyDown={aoTeclar}>
        {NOMES_MESES.map((nome, indice) => {
          const selecionado = mes.getFullYear() === ano && mes.getMonth() === indice;
          const atual = hoje.getFullYear() === ano && hoje.getMonth() === indice;
          return (
            <button
              key={nome}
              type="button"
              tabIndex={indice === focado ? 0 : -1}
              aria-pressed={selecionado}
              aria-current={atual ? 'date' : undefined}
              aria-label={`${capitalizar(nome)} de ${ano}${atual ? ', mês atual' : ''}`}
              className={juntarClasses(estilos.mes, atual && estilos.mesAtual, selecionado && estilos.mesSelecionado)}
              onClick={() => aoEscolher(new Date(ano, indice, 1))}
            >
              {capitalizar(nome.slice(0, 3))}
            </button>
          );
        })}
      </div>
      <p className={estilos.dica}>Page Up e Page Down mudam o ano.</p>
    </div>
  );
}
