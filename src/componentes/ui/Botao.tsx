import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { juntarClasses } from '@/utilitarios/juntarClasses';
import { IndicadorGiratorio } from './IndicadorGiratorio';
import estilos from './Botao.module.css';

export type VarianteBotao = 'primario' | 'secundario' | 'terciario' | 'perigo';
export type TamanhoBotao = 'sm' | 'md';

export interface BotaoProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: VarianteBotao;
  tamanho?: TamanhoBotao;
  icone?: LucideIcon;
  iconeDireita?: LucideIcon;
  carregando?: boolean;
  larguraTotal?: boolean;
  children?: ReactNode;
}

export const Botao = forwardRef<HTMLButtonElement, BotaoProps>(function Botao(
  {
    variante = 'primario',
    tamanho = 'md',
    icone: Icone,
    iconeDireita: IconeDireita,
    carregando = false,
    larguraTotal = false,
    type = 'button',
    className,
    children,
    disabled,
    ...resto
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={juntarClasses(
        estilos.botao,
        estilos[variante],
        estilos[tamanho],
        larguraTotal && estilos.larguraTotal,
        carregando && estilos.carregando,
        className,
      )}
      disabled={disabled || carregando}
      aria-busy={carregando || undefined}
      {...resto}
    >
      {carregando ? (
        <IndicadorGiratorio tamanho={16} />
      ) : Icone ? (
        <Icone size={16} strokeWidth={2} aria-hidden="true" />
      ) : null}
      {children}
      {IconeDireita && !carregando ? <IconeDireita size={16} strokeWidth={2} aria-hidden="true" /> : null}
    </button>
  );
});
