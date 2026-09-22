import { useEffect } from 'react';
import { NOME_APLICACAO, SLOGAN_APLICACAO } from '@/configuracoes/aplicacao';

export function useTituloDocumento(titulo: string): void {
  useEffect(() => {
    document.title = titulo ? `${titulo} · ${NOME_APLICACAO}` : `${NOME_APLICACAO} · ${SLOGAN_APLICACAO}`;
  }, [titulo]);
}
