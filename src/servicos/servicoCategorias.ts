import { clienteHttp } from '@/api/clienteHttp';
import { rotasApi } from '@/api/rotasApi';
import type { CategoriaDTO } from '@/modelos/comum';

export const servicoCategorias = {
  buscarCategorias(signal?: AbortSignal): Promise<CategoriaDTO[]> {
    return clienteHttp.get<CategoriaDTO[]>(rotasApi.categorias.lista, { signal });
  },
};
