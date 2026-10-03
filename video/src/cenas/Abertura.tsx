import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { estiloTransicaoCena, misturar, mola, progresso } from '../animacao';
import { MarcaAnimada } from '../componentes/MarcaAnimada';
import { abertura, cenas } from '../linhaDoTempo';
import { cores, fontes } from '../tema';

const NOME = 'Orbit';

export function Abertura() {
  const quadro = useCurrentFrame();
  const entradaMarca = mola(quadro, abertura.marca, 120, 13);
  const tracoOrbita = progresso(quadro, abertura.tracoOrbita, 26);
  const nucleo = mola(quadro, abertura.nucleo, 180, 12);
  const satelite = mola(quadro, abertura.satelite, 70, 11);
  const pulso = progresso(quadro, abertura.brilho, 30);
  const legenda = progresso(quadro, abertura.legenda, 18);
  const deslocamentoMarca = progresso(quadro, abertura.nome - 4, 22);

  return (
    <AbsoluteFill style={{ ...estiloTransicaoCena(quadro, cenas.abertura.duracao), alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: misturar(0, 40, deslocamentoMarca) }}>
        <div style={{ position: 'relative' }}>
          <div
            style={{
              position: 'absolute',
              inset: -6,
              borderRadius: 52,
              border: `3px solid ${cores.destaque}`,
              opacity: pulso > 0 ? (1 - pulso) * 0.8 : 0,
              transform: `scale(${1 + pulso * 0.7})`,
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: -60,
              borderRadius: '50%',
              background: `radial-gradient(circle, rgba(143, 170, 230, ${0.32 * entradaMarca}), transparent 65%)`,
              filter: 'blur(10px)',
            }}
          />
          <div
            style={{
              transform: `scale(${entradaMarca}) rotate(${misturar(-14, 0, entradaMarca)}deg)`,
              filter: `drop-shadow(0 24px 48px rgba(47, 82, 153, ${0.6 * entradaMarca}))`,
            }}
          >
            <MarcaAnimada tamanho={176} tracoOrbita={tracoOrbita} nucleo={nucleo} satelite={satelite} />
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            width: misturar(0, 420, deslocamentoMarca),
            overflow: 'hidden',
            fontFamily: fontes.texto,
            fontSize: 168,
            fontWeight: 620,
            letterSpacing: '-0.035em',
            color: cores.texto,
            lineHeight: 1,
            paddingBottom: 18,
            marginBottom: -18,
          }}
        >
          {NOME.split('').map((letra, indice) => {
            const t = progresso(quadro, abertura.nome + indice * abertura.intervaloLetras, 20);
            return (
              <span key={indice} style={{ display: 'inline-block', transform: `translateY(${misturar(110, 0, t)}%)`, opacity: t }}>
                {letra}
              </span>
            );
          })}
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          top: '50%',
          marginTop: 150,
          fontFamily: fontes.mono,
          fontSize: 26,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: cores.textoSecundario,
          opacity: legenda,
          transform: `translateY(${misturar(16, 0, legenda)}px)`,
        }}
      >
        Produtividade pessoal
      </div>
    </AbsoluteFill>
  );
}
