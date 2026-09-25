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

export interface ErrorResponseDTO {
  status: number;
  title: string;
  instance: string;
  type: string;
  detail: string;
  errors?: ErroCampoDTO[] | null;
}

export interface CategoriaDTO {
  id: number;
  nome: string;
  cor: Cor;
  quantidadeTarefas: number;
}

export interface CategoriaEnvioDTO {
  nome: string;
  cor: Cor;
}
