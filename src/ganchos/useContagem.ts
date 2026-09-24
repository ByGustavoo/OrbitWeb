import { useEffect, useRef, useState } from 'react';

const DURACAO_MS = 1500;

function desacelerar(progresso: number): number {
  return 1 - (1 - progresso) ** 3;
}

function prefereMovimentoReduzido(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function useContagem(alvo: number): number {
  const [valor, setValor] = useState(() => (prefereMovimentoReduzido() ? alvo : 0));
  const valorAtual = useRef(valor);

  useEffect(() => {
    const inicio = valorAtual.current;
    if (inicio === alvo) return;
    if (prefereMovimentoReduzido()) {
      valorAtual.current = alvo;
      setValor(alvo);
      return;
    }

    let quadro = 0;
    const comeco = performance.now();
    const passo = (agora: number) => {
      const progresso = Math.min(1, (agora - comeco) / DURACAO_MS);
      const proximo = Math.round(inicio + (alvo - inicio) * desacelerar(progresso));
      valorAtual.current = proximo;
      setValor(proximo);
      if (progresso < 1) quadro = requestAnimationFrame(passo);
    };
    quadro = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(quadro);
  }, [alvo]);

  return valor;
}
