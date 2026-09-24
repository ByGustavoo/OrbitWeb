import { useEffect, useState } from 'react';

const INTERVALO_PADRAO_MS = 250;

export function useAgora(ativo: boolean, intervaloMs = INTERVALO_PADRAO_MS): Date {
  const [agora, setAgora] = useState(() => new Date());

  useEffect(() => {
    setAgora(new Date());
    if (!ativo) return;
    const atualizar = () => setAgora(new Date());
    const intervalo = window.setInterval(atualizar, intervaloMs);
    document.addEventListener('visibilitychange', atualizar);
    window.addEventListener('focus', atualizar);
    return () => {
      window.clearInterval(intervalo);
      document.removeEventListener('visibilitychange', atualizar);
      window.removeEventListener('focus', atualizar);
    };
  }, [ativo, intervaloMs]);

  return agora;
}
