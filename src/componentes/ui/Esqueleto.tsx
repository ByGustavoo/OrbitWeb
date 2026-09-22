import type { CSSProperties } from 'react';
import { juntarClasses } from '@/utilitarios/juntarClasses';
import estilos from './Esqueleto.module.css';

export interface EsqueletoProps {
  largura?: number | string;
  altura?: number | string;
  raio?: string;
  className?: string;
}

export function Esqueleto({ largura = '100%', altura = 14, raio, className }: EsqueletoProps) {
  const estilo: CSSProperties = { width: largura, height: altura, borderRadius: raio };
  return <span className={juntarClasses(estilos.esqueleto, className)} style={estilo} aria-hidden="true" />;
}

export interface EsqueletoListaProps {
  linhas?: number;
  rotulo?: string;
}

export function EsqueletoLista({ linhas = 4, rotulo = 'Carregando…' }: EsqueletoListaProps) {
  return (
    <div className={estilos.lista} role="status" aria-label={rotulo}>
      {Array.from({ length: linhas }, (_, indice) => (
        <div key={indice} className={estilos.linha} style={{ opacity: 1 - indice * (0.6 / linhas) }}>
          <Esqueleto largura={20} altura={20} raio="var(--raio-sm)" />
          <div className={estilos.textosLinha}>
            <Esqueleto largura={`${72 - ((indice * 17) % 30)}%`} altura={14} />
            <Esqueleto largura={`${38 - ((indice * 11) % 16)}%`} altura={11} />
          </div>
          <Esqueleto largura={56} altura={22} raio="var(--raio-sm)" />
        </div>
      ))}
    </div>
  );
}

export function EsqueletoCartao({ rotulo = 'Carregando…' }: { rotulo?: string }) {
  return (
    <div className={estilos.cartao} role="status" aria-label={rotulo}>
      <Esqueleto largura="40%" altura={13} />
      <Esqueleto largura="55%" altura={30} raio="var(--raio-sm)" />
      <Esqueleto largura="30%" altura={11} />
    </div>
  );
}
