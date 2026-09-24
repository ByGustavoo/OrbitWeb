import type { ReactNode } from 'react';
import { ProvedorAlteracoes } from './ProvedorAlteracoes';
import { ProvedorNotificacoes } from './ProvedorNotificacoes';
import { ProvedorTema } from './ProvedorTema';

export function ProvedoresAplicacao({ children }: { children: ReactNode }) {
  return (
    <ProvedorTema>
      <ProvedorNotificacoes>
        <ProvedorAlteracoes>{children}</ProvedorAlteracoes>
      </ProvedorNotificacoes>
    </ProvedorTema>
  );
}
