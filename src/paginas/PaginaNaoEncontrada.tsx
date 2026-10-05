import { useId } from 'react';
import type { CSSProperties } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, LayoutDashboard } from 'lucide-react';
import { MarcaOrbit } from '@/componentes/comum/MarcaOrbit';
import { Botao } from '@/componentes/ui';
import { ID_CONTEUDO_PRINCIPAL, NOME_APLICACAO, SLOGAN_APLICACAO } from '@/configuracoes/aplicacao';
import { navegacaoPrincipal } from '@/configuracoes/navegacao';
import { useTituloDocumento } from '@/ganchos/useTituloDocumento';
import { caminhos } from '@/rotas/caminhos';
import { juntarClasses } from '@/utilitarios/juntarClasses';
import estilos from './PaginaNaoEncontrada.module.css';

const atalhos = navegacaoPrincipal
  .flatMap((secao) => secao.itens)
  .filter((item) => item.destino !== caminhos.dashboard);

interface Elipse {
  raioX: number;
  raioY: number;
}

const LARGURA_CENA = 600;
const ALTURA_CENA = 300;
const CENTRO = { x: LARGURA_CENA / 2, y: ALTURA_CENA / 2 };
const INCLINACAO_GRAUS = -14;

const ORBITA_INTERNA: Elipse = { raioX: 176, raioY: 70 };
const ORBITA_EXTERNA: Elipse = { raioX: 270, raioY: 112 };

const ANGULO_INICIO = 180;
const ANGULO_QUEBRA = 430;
const ANGULO_FIM_DO_SINAL = 468;
const ANGULO_TELA_PROCURADA = 488;
const ANGULO_VOLTA_COMPLETA = ANGULO_INICIO + 360;

const VOLTA_INTERNA_MS = 13000;
const CICLO_SINAL_MS = 12000;

function pontoNaElipse({ raioX, raioY }: Elipse, graus: number) {
  const radianos = (graus * Math.PI) / 180;
  return { x: CENTRO.x + raioX * Math.cos(radianos), y: CENTRO.y + raioY * Math.sin(radianos) };
}

function coordenadas(elipse: Elipse, graus: number): string {
  const { x, y } = pontoNaElipse(elipse, graus);
  return `${x.toFixed(2)} ${y.toFixed(2)}`;
}

function arco(elipse: Elipse, de: number, ate: number): string {
  const arcoMaior = ate - de > 180 ? 1 : 0;
  return `A ${elipse.raioX} ${elipse.raioY} 0 ${arcoMaior} 1 ${coordenadas(elipse, ate)}`;
}

function comprimentoDoArco(elipse: Elipse, de: number, ate: number): number {
  let percorrido = 0;
  let anterior = pontoNaElipse(elipse, de);
  for (let graus = de + 1; graus <= ate; graus += 1) {
    const atual = pontoNaElipse(elipse, graus);
    percorrido += Math.hypot(atual.x - anterior.x, atual.y - anterior.y);
    anterior = atual;
  }
  return percorrido;
}

const voltaInterna = [
  `M ${coordenadas(ORBITA_INTERNA, ANGULO_INICIO)}`,
  arco(ORBITA_INTERNA, ANGULO_INICIO, ANGULO_INICIO + 180),
  arco(ORBITA_INTERNA, ANGULO_INICIO + 180, ANGULO_VOLTA_COMPLETA),
  'Z',
].join(' ');

const trechoConhecido = `M ${coordenadas(ORBITA_EXTERNA, ANGULO_INICIO)} ${arco(ORBITA_EXTERNA, ANGULO_INICIO, ANGULO_QUEBRA)}`;

const trechoSemRegistro = `M ${coordenadas(ORBITA_EXTERNA, ANGULO_QUEBRA)} ${arco(ORBITA_EXTERNA, ANGULO_QUEBRA, ANGULO_VOLTA_COMPLETA)}`;

const rotaDoSinal = `${trechoConhecido} ${arco(ORBITA_EXTERNA, ANGULO_QUEBRA, ANGULO_FIM_DO_SINAL)}`;

const FRACAO_ATE_A_QUEBRA =
  comprimentoDoArco(ORBITA_EXTERNA, ANGULO_INICIO, ANGULO_QUEBRA) /
  comprimentoDoArco(ORBITA_EXTERNA, ANGULO_INICIO, ANGULO_FIM_DO_SINAL);

const pontoDaQuebra = pontoNaElipse(ORBITA_EXTERNA, ANGULO_QUEBRA);
const pontoDaTelaProcurada = pontoNaElipse(ORBITA_EXTERNA, ANGULO_TELA_PROCURADA);

function comIndice(indice: number): CSSProperties {
  return { '--indice': indice } as CSSProperties;
}

function OrbitaInterrompida() {
  const idBrilho = `${useId().replace(/:/g, '')}-brilho`;

  const estiloCena = {
    '--volta-interna': `${VOLTA_INTERNA_MS}ms`,
    '--ciclo-sinal': `${CICLO_SINAL_MS}ms`,
    '--fracao-quebra': `${(FRACAO_ATE_A_QUEBRA * 100).toFixed(2)}%`,
  } as CSSProperties;

  return (
    <svg
      className={estilos.cena}
      style={estiloCena}
      viewBox={`0 0 ${LARGURA_CENA} ${ALTURA_CENA}`}
      role="presentation"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient id={idBrilho}>
          <stop className={estilos.brilhoCentro} offset="0%" />
          <stop className={estilos.brilhoBorda} offset="100%" />
        </radialGradient>
      </defs>

      <circle cx={CENTRO.x} cy={CENTRO.y} r="150" fill={`url(#${idBrilho})`} />

      <g transform={`rotate(${INCLINACAO_GRAUS} ${CENTRO.x} ${CENTRO.y})`}>
        <path className={estilos.orbita} d={voltaInterna} pathLength={1} />
        <path className={juntarClasses(estilos.orbita, estilos.orbitaExterna)} d={trechoConhecido} pathLength={1} />
        <path className={estilos.semRegistro} d={trechoSemRegistro} />

        <g className={estilos.satelite} style={{ offsetPath: `path('${voltaInterna}')` }}>
          <circle r="9" className={estilos.haloSatelite} />
          <circle r="4.5" className={estilos.nucleoSatelite} />
        </g>

        <circle className={estilos.ultimaPosicao} cx={pontoDaQuebra.x} cy={pontoDaQuebra.y} r="4.5" />

        <circle className={estilos.pulso} cx={pontoDaTelaProcurada.x} cy={pontoDaTelaProcurada.y} r="6" />
        <circle className={estilos.telaProcurada} cx={pontoDaTelaProcurada.x} cy={pontoDaTelaProcurada.y} r="6" />

        <g className={estilos.sinal} style={{ offsetPath: `path('${rotaDoSinal}')` }}>
          <circle r="9" className={estilos.haloSatelite} />
          <circle r="4.5" className={estilos.nucleoSatelite} />
        </g>
      </g>

      <text className={estilos.codigo} x={CENTRO.x} y={CENTRO.y} dy="0.35em" textAnchor="middle">
        4<tspan className={estilos.zero}>0</tspan>4
      </text>
    </svg>
  );
}

export default function PaginaNaoEncontrada() {
  const navegar = useNavigate();
  const localizacao = useLocation();
  useTituloDocumento('Página não encontrada');

  const podeVoltar = localizacao.key !== 'default';

  return (
    <div className={estilos.tela}>
      <Link
        className={estilos.marca}
        to={caminhos.dashboard}
        aria-label={`${NOME_APLICACAO}, ir para o Dashboard`}
      >
        <span className={estilos.linhaMarca}>
          <span className={juntarClasses(estilos.simbolo, 'marca-em-transicao')}>
            <MarcaOrbit tamanho={32} />
          </span>
          <span className={estilos.nomeMarca}>{NOME_APLICACAO}</span>
        </span>
        <span className={estilos.sloganMarca}>{SLOGAN_APLICACAO}</span>
      </Link>

      <main className={estilos.cartao} id={ID_CONTEUDO_PRINCIPAL}>
        <div className={estilos.palco}>
          <OrbitaInterrompida />
        </div>

        <div className={estilos.conteudo}>
          <h1 className={juntarClasses(estilos.titulo, 'item-em-cascata')} style={comIndice(0)}>
            Página não encontrada
          </h1>

          <p className={juntarClasses(estilos.descricao, 'item-em-cascata')} style={comIndice(2)}>
            O endereço <code className={juntarClasses(estilos.endereco, 'numeros')}>{localizacao.pathname}</code> saiu
            de órbita: ele não leva a nenhuma tela do {NOME_APLICACAO}. Pode ter sido digitado com um erro ou
            pertencer a uma tela que mudou de lugar.
          </p>

          <div className={juntarClasses(estilos.acoes, 'item-em-cascata')} style={comIndice(4)}>
            <Botao icone={LayoutDashboard} onClick={() => navegar(caminhos.dashboard)}>
              Ir para o Dashboard
            </Botao>
            {podeVoltar ? (
              <Botao variante="secundario" icone={ArrowLeft} onClick={() => navegar(-1)}>
                Voltar
              </Botao>
            ) : null}
          </div>

          <nav
            className={juntarClasses(estilos.atalhos, 'item-em-cascata')}
            style={comIndice(6)}
            aria-label="Atalhos"
          >
            <span className={estilos.rotuloAtalhos}>Talvez você procure</span>
            <ul className={estilos.links}>
              {atalhos.map(({ rotulo, destino }) => (
                <li key={destino}>
                  <Link className={estilos.link} to={destino}>
                    {rotulo}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </main>
    </div>
  );
}
