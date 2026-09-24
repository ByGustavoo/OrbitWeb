import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { useContagem } from '@/ganchos/useContagem';
import { formatarNumero } from '@/utilitarios/formatacao';
import { juntarClasses } from '@/utilitarios/juntarClasses';
import estilos from './IndicadorNumerico.module.css';

export type TomIndicador = 'neutro' | 'destaque' | 'sucesso' | 'erro' | 'urgente' | 'sequencia';

export interface IndicadorNumericoProps {
  icone: LucideIcon;
  rotulo: string;
  valor: number;
  unidade?: (valor: number) => string;
  formatar?: (valor: number) => string;
  contexto: ReactNode;
  tom?: TomIndicador;
  className?: string;
}

export function IndicadorNumerico({
  icone: Icone,
  rotulo,
  valor,
  unidade,
  formatar = formatarNumero,
  contexto,
  tom = 'neutro',
  className,
}: IndicadorNumericoProps) {
  const exibido = useContagem(valor);

  return (
    <div className={juntarClasses(estilos.indicador, estilos[tom], className)}>
      <dt className={estilos.rotulo}>
        <span className={estilos.icone} aria-hidden="true">
          <Icone size={15} strokeWidth={2.25} />
        </span>
        {rotulo}
      </dt>
      <dd className={estilos.valor}>
        <span aria-hidden="true">{formatar(exibido)}</span>
        <span className="visualmente-oculto">{formatar(valor)}</span>
        {unidade ? <span className={estilos.unidade}>{unidade(valor)}</span> : null}
      </dd>
      <dd className={estilos.contexto}>{contexto}</dd>
    </div>
  );
}
