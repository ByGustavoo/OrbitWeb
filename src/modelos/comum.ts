import type { Cor } from './enumeracoes';

export interface PaginaDTO<T> {
  itens: T[];
  pagina: number;
  tamanho: number;
  totalItens: number;
  totalPaginas: number;
}

export interface ErroCampoDTO {
  campo: string;
  mensagem: string;
}

export interface ProblemaDTO {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  erros?: ErroCampoDTO[];
}

export interface CategoriaDTO {
  id: number;
  nome: string;
  cor: Cor;
}
