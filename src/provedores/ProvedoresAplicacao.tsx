import type { ReactNode } from 'react';
import { AgendadorLembretes } from './AgendadorLembretes';
import { ProvedorAcoesTarefa } from './ProvedorAcoesTarefa';
import { ProvedorAlteracoes } from './ProvedorAlteracoes';
import { ProvedorCronometro } from './ProvedorCronometro';
import { ProvedorNotificacoes } from './ProvedorNotificacoes';
import { ProvedorTema } from './ProvedorTema';

export function ProvedoresAplicacao({ children }: { children: ReactNode }) {
  return (
    <ProvedorTema>
      <ProvedorNotificacoes>
        <ProvedorAlteracoes>
          <ProvedorCronometro>
            <ProvedorAcoesTarefa>
              <AgendadorLembretes />
              {children}
            </ProvedorAcoesTarefa>
          </ProvedorCronometro>
        </ProvedorAlteracoes>
      </ProvedorNotificacoes>
    </ProvedorTema>
  );
}
