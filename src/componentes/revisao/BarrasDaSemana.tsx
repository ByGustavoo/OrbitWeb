import type { CSSProperties } from 'react';
import { deDataIso } from '@/utilitarios/datas';
import { formatarDiaCompleto } from '@/utilitarios/formatacao';
import { juntarClasses } from '@/utilitarios/juntarClasses';
import estilos from './BarrasDaSemana.module.css';

const DIAS_SEMANA_CURTOS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] as const;

export interface PontoDia {
  data: string;
  valor: number;
}

export interface BarrasDaSemanaProps {
  id: string;
  titulo: string;
  total: string;
  dias: PontoDia[];
  hojeIso: string;
  formatarValor: (valor: number) => string;
  descreverValor: (valor: number) => string;
}

export function BarrasDaSemana({ id, titulo, total, dias, hojeIso, formatarValor, descreverValor }: BarrasDaSemanaProps) {
  const maximo = Math.max(1, ...dias.map((dia) => dia.valor));

  return (
    <section className={estilos.grafico} aria-labelledby={id}>
      <header className={estilos.cabecalho}>
        <h3 className={estilos.titulo} id={id}>
          {titulo}
        </h3>
        <span className={estilos.total}>{total}</span>
      </header>

      <ol className={estilos.lista}>
        {dias.map((dia) => {
          const futuro = dia.data > hojeIso;
          const ehHoje = dia.data === hojeIso;
          const semana = DIAS_SEMANA_CURTOS[deDataIso(dia.data).getDay()] ?? '';
          const descricao = futuro ? 'ainda não chegou' : descreverValor(dia.valor);
          return (
            <li key={dia.data} className={juntarClasses(estilos.linha, futuro && estilos.futuro, ehHoje && estilos.hoje)}>
              <span className="visualmente-oculto">
                {formatarDiaCompleto(dia.data)}
                {ehHoje ? ', hoje' : ''}: {descricao}
              </span>
              <span className={estilos.dia} aria-hidden="true">
                {ehHoje ? 'Hoje' : `${semana} ${deDataIso(dia.data).getDate()}`}
              </span>
              <span className={estilos.trilho} aria-hidden="true">
                {!futuro && dia.valor > 0 ? (
                  <span className={estilos.barra} style={{ '--proporcao': dia.valor / maximo } as CSSProperties} />
                ) : null}
              </span>
              <span className={estilos.valor} aria-hidden="true">
                {futuro ? '—' : formatarValor(dia.valor)}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
