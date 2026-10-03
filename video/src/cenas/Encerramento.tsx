import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { estiloTransicaoCena, misturar, mola, progresso } from '../animacao';
import { MarcaAnimada } from '../componentes/MarcaAnimada';
import { TextoRevelado } from '../componentes/TextoRevelado';
import { cenas, encerramento } from '../linhaDoTempo';
import { cores, fontes } from '../tema';

export function Encerramento() {
  const quadro = useCurrentFrame();
  const marca = mola(quadro, encerramento.marca, 110, 14);
  const satelite = mola(quadro, encerramento.marca + 4, 70, 11);
  const nome = progresso(quadro, encerramento.nome, 20);
  const respiro = progresso(quadro, 0, cenas.encerramento.duracao, (t) => t);

  return (
    <AbsoluteFill
      style={{
        ...estiloTransicaoCena(quadro, cenas.encerramento.duracao, false),
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 44,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 36, transform: `scale(${1 + respiro * 0.03})` }}>
        <div style={{ transform: `scale(${marca})`, filter: `drop-shadow(0 24px 48px rgba(47, 82, 153, ${0.6 * marca}))` }}>
          <MarcaAnimada tamanho={132} tracoOrbita={1} nucleo={1} satelite={satelite} />
        </div>
        <span
          style={{
            fontFamily: fontes.texto,
            fontSize: 132,
            fontWeight: 620,
            letterSpacing: '-0.035em',
            lineHeight: 1,
            color: cores.texto,
            opacity: nome,
            transform: `translateX(${misturar(-30, 0, nome)}px)`,
            clipPath: `inset(-20% ${misturar(100, -5, nome)}% -20% 0)`,
          }}
        >
          Orbit
        </span>
      </div>
      <div style={{ display: 'flex', gap: '0.3em', fontFamily: fontes.texto, fontSize: 60, fontWeight: 500, letterSpacing: '-0.02em', color: cores.texto }}>
        <TextoRevelado inicio={encerramento.slogan} intervalo={2} trechos={[{ texto: 'Planeje o dia.' }]} />
        <TextoRevelado inicio={encerramento.fechoSlogan} intervalo={3} duracao={20} trechos={[{ texto: 'Acompanhe o ritmo.', cor: cores.destaque }]} />
      </div>
    </AbsoluteFill>
  );
}
