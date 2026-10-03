import { CircleCheck } from 'lucide-react';
import { useCurrentFrame } from 'remotion';
import { misturar, progresso as progressoAnimacao } from '../animacao';
import { Cartao } from '../componentes/Cartao';
import { CenaDividida } from '../componentes/CenaDividida';
import { BarraProgresso, formatarDuracao } from '../componentes/Interface';
import { cenas, progresso } from '../linhaDoTempo';
import { cores, coresCategoria, fontes } from '../tema';
import type { CorCategoria } from '../tema';

const metas: { nome: string; cor: CorCategoria; minutos: number; meta: number }[] = [
  { nome: 'Inglês', cor: 'azul', minutos: 170, meta: 300 },
  { nome: 'Leitura', cor: 'laranja', minutos: 330, meta: 240 },
  { nome: 'Matemática', cor: 'verde', minutos: 130, meta: 120 },
];

const meses = [
  { nome: 'Maio', deslocamento: 5, niveis: '0004442201014442020001300400000' },
  { nome: 'Junho', deslocamento: 1, niveis: '140030303302010124301133410011' },
  { nome: 'Julho', deslocamento: 3, niveis: '0000043332020024100102110220413' },
  { nome: 'Agosto', deslocamento: 6, niveis: '0042211031101002004303313133001' },
  { nome: 'Setembro', deslocamento: 2, niveis: '203321011320022030103404342344' },
  { nome: 'Outubro', deslocamento: 4, niveis: '10fffffffffffffffffffffffffffff' },
];

const INICIAIS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const CELULA = 16;
const VAO = 3;

const estatisticas = [
  { rotulo: 'Média diária', valor: '1h 9min' },
  { rotulo: 'Maior dia', valor: '3h 40min' },
  { rotulo: 'Mais estudada', valor: 'Leitura', cor: coresCategoria.laranja.cor },
  { rotulo: 'Dias sem estudo', valor: '59 de 155' },
];

export function Progresso() {
  const quadro = useCurrentFrame();
  let semanaGlobal = 0;

  return (
    <CenaDividida
      duracao={cenas.progresso.duracao}
      ladoTexto="direita"
      sobretitulo="METAS DE ESTUDO"
      titulo="Cada minuto"
      tituloDestaque="vira progresso."
      subtitulo="Meta semanal por atividade e um mapa de calor com cada dia de estudo dos últimos seis meses."
      inicioTitulo={progresso.titulo}
      inicioCartao={progresso.cartao}
      larguraTexto={600}
    >
      <Cartao estilo={{ display: 'flex', flexDirection: 'column', gap: 30, fontFamily: fontes.texto }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 28, fontWeight: 650, letterSpacing: '-0.02em', color: cores.texto }}>Metas da semana</span>
          <span style={{ fontSize: 20, color: cores.textoSecundario }}>Horas de estudo por atividade, de domingo a sábado</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          {metas.map(({ nome, cor, minutos, meta }, indice) => {
            const t = progressoAnimacao(quadro, progresso.metas[indice] ?? 0, progresso.duracaoMeta);
            const atual = minutos * t;
            const batida = atual >= meta;
            const tom = coresCategoria[cor].cor;
            return (
              <div key={nome} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 22, fontWeight: 600, color: cores.texto }}>
                    <span style={{ width: 11, height: 11, borderRadius: '50%', background: tom }} />
                    {nome}
                  </span>
                  <span style={{ fontSize: 20, color: cores.textoSecundario }}>
                    <strong style={{ display: 'inline-block', minWidth: 110, textAlign: 'right', color: cores.texto, fontWeight: 650 }}>{formatarDuracao(atual)}</strong> de{' '}
                    {formatarDuracao(meta)}
                  </span>
                </div>
                <BarraProgresso valor={atual / meta} cor={batida ? cores.sucesso : tom} altura={10} />
                <span style={{ height: 22, fontSize: 18 }}>
                  {batida ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 7, color: cores.sucesso, fontWeight: 600 }}>
                      <CircleCheck size={19} strokeWidth={2.4} />
                      Meta batida
                    </span>
                  ) : t >= 1 ? (
                    <span style={{ color: cores.textoSecundario }}>Faltam {formatarDuracao(meta - minutos)}</span>
                  ) : null}
                </span>
              </div>
            );
          })}
        </div>

        <div style={{ height: 1.5, background: cores.borda }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: 28, fontWeight: 650, letterSpacing: '-0.02em', color: cores.texto }}>Estudo por dia</span>
            <span style={{ fontSize: 19, color: cores.textoSecundario }}>Minutos de estudo nos últimos 6 meses</span>
          </div>
          <div style={{ display: 'flex', gap: 14 }}>
            {meses.map((mes) => {
              const celulas = [...Array.from({ length: mes.deslocamento }, () => ' '), ...mes.niveis.split('')];
              const semanas = Math.ceil(celulas.length / 7);
              const inicioSemanas = semanaGlobal;
              semanaGlobal += semanas - (mes.deslocamento > 0 ? 1 : 0);
              return (
                <div key={mes.nome} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 17, fontWeight: 500, color: cores.textoSecundario }}>{mes.nome}</span>
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(7, ${CELULA}px)`, gap: VAO }}>
                    {INICIAIS.map((inicial, indice) => (
                      <span key={indice} style={{ fontSize: 12, textAlign: 'center', color: cores.textoTerciario }}>
                        {inicial}
                      </span>
                    ))}
                    {celulas.map((nivel, indice) => {
                      if (nivel === ' ') return <span key={indice} />;
                      const semana = inicioSemanas + Math.floor(indice / 7);
                      const t = progressoAnimacao(quadro, progresso.mapa + semana * progresso.intervaloSemanas + (indice % 7) * 0.4, 10);
                      const futuro = nivel === 'f';
                      const valor = futuro ? 0 : Number(nivel);
                      const cor = cores.calor[valor] ?? cores.calor[0];
                      const ehHoje = mes.nome === 'Outubro' && indice === mes.deslocamento + 1;
                      return (
                        <span
                          key={indice}
                          style={{
                            width: CELULA,
                            height: CELULA,
                            borderRadius: 4,
                            background: futuro ? 'transparent' : cor,
                            border: futuro ? `1.5px solid ${cores.borda}` : ehHoje ? `2px solid ${cores.texto}` : 'none',
                            boxSizing: 'border-box',
                            opacity: futuro ? 0.6 * t : t,
                            transform: `scale(${misturar(0.3, 1, t)})`,
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', borderRadius: 16, border: `1.5px solid ${cores.borda}`, overflow: 'hidden' }}>
            {estatisticas.map(({ rotulo, valor, cor }, indice) => {
              const t = progressoAnimacao(quadro, progresso.estatisticas[indice] ?? 0, 14);
              return (
                <div
                  key={rotulo}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    padding: '14px 18px',
                    borderLeft: indice === 0 ? 'none' : `1.5px solid ${cores.borda}`,
                    opacity: t,
                    transform: `translateY(${misturar(12, 0, t)}px)`,
                  }}
                >
                  <span style={{ fontSize: 17, color: cores.textoSecundario }}>{rotulo}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 22, fontWeight: 650, color: cores.texto }}>
                    {cor ? <span style={{ width: 10, height: 10, borderRadius: '50%', background: cor }} /> : null}
                    {valor}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </Cartao>
    </CenaDividida>
  );
}
