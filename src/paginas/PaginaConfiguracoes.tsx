import { useEffect, useRef, useState } from 'react';
import type { MouseEvent } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Palette, Tags, Timer } from 'lucide-react';
import { SecaoAparencia } from '@/componentes/configuracoes/SecaoAparencia';
import { SecaoCategorias } from '@/componentes/configuracoes/SecaoCategorias';
import { SecaoPomodoro } from '@/componentes/configuracoes/SecaoPomodoro';
import { CabecalhoPagina } from '@/componentes/layout/CabecalhoPagina';
import { useParametrosPagina } from '@/ganchos/useParametrosPagina';
import { useTituloDocumento } from '@/ganchos/useTituloDocumento';
import { juntarClasses } from '@/utilitarios/juntarClasses';
import estilos from './PaginaConfiguracoes.module.css';

type ChaveSecao = 'aparencia' | 'pomodoro' | 'categorias';

interface ItemIndice {
  chave: ChaveSecao;
  rotulo: string;
  icone: LucideIcon;
}

const ULTIMA_SECAO: ChaveSecao = 'categorias';
const ALTURA_CABECALHO_PX = 64;
const DURACAO_MAXIMA_ROLAGEM_MS = 1000;
const PROPORCAO_LINHA_DE_LEITURA = 0.35;

const itensIndice: ItemIndice[] = [
  { chave: 'aparencia', rotulo: 'Aparência', icone: Palette },
  { chave: 'pomodoro', rotulo: 'Pomodoro', icone: Timer },
  { chave: 'categorias', rotulo: 'Categorias', icone: Tags },
];

const idSecao = (chave: ChaveSecao) => `secao-${chave}`;
const idTituloSecao = (chave: ChaveSecao) => `titulo-secao-${chave}`;

function ehChaveSecao(valor: string | null): valor is ChaveSecao {
  return itensIndice.some((item) => item.chave === valor);
}

function prefereMovimentoReduzido(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function PaginaConfiguracoes() {
  useTituloDocumento('Configurações');
  const [parametros, definirParametros] = useParametrosPagina();
  const secaoPedida = parametros.get('secao');
  const [ativa, setAtiva] = useState<ChaveSecao>(ehChaveSecao(secaoPedida) ? secaoPedida : 'aparencia');
  const rolagemProgramada = useRef<ChaveSecao | null>(null);
  const temporizadorRolagem = useRef(0);
  const secaoPedidaAtendida = useRef(false);

  useEffect(() => {
    if (secaoPedidaAtendida.current || !ehChaveSecao(secaoPedida)) return;
    secaoPedidaAtendida.current = true;
    setAtiva(secaoPedida);
    if (secaoPedida !== 'aparencia') document.getElementById(idSecao(secaoPedida))?.scrollIntoView({ block: 'start' });
  }, [secaoPedida]);

  useEffect(() => () => window.clearTimeout(temporizadorRolagem.current), []);

  useEffect(() => {
    let quadro = 0;

    const medir = () => {
      quadro = 0;
      if (rolagemProgramada.current) return;
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
        setAtiva(ULTIMA_SECAO);
        return;
      }
      const linhaDeLeitura = ALTURA_CABECALHO_PX + (window.innerHeight - ALTURA_CABECALHO_PX) * PROPORCAO_LINHA_DE_LEITURA;
      let atual: ChaveSecao = 'aparencia';
      for (const { chave } of itensIndice) {
        const topo = document.getElementById(idSecao(chave))?.getBoundingClientRect().top;
        if (topo !== undefined && topo <= linhaDeLeitura) atual = chave;
      }
      setAtiva(atual);
    };

    const agendarMedicao = () => {
      if (!quadro) quadro = window.requestAnimationFrame(medir);
    };

    const liberarRolagem = () => {
      rolagemProgramada.current = null;
    };

    window.addEventListener('scroll', agendarMedicao, { passive: true });
    window.addEventListener('resize', agendarMedicao);
    window.addEventListener('scrollend', liberarRolagem);
    window.addEventListener('wheel', liberarRolagem, { passive: true });
    window.addEventListener('touchstart', liberarRolagem, { passive: true });
    agendarMedicao();
    return () => {
      window.cancelAnimationFrame(quadro);
      window.removeEventListener('scroll', agendarMedicao);
      window.removeEventListener('resize', agendarMedicao);
      window.removeEventListener('scrollend', liberarRolagem);
      window.removeEventListener('wheel', liberarRolagem);
      window.removeEventListener('touchstart', liberarRolagem);
    };
  }, []);

  const irPara = (evento: MouseEvent<HTMLAnchorElement>, chave: ChaveSecao) => {
    evento.preventDefault();
    const secao = document.getElementById(idSecao(chave));
    if (!secao) return;
    secaoPedidaAtendida.current = true;
    rolagemProgramada.current = chave;
    window.clearTimeout(temporizadorRolagem.current);
    temporizadorRolagem.current = window.setTimeout(() => {
      rolagemProgramada.current = null;
    }, DURACAO_MAXIMA_ROLAGEM_MS);
    setAtiva(chave);
    secao.scrollIntoView({ behavior: prefereMovimentoReduzido() ? 'auto' : 'smooth', block: 'start' });
    document.getElementById(idTituloSecao(chave))?.focus({ preventScroll: true });
    definirParametros(new URLSearchParams({ secao: chave }), { replace: true });
  };

  return (
    <>
      <CabecalhoPagina titulo="Configurações" descricao="Ajuste a aparência, o ritmo do Pomodoro e as categorias das suas tarefas." />

      <div className={estilos.estrutura}>
        <nav className={estilos.indice} aria-label="Seções das configurações">
          <ul className={estilos.listaIndice}>
            {itensIndice.map(({ chave, rotulo, icone: Icone }) => (
              <li key={chave}>
                <a
                  href={`#${idSecao(chave)}`}
                  className={juntarClasses(estilos.itemIndice, ativa === chave && estilos.itemAtivo)}
                  aria-current={ativa === chave ? 'true' : undefined}
                  onClick={(evento) => irPara(evento, chave)}
                >
                  <Icone size={16} strokeWidth={2} aria-hidden="true" />
                  {rotulo}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className={estilos.secoes}>
          <SecaoAparencia id={idSecao('aparencia')} idTitulo={idTituloSecao('aparencia')} />
          <SecaoPomodoro id={idSecao('pomodoro')} idTitulo={idTituloSecao('pomodoro')} />
          <SecaoCategorias id={idSecao('categorias')} idTitulo={idTituloSecao('categorias')} />
        </div>
      </div>
    </>
  );
}
