import { Fragment, useCallback, useId, useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { ArrowRight, ClipboardCheck, ListChecks, Timer } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { MarcaOrbit } from '@/componentes/comum/MarcaOrbit';
import { Botao } from '@/componentes/ui';
import { NOME_APLICACAO, NOME_VIAJA_COM_LOGO_NA_ENTRADA, SLOGAN_APLICACAO } from '@/configuracoes/aplicacao';
import { useTituloDocumento } from '@/ganchos/useTituloDocumento';
import { juntarClasses } from '@/utilitarios/juntarClasses';
import { transicionarParaAplicacao } from './transicaoBoasVindas';
import estilos from './TelaBoasVindas.module.css';

const DURACAO_DESPEDIDA_MS = 760;

const LETRAS_DO_NOME = [...NOME_APLICACAO];
const PALAVRAS_DO_TITULO = SLOGAN_APLICACAO.split(' ');

const ATRASO_ENTRADA_MS = {
  descricao: 1000,
  primeiroRecurso: 1100,
  passoRecurso: 90,
  acoes: 1420,
};

interface Recurso {
  icone: LucideIcon;
  titulo: string;
  descricao: string;
}

const recursos: Recurso[] = [
  {
    icone: ListChecks,
    titulo: 'Tarefas e agenda',
    descricao: 'Planeje o dia pelo calendário e acompanhe prazos e prioridades.',
  },
  {
    icone: Timer,
    titulo: 'Cronômetro de estudos',
    descricao: 'Cronometre sessões livres ou em Pomodoro e acompanhe suas metas.',
  },
  {
    icone: ClipboardCheck,
    titulo: 'Revisão da semana',
    descricao: 'Veja o que avançou e decida o que fazer com o que ficou para trás.',
  },
];

const TOTAL_BLOCOS = recursos.length + 2;

function bloco(atrasoEntradaMs: number, ordemSaida: number): CSSProperties {
  return { '--atraso': `${atrasoEntradaMs}ms`, '--ordem-saida': ordemSaida } as CSSProperties;
}

function comIndice(indice: number): CSSProperties {
  return { '--i': indice } as CSSProperties;
}

interface Orbita {
  id: string;
  raioX: number;
  raioY: number;
  satelite?: { raio: number; segundosPorVolta: number; sentidoInverso?: boolean };
}

const CENTRO_ORBITAS = { x: 600, y: 400 };

const ORBITAS: Orbita[] = [
  { id: 'orbita-interna', raioX: 380, raioY: 150, satelite: { raio: 4, segundosPorVolta: 28 } },
  { id: 'orbita-media', raioX: 520, raioY: 210 },
  { id: 'orbita-externa', raioX: 660, raioY: 280, satelite: { raio: 3, segundosPorVolta: 46, sentidoInverso: true } },
];

function caminhoDaElipse({ raioX, raioY }: Orbita): string {
  const { x, y } = CENTRO_ORBITAS;
  return `M ${x - raioX} ${y} A ${raioX} ${raioY} 0 1 1 ${x + raioX} ${y} A ${raioX} ${raioY} 0 1 1 ${x - raioX} ${y} Z`;
}

export function TelaBoasVindas({ aoComecar }: { aoComecar: () => void }) {
  const [saindo, setSaindo] = useState(false);
  const [movimentoPermitido] = useState(() => !window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const idBase = useId().replace(/:/g, '');
  const simboloRef = useRef<HTMLSpanElement>(null);
  const nomeRef = useRef<HTMLSpanElement>(null);
  const letrasRef = useRef<(HTMLSpanElement | null)[]>([]);
  useTituloDocumento('');

  const medirDistanciaAteOLogo = useCallback(() => {
    const simbolo = simboloRef.current?.getBoundingClientRect();
    const nome = nomeRef.current?.getBoundingClientRect();
    if (!simbolo || !nome) return;
    const centroDoLogo = simbolo.left + simbolo.width / 2;
    letrasRef.current.forEach((letra) => {
      if (!letra) return;
      const centroDaLetra = nome.left + letra.offsetLeft + letra.offsetWidth / 2;
      letra.style.setProperty('--dx', `${(centroDoLogo - centroDaLetra).toFixed(1)}px`);
    });
  }, []);

  useLayoutEffect(() => {
    medirDistanciaAteOLogo();
    void document.fonts.ready.then(medirDistanciaAteOLogo);
    window.addEventListener('resize', medirDistanciaAteOLogo);
    return () => window.removeEventListener('resize', medirDistanciaAteOLogo);
  }, [medirDistanciaAteOLogo]);

  const comecar = () => {
    if (saindo) return;
    if (!movimentoPermitido) {
      aoComecar();
      return;
    }
    medirDistanciaAteOLogo();
    setSaindo(true);
    void import('@/paginas/paginasProvisorias');
    window.setTimeout(() => transicionarParaAplicacao(aoComecar), DURACAO_DESPEDIDA_MS);
  };

  return (
    <main
      className={juntarClasses(estilos.tela, saindo && estilos.saindo)}
      aria-labelledby="titulo-boas-vindas"
      aria-busy={saindo || undefined}
    >
      <div className={estilos.orbitas} aria-hidden="true">
        <svg viewBox="0 0 1200 800" width="1200" height="800">
          <g transform="rotate(-14 600 400)">
            {ORBITAS.map((orbita, indice) => (
              <path
                key={orbita.id}
                id={`${idBase}-${orbita.id}`}
                d={caminhoDaElipse(orbita)}
                pathLength={1}
                className={estilos.linhaOrbita}
                style={comIndice(indice)}
              />
            ))}
            {movimentoPermitido
              ? ORBITAS.map((orbita) =>
                  orbita.satelite ? (
                    <g key={orbita.id} className={estilos.satelite}>
                      <circle r={orbita.satelite.raio * 2} className={estilos.haloSatelite} />
                      <circle r={orbita.satelite.raio} className={estilos.nucleoSatelite} />
                      <animateMotion
                        dur={`${orbita.satelite.segundosPorVolta}s`}
                        repeatCount="indefinite"
                        rotate="0"
                        keyPoints={orbita.satelite.sentidoInverso ? '1;0' : '0;1'}
                        keyTimes="0;1"
                        calcMode="linear"
                      >
                        <mpath href={`#${idBase}-${orbita.id}`} />
                      </animateMotion>
                    </g>
                  ) : null,
                )
              : null}
          </g>
        </svg>
      </div>

      <div className={estilos.conteudo}>
        <div className={estilos.marca}>
          <span ref={simboloRef} className={juntarClasses(estilos.simbolo, 'marca-em-transicao')}>
            <MarcaOrbit tamanho={48} animarEntrada={movimentoPermitido} />
          </span>
          <span
            ref={nomeRef}
            className={juntarClasses(
              estilos.nome,
              NOME_VIAJA_COM_LOGO_NA_ENTRADA ? 'nome-em-transicao' : estilos.nomeAbsorvido,
            )}
          >
            <span className="visualmente-oculto">{NOME_APLICACAO}</span>
            {LETRAS_DO_NOME.map((letra, indice) => (
              <span
                key={`${letra}-${indice}`}
                ref={(elemento) => {
                  letrasRef.current[indice] = elemento;
                }}
                className={estilos.letra}
                style={comIndice(indice)}
                aria-hidden="true"
              >
                {letra}
              </span>
            ))}
          </span>
        </div>

        <h1 id="titulo-boas-vindas" className={estilos.titulo}>
          {PALAVRAS_DO_TITULO.map((palavra, indice) => (
            <Fragment key={`${palavra}-${indice}`}>
              <span className={estilos.palavra}>
                <span className={estilos.palavraInterna} style={comIndice(indice)}>
                  {palavra}
                </span>
              </span>
              {indice < PALAVRAS_DO_TITULO.length - 1 ? ' ' : null}
            </Fragment>
          ))}
        </h1>

        <p
          className={juntarClasses(estilos.descricao, estilos.entra, estilos.etapa)}
          style={bloco(ATRASO_ENTRADA_MS.descricao, TOTAL_BLOCOS)}
        >
          Tarefas, agenda e tempo de estudo no mesmo lugar, para você saber o que fazer agora e ver o quanto já
          avançou.
        </p>

        <ul className={estilos.recursos}>
          {recursos.map(({ icone: Icone, titulo, descricao }, indice) => (
            <li
              key={titulo}
              className={juntarClasses(estilos.recurso, estilos.entra, estilos.etapa)}
              style={bloco(
                ATRASO_ENTRADA_MS.primeiroRecurso + indice * ATRASO_ENTRADA_MS.passoRecurso,
                TOTAL_BLOCOS - 1 - indice,
              )}
            >
              <span className={estilos.iconeRecurso} aria-hidden="true">
                <Icone size={18} strokeWidth={2} />
              </span>
              <span className={estilos.textosRecurso}>
                <span className={estilos.tituloRecurso}>{titulo}</span>
                <span className={estilos.descricaoRecurso}>{descricao}</span>
              </span>
            </li>
          ))}
        </ul>

        <div className={juntarClasses(estilos.acoes, estilos.entra, estilos.etapa)} style={bloco(ATRASO_ENTRADA_MS.acoes, 0)}>
          <Botao iconeDireita={ArrowRight} onClick={comecar} className={estilos.comecar}>
            Começar
          </Botao>
        </div>
      </div>
    </main>
  );
}
