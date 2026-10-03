import { Bell, MonitorSmartphone, Repeat, SunMoon, Timer } from 'lucide-react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { estiloTransicaoCena, misturar, mola, progresso } from '../animacao';
import { Sobretitulo } from '../componentes/Sobretitulo';
import { TextoRevelado } from '../componentes/TextoRevelado';
import { cenas, confianca } from '../linhaDoTempo';
import { cores, fontes } from '../tema';

const selos = [
  { icone: Repeat, rotulo: 'Tarefas recorrentes' },
  { icone: Timer, rotulo: 'Cronômetro que sobrevive ao recarregar' },
  { icone: Bell, rotulo: 'Lembretes dentro do app' },
  { icone: SunMoon, rotulo: 'Tema claro, escuro e sistema' },
  { icone: MonitorSmartphone, rotulo: 'Do desktop ao celular' },
];

export function Confianca() {
  const quadro = useCurrentFrame();

  return (
    <AbsoluteFill
      style={{
        ...estiloTransicaoCena(quadro, cenas.confianca.duracao),
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 40,
      }}
    >
      <Sobretitulo texto="NO SEU RITMO" inicio={confianca.titulo} />
      <TextoRevelado
        inicio={confianca.titulo + 2}
        intervalo={2}
        trechos={[{ texto: 'Feito para' }, { texto: 'o seu ritmo.', cor: cores.destaque }]}
        estilo={{
          maxWidth: 1500,
          fontFamily: fontes.texto,
          fontSize: 104,
          fontWeight: 620,
          letterSpacing: '-0.04em',
          lineHeight: 1.04,
          color: cores.texto,
          textAlign: 'center',
        }}
      />
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 24, maxWidth: 1500, marginTop: 24 }}>
        {selos.map(({ icone: Icone, rotulo }, indice) => {
          const entrada = mola(quadro, confianca.selos[indice] ?? 0, 170, 15);
          return (
            <span
              key={rotulo}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '20px 30px',
                borderRadius: 999,
                background: cores.superficie,
                border: `1.5px solid ${cores.borda}`,
                fontFamily: fontes.texto,
                fontSize: 28,
                fontWeight: 500,
                color: cores.texto,
                opacity: entrada,
                transform: `translateY(${misturar(40, 0, entrada)}px) scale(${misturar(0.85, 1, entrada)})`,
                boxShadow: '0 24px 48px -24px rgba(0, 0, 0, 0.8)',
              }}
            >
              <span style={{ display: 'flex', padding: 10, borderRadius: 12, background: cores.destaqueSuave, color: cores.destaque }}>
                <Icone size={28} strokeWidth={2.2} />
              </span>
              {rotulo}
            </span>
          );
        })}
      </div>
      <div
        style={{
          marginTop: 16,
          maxWidth: 1200,
          fontFamily: fontes.texto,
          fontSize: 30,
          lineHeight: 1.45,
          textAlign: 'center',
          color: cores.textoSecundario,
          opacity: progresso(quadro, confianca.rodape, 18),
        }}
      >
        Uso individual, sem login. Tarefas, agenda e estudo no mesmo lugar.
      </div>
    </AbsoluteFill>
  );
}
