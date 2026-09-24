import { useEffect, useState } from 'react';
import { hojeIso } from '@/utilitarios/datas';

export function useHojeIso(): string {
  const [valor, setValor] = useState(hojeIso);

  useEffect(() => {
    const agora = new Date();
    const proximaMeiaNoite = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + 1);
    const temporizador = window.setTimeout(() => setValor(hojeIso()), proximaMeiaNoite.getTime() - agora.getTime() + 500);
    return () => window.clearTimeout(temporizador);
  }, [valor]);

  return valor;
}
