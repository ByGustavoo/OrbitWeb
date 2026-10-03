import type { CSSProperties, ReactNode } from 'react';
import { cores } from '../tema';

interface CartaoProps {
  children: ReactNode;
  estilo?: CSSProperties;
}

export function Cartao({ children, estilo }: CartaoProps) {
  return (
    <div
      style={{
        background: cores.superficie,
        border: `1.5px solid ${cores.borda}`,
        borderRadius: 28,
        padding: 44,
        boxShadow: '0 40px 80px -30px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.02) inset',
        ...estilo,
      }}
    >
      {children}
    </div>
  );
}
