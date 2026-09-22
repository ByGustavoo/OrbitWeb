import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  INICIAIS_DIAS_SEMANA,
  NOMES_DIAS_SEMANA,
  NOMES_MESES,
  adicionarDias,
  adicionarMeses,
  capitalizar,
  comMesEAno,
  dataIsoLocal,
  deDataIso,
  formatarDataCurta,
  formatarDataPorExtenso,
  gradeDoMes,
  hoje,
  mesmoDia,
} from '@/utilitarios/datas';
import { juntarClasses } from '@/utilitarios/juntarClasses';
import { BotaoIcone } from './BotaoIcone';
import { classesControle } from './classesControle';
import { EstruturaCampo } from './EstruturaCampo';
import type { PropriedadesMensagensCampo } from './EstruturaCampo';
import { Flutuante } from './Flutuante';
import estilosCampo from './Campo.module.css';
import estilos from './SeletorData.module.css';

type Visao = 'dias' | 'meses' | 'anos';

const ANOS_POR_PAGINA = 12;
const COLUNAS_MESES_E_ANOS = 3;
const ANOS_ANTES_NA_PAGINA = 5;

const inicioDaPaginaDeAnos = (ano: number) => ano - ANOS_ANTES_NA_PAGINA;

export interface SeletorDataProps extends PropriedadesMensagensCampo {
  valor: string | null;
  aoMudar: (valor: string | null) => void;
  textoVazio?: string;
  desabilitado?: boolean;
  permitirLimpar?: boolean;
  id?: string;
}

export function SeletorData({
  rotulo,
  dica,
  erro,
  sucesso,
  obrigatorio,
  className,
  valor,
  aoMudar,
  textoVazio = 'Escolher data',
  desabilitado = false,
  permitirLimpar = true,
  id,
}: SeletorDataProps) {
  const gatilhoRef = useRef<HTMLButtonElement>(null);
  const idPainel = useId();
  const [aberto, setAberto] = useState(false);

  const fechar = useCallback((devolverFoco: boolean) => {
    setAberto(false);
    if (devolverFoco) gatilhoRef.current?.focus();
  }, []);

  const escolher = (data: Date | null) => {
    aoMudar(data ? dataIsoLocal(data) : null);
    fechar(true);
  };

  return (
    <EstruturaCampo
      id={id}
      rotulo={rotulo}
      dica={dica}
      erro={erro}
      sucesso={sucesso}
      obrigatorio={obrigatorio}
      className={className}
    >
      {({ idControle, idDescricao }) => (
        <>
          <button
            ref={gatilhoRef}
            id={idControle}
            type="button"
            className={classesControle(erro, sucesso, juntarClasses(estilosCampo.gatilho, aberto && estilosCampo.gatilhoAberto))}
            aria-haspopup="dialog"
            aria-expanded={aberto}
            aria-controls={aberto ? idPainel : undefined}
            aria-describedby={idDescricao}
            aria-invalid={erro ? true : undefined}
            disabled={desabilitado}
            onClick={() => setAberto((atual) => !atual)}
            onKeyDown={(evento) => {
              if (evento.key === 'ArrowDown' && !aberto) {
                evento.preventDefault();
                setAberto(true);
              }
            }}
          >
            <CalendarDays className={estilosCampo.icone} size={16} strokeWidth={2} aria-hidden="true" />
            <span className={juntarClasses(estilosCampo.valorGatilho, !valor && estilosCampo.textoVazio)}>
              {valor ? formatarDataCurta(valor) : textoVazio}
            </span>
            {valor ? (
              <span className="visualmente-oculto">, {formatarDataPorExtenso(deDataIso(valor))}</span>
            ) : null}
          </button>

          <Flutuante aberto={aberto} ancora={gatilhoRef} aoFechar={fechar} id={idPainel} rotulo={rotulo ?? 'Escolher data'}>
            <Calendario
              valor={valor ? deDataIso(valor) : null}
              aoEscolher={escolher}
              aoLimpar={permitirLimpar && valor ? () => escolher(null) : undefined}
            />
          </Flutuante>
        </>
      )}
    </EstruturaCampo>
  );
}

interface CalendarioProps {
  valor: Date | null;
  aoEscolher: (data: Date) => void;
  aoLimpar?: () => void;
}

function Calendario({ valor, aoEscolher, aoLimpar }: CalendarioProps) {
  const dataHoje = hoje();
  const [visao, setVisao] = useState<Visao>('dias');
  const [focada, setFocada] = useState<Date>(valor ?? dataHoje);
  const [inicioPaginaAnos, setInicioPaginaAnos] = useState(inicioDaPaginaDeAnos((valor ?? dataHoje).getFullYear()));
  const corpoRef = useRef<HTMLDivElement>(null);
  const devoFocar = useRef(true);
  const idTitulo = useId();

  const ano = focada.getFullYear();
  const mes = focada.getMonth();

  useEffect(() => {
    if (!devoFocar.current) return;
    const quadro = requestAnimationFrame(() => {
      devoFocar.current = false;
      corpoRef.current?.querySelector<HTMLElement>('[data-focada="true"], [tabindex="0"]')?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(quadro);
  }, [visao, focada, inicioPaginaAnos]);

  const moverDia = (dias: number) => setFocada((atual) => adicionarDias(atual, dias));
  const moverMes = (meses: number) => setFocada((atual) => adicionarMeses(atual, meses));

  const aoTeclarDias = (evento: KeyboardEvent<HTMLDivElement>) => {
    const acoes: Record<string, () => void> = {
      ArrowLeft: () => moverDia(-1),
      ArrowRight: () => moverDia(1),
      ArrowUp: () => moverDia(-7),
      ArrowDown: () => moverDia(7),
      Home: () => moverDia(-focada.getDay()),
      End: () => moverDia(6 - focada.getDay()),
      PageUp: () => moverMes(evento.shiftKey ? -12 : -1),
      PageDown: () => moverMes(evento.shiftKey ? 12 : 1),
    };
    const acao = acoes[evento.key];
    if (!acao) return;
    evento.preventDefault();
    devoFocar.current = true;
    acao();
  };

  const aoTeclarGrade = (evento: KeyboardEvent<HTMLDivElement>, mover: (passo: number) => void) => {
    const passos: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -COLUNAS_MESES_E_ANOS,
      ArrowDown: COLUNAS_MESES_E_ANOS,
    };
    const passo = passos[evento.key];
    if (passo === undefined) return;
    evento.preventDefault();
    devoFocar.current = true;
    mover(passo);
  };

  const irParaMesAnterior = () =>
    visao === 'dias' ? moverMes(-1) : visao === 'meses' ? moverMes(-12) : setInicioPaginaAnos((atual) => atual - ANOS_POR_PAGINA);
  const irParaProximoMes = () =>
    visao === 'dias' ? moverMes(1) : visao === 'meses' ? moverMes(12) : setInicioPaginaAnos((atual) => atual + ANOS_POR_PAGINA);

  const rotulosNavegacao: Record<Visao, [string, string]> = {
    dias: ['Mês anterior', 'Próximo mês'],
    meses: ['Ano anterior', 'Próximo ano'],
    anos: ['Anos anteriores', 'Próximos anos'],
  };

  const tituloVisao =
    visao === 'dias'
      ? `${capitalizar(NOMES_MESES[mes] ?? '')} de ${ano}`
      : visao === 'meses'
        ? String(ano)
        : `${inicioPaginaAnos} – ${inicioPaginaAnos + ANOS_POR_PAGINA - 1}`;

  const trocarVisao = () => {
    devoFocar.current = true;
    if (visao === 'dias') setVisao('meses');
    else if (visao === 'meses') {
      setInicioPaginaAnos(inicioDaPaginaDeAnos(ano));
      setVisao('anos');
    }
  };

  return (
    <div className={estilos.calendario}>
      <div className={estilos.cabecalho}>
        {visao === 'anos' ? (
          <span className={estilos.titulo} id={idTitulo} aria-live="polite">
            {tituloVisao}
          </span>
        ) : (
          <button
            type="button"
            className={estilos.botaoTitulo}
            onClick={trocarVisao}
            aria-label={visao === 'dias' ? `${tituloVisao}. Escolher mês e ano` : `${tituloVisao}. Escolher ano`}
          >
            <span id={idTitulo} aria-live="polite">
              {tituloVisao}
            </span>
            <ChevronDown size={14} strokeWidth={2.25} aria-hidden="true" />
          </button>
        )}
        <div className={estilos.setas}>
          <BotaoIcone icone={ChevronLeft} rotulo={rotulosNavegacao[visao][0]} tamanho="sm" mostrarDica={false} onClick={irParaMesAnterior} />
          <BotaoIcone icone={ChevronRight} rotulo={rotulosNavegacao[visao][1]} tamanho="sm" mostrarDica={false} onClick={irParaProximoMes} />
        </div>
      </div>

      <div ref={corpoRef} className={estilos.corpo} key={visao}>
        {visao === 'dias' ? (
          <div role="grid" aria-labelledby={idTitulo} className={estilos.grade} onKeyDown={aoTeclarDias}>
            <div role="row" className={estilos.linhaSemana}>
              {INICIAIS_DIAS_SEMANA.map((inicial, indice) => (
                <span key={indice} role="columnheader" className={estilos.diaSemana} aria-label={NOMES_DIAS_SEMANA[indice]}>
                  {inicial}
                </span>
              ))}
            </div>
            {Array.from({ length: 6 }, (_, semana) => (
              <div role="row" key={semana} className={estilos.linhaDias}>
                {gradeDoMes(ano, mes)
                  .slice(semana * 7, semana * 7 + 7)
                  .map((dia) => {
                    const foraDoMes = dia.getMonth() !== mes;
                    const selecionado = valor ? mesmoDia(dia, valor) : false;
                    const ehHoje = mesmoDia(dia, dataHoje);
                    const ehFocada = mesmoDia(dia, focada);
                    return (
                      <span role="gridcell" key={dia.toISOString()} aria-selected={selecionado}>
                        <button
                          type="button"
                          tabIndex={ehFocada ? 0 : -1}
                          data-focada={ehFocada}
                          className={juntarClasses(
                            estilos.dia,
                            foraDoMes && estilos.foraDoMes,
                            ehHoje && estilos.hoje,
                            selecionado && estilos.selecionado,
                          )}
                          aria-label={`${formatarDataPorExtenso(dia)}${ehHoje ? ', hoje' : ''}`}
                          aria-current={ehHoje ? 'date' : undefined}
                          onClick={() => aoEscolher(dia)}
                        >
                          {dia.getDate()}
                        </button>
                      </span>
                    );
                  })}
              </div>
            ))}
          </div>
        ) : visao === 'meses' ? (
          <div
            className={estilos.gradeTres}
            role="group"
            aria-labelledby={idTitulo}
            onKeyDown={(evento) => aoTeclarGrade(evento, (passo) => moverMes(passo))}
          >
            {NOMES_MESES.map((nome, indice) => {
              const ehFocada = indice === mes;
              const selecionado = valor ? valor.getFullYear() === ano && valor.getMonth() === indice : false;
              const atual = dataHoje.getFullYear() === ano && dataHoje.getMonth() === indice;
              return (
                <button
                  key={nome}
                  type="button"
                  tabIndex={ehFocada ? 0 : -1}
                  data-focada={ehFocada}
                  aria-pressed={selecionado}
                  className={juntarClasses(estilos.celula, atual && estilos.hoje, selecionado && estilos.selecionado)}
                  onClick={() => {
                    devoFocar.current = true;
                    setFocada(comMesEAno(focada, ano, indice));
                    setVisao('dias');
                  }}
                >
                  {capitalizar(nome.slice(0, 3))}
                  <span className="visualmente-oculto">{nome.slice(3)}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div
            className={estilos.gradeTres}
            role="group"
            aria-labelledby={idTitulo}
            onKeyDown={(evento) =>
              aoTeclarGrade(evento, (passo) => {
                const alvo = ano + passo;
                if (alvo < inicioPaginaAnos) setInicioPaginaAnos((atual) => atual - ANOS_POR_PAGINA);
                if (alvo >= inicioPaginaAnos + ANOS_POR_PAGINA) setInicioPaginaAnos((atual) => atual + ANOS_POR_PAGINA);
                setFocada(comMesEAno(focada, alvo, mes));
              })
            }
          >
            {Array.from({ length: ANOS_POR_PAGINA }, (_, indice) => {
              const anoCelula = inicioPaginaAnos + indice;
              const ehFocada = anoCelula === ano;
              const selecionado = valor?.getFullYear() === anoCelula;
              return (
                <button
                  key={anoCelula}
                  type="button"
                  tabIndex={ehFocada || (indice === 0 && (ano < inicioPaginaAnos || ano >= inicioPaginaAnos + ANOS_POR_PAGINA)) ? 0 : -1}
                  data-focada={ehFocada}
                  aria-pressed={selecionado}
                  className={juntarClasses(
                    estilos.celula,
                    dataHoje.getFullYear() === anoCelula && estilos.hoje,
                    selecionado && estilos.selecionado,
                  )}
                  onClick={() => {
                    devoFocar.current = true;
                    setFocada(comMesEAno(focada, anoCelula, mes));
                    setVisao('meses');
                  }}
                >
                  {anoCelula}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className={estilos.rodape}>
        <button type="button" className={estilos.acaoRodape} onClick={() => aoEscolher(dataHoje)}>
          Hoje
        </button>
        {aoLimpar ? (
          <button type="button" className={juntarClasses(estilos.acaoRodape, estilos.acaoSecundaria)} onClick={aoLimpar}>
            Limpar
          </button>
        ) : null}
      </div>
    </div>
  );
}
