import type { LucideIcon } from 'lucide-react';
import { CabecalhoPagina } from '@/componentes/layout/CabecalhoPagina';
import { EstadoVazio, Painel } from '@/componentes/ui';
import { useTituloDocumento } from '@/ganchos/useTituloDocumento';

export interface PaginaProvisoriaProps {
  titulo: string;
  tituloDocumento?: string;
  descricao: string;
  icone: LucideIcon;
  proximaEtapa: string;
}

export function PaginaProvisoria({ titulo, tituloDocumento = titulo, descricao, icone, proximaEtapa }: PaginaProvisoriaProps) {
  useTituloDocumento(tituloDocumento);

  return (
    <>
      <CabecalhoPagina titulo={titulo} descricao={descricao} />
      <Painel espacamento="nenhum">
        <EstadoVazio icone={icone} titulo="Esta tela ainda está em construção" descricao={proximaEtapa} />
      </Painel>
    </>
  );
}
