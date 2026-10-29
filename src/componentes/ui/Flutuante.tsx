import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { CSSProperties, KeyboardEvent, ReactNode, RefObject } from 'react';
import { manterTabDentro } from '@/utilitarios/foco';
import { juntarClasses } from '@/utilitarios/juntarClasses';
import estilos from './Flutuante.module.css';

const DISTANCIA_ANCORA = 6;
const MARGEM_TELA = 8;

export interface FlutuanteProps {
  aberto: boolean;
  ancora: RefObject<HTMLElement>;
  aoFechar: (devolverFocoParaAncora: boolean) => void;
  larguraMinimaDaAncora?: boolean;
  id?: string;
  papel?: 'dialog' | 'listbox';
  rotulo?: string;
  className?: string;
  children: ReactNode;
}

interface Posicao {
  top: number;
  left: number;
  minWidth: number;
  alturaDisponivel: number;
}

interface AreaRolavel {
  conteiner: HTMLElement;
  topoVisivel: number;
}

function areaRolavel(elemento: HTMLElement): AreaRolavel | null {
  for (let atual = elemento.parentElement; atual && atual !== document.body; atual = atual.parentElement) {
    const { overflowY, position } = getComputedStyle(atual);
    if ((overflowY === 'auto' || overflowY === 'scroll') && atual.scrollHeight > atual.clientHeight) {
      return { conteiner: atual, topoVisivel: atual.getBoundingClientRect().top };
    }
    if (position === 'fixed' || atual instanceof HTMLDialogElement) return null;
  }
  const pagina = document.scrollingElement as HTMLElement | null;
  if (!pagina) return null;
  const alturaCabecalho = parseFloat(getComputedStyle(pagina).getPropertyValue('--altura-cabecalho')) || 0;
  return { conteiner: pagina, topoVisivel: alturaCabecalho };
}

export function Flutuante({
  aberto,
  ancora,
  aoFechar,
  larguraMinimaDaAncora = false,
  id,
  papel = 'dialog',
  rotulo,
  className,
  children,
}: FlutuanteProps) {
  const painelRef = useRef<HTMLDivElement>(null);
  const [posicao, setPosicao] = useState<Posicao | null>(null);
  const folgaCriada = useRef<{ conteiner: HTMLElement; paddingOriginal: string } | null>(null);

  const posicionar = useCallback(() => {
    const elementoAncora = ancora.current;
    const painel = painelRef.current;
    if (!elementoAncora || !painel) return;

    const retangulo = elementoAncora.getBoundingClientRect();
    const largura = Math.max(painel.offsetWidth, larguraMinimaDaAncora ? retangulo.width : 0);
    const topo = retangulo.bottom + DISTANCIA_ANCORA;
    const esquerda = Math.min(Math.max(retangulo.left, MARGEM_TELA), window.innerWidth - MARGEM_TELA - largura);

    setPosicao({
      top: Math.max(topo, MARGEM_TELA),
      left: Math.max(esquerda, MARGEM_TELA),
      minWidth: larguraMinimaDaAncora ? retangulo.width : 0,
      alturaDisponivel: Math.max(window.innerHeight - MARGEM_TELA - topo, 0),
    });
  }, [ancora, larguraMinimaDaAncora]);

  const abrirEspacoAbaixo = useCallback(() => {
    const elementoAncora = ancora.current;
    const painel = painelRef.current;
    if (!elementoAncora || !painel) return;
    const falta =
      elementoAncora.getBoundingClientRect().bottom + DISTANCIA_ANCORA + painel.offsetHeight - (window.innerHeight - MARGEM_TELA);
    if (falta <= 0) return;
    const area = areaRolavel(elementoAncora);
    if (!area) return;
    const { conteiner, topoVisivel } = area;
    const rolagemRestante = conteiner.scrollHeight - conteiner.clientHeight - conteiner.scrollTop;
    const alcanceAteOTopo = Math.max(elementoAncora.getBoundingClientRect().top - topoVisivel - MARGEM_TELA, 0);
    const deslocamento = Math.min(falta, alcanceAteOTopo);
    const folga = deslocamento - rolagemRestante;
    if (folga > 0) {
      folgaCriada.current = { conteiner, paddingOriginal: conteiner.style.paddingBottom };
      conteiner.style.paddingBottom = `calc(${getComputedStyle(conteiner).paddingBottom} + ${Math.ceil(folga)}px)`;
    }
    conteiner.scrollTop += deslocamento;
  }, [ancora]);

  const desfazerFolga = useCallback(() => {
    const folga = folgaCriada.current;
    if (!folga) return;
    folga.conteiner.style.paddingBottom = folga.paddingOriginal;
    folgaCriada.current = null;
  }, []);

  useLayoutEffect(() => {
    if (!aberto) {
      setPosicao(null);
      desfazerFolga();
      return;
    }
    abrirEspacoAbaixo();
    posicionar();
  }, [aberto, abrirEspacoAbaixo, desfazerFolga, posicionar]);

  useEffect(() => desfazerFolga, [desfazerFolga]);

  useEffect(() => {
    if (!aberto) return;
    let quadro = 0;
    const agendar = () => {
      cancelAnimationFrame(quadro);
      quadro = requestAnimationFrame(posicionar);
    };
    const observador = new ResizeObserver(agendar);
    if (painelRef.current) observador.observe(painelRef.current);
    window.addEventListener('resize', agendar);
    window.addEventListener('scroll', agendar, true);
    return () => {
      cancelAnimationFrame(quadro);
      observador.disconnect();
      window.removeEventListener('resize', agendar);
      window.removeEventListener('scroll', agendar, true);
    };
  }, [aberto, posicionar]);

  useEffect(() => {
    if (!aberto) return;
    const aoPressionarFora = (evento: PointerEvent) => {
      const alvo = evento.target as Node;
      if (painelRef.current?.contains(alvo) || ancora.current?.contains(alvo)) return;
      aoFechar(false);
    };
    document.addEventListener('pointerdown', aoPressionarFora, true);
    return () => document.removeEventListener('pointerdown', aoPressionarFora, true);
  }, [aberto, ancora, aoFechar]);

  const aoPressionarTecla = (evento: KeyboardEvent<HTMLDivElement>) => {
    if (evento.key === 'Escape') {
      evento.preventDefault();
      evento.nativeEvent.stopPropagation();
      aoFechar(true);
      return;
    }
    if (evento.key === 'Tab' && painelRef.current) {
      evento.nativeEvent.stopPropagation();
      manterTabDentro(evento.nativeEvent, painelRef.current);
    }
  };

  if (!aberto) return null;

  const estilo: CSSProperties = posicao
    ? ({
        top: posicao.top,
        left: posicao.left,
        minWidth: posicao.minWidth || undefined,
        '--altura-disponivel': `${posicao.alturaDisponivel}px`,
      } as CSSProperties)
    : { top: 0, left: 0, visibility: 'hidden' };

  return createPortal(
    <div
      ref={painelRef}
      id={id}
      role={papel === 'dialog' ? 'dialog' : undefined}
      aria-label={papel === 'dialog' ? rotulo : undefined}
      className={juntarClasses(estilos.flutuante, className)}
      style={estilo}
      onKeyDown={aoPressionarTecla}
    >
      {children}
    </div>,
    document.body,
  );
}
