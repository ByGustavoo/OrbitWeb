import { BookOpen, CalendarDays, CircleCheck, Percent } from 'lucide-react';
import { interpolate, useCurrentFrame } from 'remotion';
import { misturar, mola, progresso } from '../animacao';
import { Cartao } from '../componentes/Cartao';
import { CenaDividida } from '../componentes/CenaDividida';
import { cenas, revisao } from '../linhaDoTempo';
import { cores, fontes } from '../tema';

const indicadores = [
  { icone: CircleCheck, rotulo: 'Tarefas concluídas', apoio: '3 a mais que na semana anterior', cor: cores.sucesso, fundo: cores.sucessoSuave, formatar: (t: number) => String(Math.round(15 * t)) },
  {
    icone: BookOpen,
    rotulo: 'Tempo de estudo',
    apoio: '2h a menos que na semana anterior',
    cor: cores.destaque,
    fundo: cores.destaqueSuave,
    formatar: (t: number) => {
      const minutos = Math.round(630 * t);
      return `${Math.floor(minutos / 60)}h ${minutos % 60}min`;
    },
  },
  { icone: Percent, rotulo: 'Taxa de conclusão', apoio: '15 de 25 planejadas até hoje', cor: cores.textoSecundario, fundo: cores.neutroSuave, formatar: (t: number) => `${Math.round(60 * t)}%` },
  { icone: CalendarDays, rotulo: 'Dias com atividade', apoio: 'Igual à semana anterior', cor: cores.textoSecundario, fundo: cores.neutroSuave, formatar: (t: number) => `${Math.round(6 * t)} de 6` },
];

const situacoes = [
  { rotulo: 'Concluídas', quantidade: 15, cor: cores.sucesso },
  { rotulo: 'A fazer', quantidade: 4, cor: cores.destaque },
  { rotulo: 'Atrasadas', quantidade: 7, cor: cores.erro },
  { rotulo: 'Não realizadas', quantidade: 2, cor: cores.aviso },
  { rotulo: 'Canceladas', quantidade: 1, cor: cores.naoRealizada },
];

const TOTAL_PLANEJADAS = 29;

const destaques = ['15 tarefas concluídas', '10h 30min de estudo em 13 sessões', '2 metas de estudo atingidas'];

export function Revisao() {
  const quadro = useCurrentFrame();
  const barra = progresso(quadro, revisao.barra, revisao.duracaoBarra);
  let acumulado = 0;

  return (
    <CenaDividida
      duracao={cenas.revisao.duracao}
      ladoTexto="esquerda"
      sobretitulo="REVISÃO SEMANAL"
      titulo="Feche a semana"
      tituloDestaque="com números."
      subtitulo="O que avançou, o que ficou em aberto e o que vem pela frente, sempre comparado à semana anterior."
      inicioTitulo={revisao.titulo}
      inicioCartao={revisao.cartao}
      larguraTexto={600}
    >
      <Cartao estilo={{ display: 'flex', flexDirection: 'column', gap: 28, fontFamily: fontes.texto }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 28, fontWeight: 650, letterSpacing: '-0.02em', color: cores.texto }}>
          <CalendarDays size={28} color={cores.textoSecundario} strokeWidth={2} />
          27 de setembro — 3 de outubro de 2026
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderRadius: 18, border: `1.5px solid ${cores.borda}`, overflow: 'hidden' }}>
          {indicadores.map(({ icone: Icone, rotulo, apoio, cor, fundo, formatar }, indice) => {
            const inicio = revisao.indicadores[indice] ?? 0;
            const entrada = mola(quadro, inicio, 170, 16);
            const t = interpolate(quadro, [inicio + 2, inicio + revisao.duracaoContagem], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
            return (
              <div
                key={rotulo}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  padding: '22px 24px',
                  borderLeft: indice % 2 === 1 ? `1.5px solid ${cores.borda}` : 'none',
                  borderTop: indice > 1 ? `1.5px solid ${cores.borda}` : 'none',
                  opacity: entrada,
                  transform: `translateY(${misturar(24, 0, entrada)}px)`,
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 11, fontSize: 21, color: cores.texto }}>
                  <span style={{ display: 'flex', padding: 6, borderRadius: 8, background: fundo, color: cor }}>
                    <Icone size={20} strokeWidth={2.2} />
                  </span>
                  {rotulo}
                </span>
                <span style={{ fontSize: 52, fontWeight: 650, letterSpacing: '-0.03em', lineHeight: 1, color: cores.texto, fontVariantNumeric: 'tabular-nums' }}>{formatar(t)}</span>
                <span style={{ fontSize: 18, color: cores.textoSecundario }}>{apoio}</span>
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: 23, fontWeight: 600, color: cores.texto }}>Tarefas planejadas para a semana</span>
            <span style={{ fontSize: 19, color: cores.textoSecundario }}>{TOTAL_PLANEJADAS} com data nesta semana</span>
          </div>
          <div style={{ position: 'relative', height: 16, borderRadius: 8, background: cores.neutroSuave, overflow: 'hidden', clipPath: `inset(0 ${100 - barra * 100}% 0 0 round 8px)` }}>
            {situacoes.map(({ rotulo, quantidade, cor }) => {
              const esquerda = (acumulado / TOTAL_PLANEJADAS) * 100;
              acumulado += quantidade;
              return (
                <span
                  key={rotulo}
                  style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: `calc(${esquerda}% + 2px)`,
                    width: `calc(${(quantidade / TOTAL_PLANEJADAS) * 100}% - 4px)`,
                    background: cor,
                    borderRadius: 3,
                  }}
                />
              );
            })}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 24px' }}>
            {situacoes.map(({ rotulo, quantidade, cor }, indice) => {
              const t = progresso(quadro, revisao.barra + indice * 5, 12);
              return (
                <span key={rotulo} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 19, color: cores.textoSecundario, opacity: t }}>
                  <span style={{ width: 12, height: 12, borderRadius: 3, background: cor }} />
                  {rotulo}
                  <strong style={{ color: cores.texto }}>{quantidade}</strong>
                </span>
              );
            })}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 22, borderTop: `1.5px solid ${cores.borda}` }}>
          <span style={{ fontSize: 23, fontWeight: 600, color: cores.texto }}>Destaques da semana</span>
          {destaques.map((texto, indice) => {
            const t = mola(quadro, revisao.destaques[indice] ?? 0, 170, 16);
            return (
              <span key={texto} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 21, color: cores.texto, opacity: t, transform: `translateX(${misturar(-20, 0, t)}px)` }}>
                <span style={{ display: 'flex', padding: 4, borderRadius: '50%', background: cores.sucessoSuave, color: cores.sucesso }}>
                  <CircleCheck size={19} strokeWidth={2.2} />
                </span>
                {texto}
              </span>
            );
          })}
        </div>
      </Cartao>
    </CenaDividida>
  );
}
