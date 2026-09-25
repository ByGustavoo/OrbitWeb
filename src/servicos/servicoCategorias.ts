import { clienteHttp } from '@/api/clienteHttp';
import { rotasApi } from '@/api/rotasApi';
import type { CategoriaDTO, CategoriaEnvioDTO } from '@/modelos/comum';

export const servicoCategorias = {
  buscarCategorias(signal?: AbortSignal): Promise<CategoriaDTO[]> {
    return clienteHttp.get<CategoriaDTO[]>(rotasApi.categorias.lista, { signal });
  },

  criarCategoria(dados: CategoriaEnvioDTO, signal?: AbortSignal): Promise<CategoriaDTO> {
    return clienteHttp.post<CategoriaDTO>(rotasApi.categorias.lista, dados, { signal });
  },

  atualizarCategoria(id: number, dados: CategoriaEnvioDTO, signal?: AbortSignal): Promise<CategoriaDTO> {
    return clienteHttp.put<CategoriaDTO>(rotasApi.categorias.porId(id), dados, { signal });
  },

  excluirCategoria(id: number, signal?: AbortSignal): Promise<void> {
    return clienteHttp.delete<void>(rotasApi.categorias.porId(id), { signal });
  },
};
