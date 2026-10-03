import { CircleCheck, CircleDashed, Clock, Flame, TriangleAlert } from 'lucide-react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { estiloTransicaoCena, misturar, mola } from '../animacao';
import { Sobretitulo } from '../componentes/Sobretitulo';
import { TextoRevelado } from '../componentes/TextoRevelado';
import { cenas, gancho, SAUDACAO } from '../linhaDoTempo';
import { cores, fontes, prioridades } from '../tema';

const indicadores = [
  { icone: CircleCheck, rotulo: 'Concluídas', valor: 15, unidade: '', apoio: 'nesta semana', cor: cores.sucesso, fundo: cores.sucessoSuave },
  { icone: CircleDashed, rotulo: 'Pendentes', valor: 4, unidade: '', apoio: 'nesta semana', cor: cores.info, fundo: cores.infoSuave },
  { icone: Clock, rotulo: 'Atrasadas', valor: 7, unidade: '', apoio: 'já passaram do prazo', cor: prioridades.ALTA.cor, fundo: prioridades.ALTA.suave },
  { icone: TriangleAlert, rotulo: 'Urgentes', valor: 2, unidade: '', apoio: 'em aberto, com qualquer data', cor: cores.erro, fundo: cores.erroSuave },
  { icone: Flame, rotulo: 'Sequência', valor: 12, unidade: 'dias', apoio: 'Recorde de 17 dias', cor: cores.aviso, fundo: cores.avisoSuave },
];

const estiloTitulo = {
  fontFamily: fontes.texto,
  fontSize: 84,
  fontWeight: 620,
  letterSpacing: '-0.035em',
  lineHeight: 1.06,
  color: cores.texto,
  textAlign: 'center' as const,
};

export function Gancho() {
  const quadro = useCurrentFrame();
  const cartao = mola(quadro, gancho.cartao, 110, 18);

  return (
    <AbsoluteFill
      style={{
        ...estiloTransicaoCena(quadro, cenas.gancho.duracao),
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 30,
        padding: '0 140px',
      }}
    >
      <Sobretitulo texto="O SEU DIA" inicio={gancho.titulo} />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <TextoRevelado inicio={gancho.titulo + 4} intervalo={2} trechos={[{ texto: 'Todo dia começa com a pergunta:' }]} estilo={estiloTitulo} />
        <TextoRevelado inicio={gancho.titulo + 14} intervalo={2.5} trechos={[{ texto: 'o que eu faço agora?', cor: cores.destaque }]} estilo={estiloTitulo} />
      </div>
      <div
        style={{
          width: '100%',
          marginTop: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 26,
          padding: '34px 40px 40px',
          borderRadius: 28,
          background: cores.superficie,
          border: `1.5px solid ${cores.borda}`,
          boxShadow: '0 40px 80px -30px rgba(0, 0, 0, 0.75)',
          opacity: cartao,
          transform: `translateY(${misturar(60, 0, cartao)}px)`,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontFamily: fontes.texto }}>
          <span style={{ fontSize: 40, fontWeight: 650, letterSpacing: '-0.025em', color: cores.texto }}>Dashboard</span>
          <TextoRevelado inicio={gancho.saudacao} intervalo={1.2} duracao={12} trechos={[{ texto: SAUDACAO }]} estilo={{ fontSize: 27, color: cores.textoSecundario }} />
        </div>
        <div style={{ display: 'flex', borderRadius: 20, border: `1.5px solid ${cores.borda}`, overflow: 'hidden' }}>
          {indicadores.map(({ icone: Icone, rotulo, valor, unidade, apoio, cor, fundo }, indice) => {
            const inicio = gancho.indicadores[indice] ?? 0;
            const entrada = mola(quadro, inicio, 170, 16);
            const numero = Math.round(
              interpolate(quadro, [inicio + 2, inicio + gancho.duracaoContagem], [0, valor], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
            );
            return (
              <div
                key={rotulo}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  padding: '24px 24px 26px',
                  borderLeft: indice === 0 ? 'none' : `1.5px solid ${cores.borda}`,
                  fontFamily: fontes.texto,
                  opacity: entrada,
                  transform: `translateY(${misturar(30, 0, entrada)}px)`,
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 22, fontWeight: 500, color: cores.texto }}>
                  <span style={{ display: 'flex', padding: 7, borderRadius: 9, background: fundo, color: cor }}>
                    <Icone size={22} strokeWidth={2.2} />
                  </span>
                  {rotulo}
                </span>
                <span style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                  <span style={{ fontSize: 58, fontWeight: 650, letterSpacing: '-0.03em', lineHeight: 1, color: cores.texto, fontVariantNumeric: 'tabular-nums', minWidth: 70 }}>
                    {numero}
                  </span>
                  {unidade ? <span style={{ fontSize: 24, color: cores.textoSecundario }}>{unidade}</span> : null}
                </span>
                <span style={{ fontSize: 20, color: cores.textoSecundario, whiteSpace: 'nowrap' }}>{apoio}</span>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
}
