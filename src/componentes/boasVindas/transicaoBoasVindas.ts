import { flushSync } from 'react-dom';

const CLASSE_TRANSICAO = 'saindo-das-boas-vindas';
const ESPERA_MAXIMA_PAGINA_MS = 600;
const INTERVALO_VERIFICACAO_MS = 16;

interface TransicaoDeVisao {
  ready: Promise<void>;
  finished: Promise<void>;
}

interface DocumentoComTransicao {
  startViewTransition?: (atualizar: () => Promise<void> | void) => TransicaoDeVisao;
}

function esperarPaginaPronta(): Promise<void> {
  return new Promise((resolver) => {
    const inicio = performance.now();
    const verificar = () => {
      const pronta = document.querySelector('main#conteudo h1');
      if (pronta || performance.now() - inicio > ESPERA_MAXIMA_PAGINA_MS) resolver();
      else window.setTimeout(verificar, INTERVALO_VERIFICACAO_MS);
    };
    verificar();
  });
}

export function transicionarParaAplicacao(aoComecar: () => void): void {
  const documento = document as unknown as DocumentoComTransicao;

  if (!documento.startViewTransition || document.visibilityState !== 'visible') {
    aoComecar();
    return;
  }

  const raiz = document.documentElement;
  const limpar = () => raiz.classList.remove(CLASSE_TRANSICAO);
  raiz.classList.add(CLASSE_TRANSICAO);

  const transicao = documento.startViewTransition(async () => {
    flushSync(aoComecar);
    await esperarPaginaPronta();
  });
  transicao.ready.catch(limpar);
  transicao.finished.then(limpar, limpar);
}
