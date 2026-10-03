import { Composition } from 'remotion';
import { Apresentacao } from './Apresentacao';
import { carregarFontes } from './fontes';
import { ALTURA, DURACAO_TOTAL, LARGURA, QUADROS_POR_SEGUNDO } from './linhaDoTempo';

carregarFontes();

export function Raiz() {
  return (
    <Composition
      id="ApresentacaoOrbit"
      component={Apresentacao}
      durationInFrames={DURACAO_TOTAL}
      fps={QUADROS_POR_SEGUNDO}
      width={LARGURA}
      height={ALTURA}
    />
  );
}
