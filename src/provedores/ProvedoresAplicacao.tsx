import type { ReactNode } from 'react';
import { ProvedorNotificacoes } from './ProvedorNotificacoes';
import { ProvedorTema } from './ProvedorTema';

export function ProvedoresAplicacao({ children }: { children: ReactNode }) {
  return (
    <ProvedorTema>
      <ProvedorNotificacoes>{children}</ProvedorNotificacoes>
    </ProvedorTema>
  );
}
