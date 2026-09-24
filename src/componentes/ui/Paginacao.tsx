import { ChevronLeft, ChevronRight } from 'lucide-react';
import { juntarClasses } from '@/utilitarios/juntarClasses';
import { Botao } from './Botao';
import estilos from './Paginacao.module.css';

export interface PaginacaoProps {
  pagina: number;
  totalPaginas: number;
  aoMudar: (pagina: number) => void;
  rotulo?: string;
  className?: string;
}

export function Paginacao({ pagina, totalPaginas, aoMudar, rotulo = 'Paginação', className }: PaginacaoProps) {
  if (totalPaginas <= 1) return null;

  return (
    <nav className={juntarClasses(estilos.paginacao, className)} aria-label={rotulo}>
      <Botao variante="secundario" tamanho="sm" icone={ChevronLeft} disabled={pagina <= 0} onClick={() => aoMudar(pagina - 1)}>
        Anterior
      </Botao>
      <span className={estilos.posicao} aria-live="polite">
        Página <strong>{pagina + 1}</strong> de {totalPaginas}
      </span>
      <Botao
        variante="secundario"
        tamanho="sm"
        iconeDireita={ChevronRight}
        disabled={pagina >= totalPaginas - 1}
        onClick={() => aoMudar(pagina + 1)}
      >
        Próxima
      </Botao>
    </nav>
  );
}
