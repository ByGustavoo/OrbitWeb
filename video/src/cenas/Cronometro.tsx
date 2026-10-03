import { Pause, Play, Plus, Square, Trash2 } from 'lucide-react';
import { useCurrentFrame } from 'remotion';
import { misturar, mola, progresso } from '../animacao';
import { Cartao } from '../componentes/Cartao';
import { CenaDividida } from '../componentes/CenaDividida';
import { BarraProgresso, Botao, pressao, Selo } from '../componentes/Interface';
import { cenas, cronometro, QUADROS_POR_SEGUNDO } from '../linhaDoTempo';
import { cores, coresCategoria, fontes } from '../tema';
import type { CorCategoria } from '../tema';

const atividades: { nome: string; cor: CorCategoria }[] = [
  { nome: 'Inglês', cor: 'azul' },
  { nome: 'Leitura', cor: 'laranja' },
  { nome: 'Matemática', cor: 'verde' },
  { nome: 'Violão', cor: 'roxo' },
];

function doisDigitos(valor: number): string {
  return String(valor).padStart(2, '0');
}

export function Cronometro() {
  const quadro = useCurrentFrame();
  const pomodoro = progresso(quadro, cronometro.cliquePomodoro, 8);
  const escolhida = quadro >= cronometro.cliqueAtividade;
  const rodando = progresso(quadro, cronometro.cliqueIniciar, 12);
  const decorridos = Math.max(Math.floor((quadro - cronometro.cliqueIniciar) / QUADROS_POR_SEGUNDO), 0);
  const restantes = cronometro.segundoInicial - decorridos;
  const fracaoSegundo = quadro >= cronometro.cliqueIniciar ? ((quadro - cronometro.cliqueIniciar) % QUADROS_POR_SEGUNDO) / QUADROS_POR_SEGUNDO : 0;
  const giroDigito = progresso(fracaoSegundo, 0, 0.25);
  const entradaRodando = mola(quadro, cronometro.cliqueIniciar + 2, 140, 16);

  return (
    <CenaDividida
      duracao={cenas.cronometro.duracao}
      ladoTexto="esquerda"
      sobretitulo="CRONÔMETRO"
      titulo="Estude no ritmo"
      tituloDestaque="do Pomodoro."
      subtitulo="Modo livre ou Pomodoro, por atividade. O tempo continua contando se você mudar de tela, trocar de aba ou recarregar a página."
      inicioTitulo={cronometro.titulo}
      inicioCartao={cronometro.cartao}
      larguraTexto={620}
    >
      <Cartao estilo={{ position: 'relative', height: 640, padding: 0, overflow: 'hidden', fontFamily: fontes.texto }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            padding: 44,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 22,
            opacity: 1 - rodando,
            transform: `scale(${misturar(1, 0.96, rodando)})`,
          }}
        >
          <div style={{ alignSelf: 'stretch', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 23, fontWeight: 600, color: cores.texto }}>O que você vai estudar?</span>
            <div style={{ position: 'relative', display: 'flex', padding: 5, borderRadius: 13, background: cores.superficieSuave, border: `1.5px solid ${cores.borda}` }}>
              <span
                style={{
                  position: 'absolute',
                  top: 5,
                  bottom: 5,
                  left: misturar(5, 87, pomodoro),
                  width: misturar(82, 132, pomodoro),
                  borderRadius: 9,
                  background: cores.segmentoAtivo,
                }}
              />
              {['Livre', 'Pomodoro'].map((rotulo, indice) => (
                <span
                  key={rotulo}
                  style={{
                    position: 'relative',
                    width: indice === 0 ? 82 : 132,
                    padding: '8px 0',
                    textAlign: 'center',
                    fontSize: 20,
                    fontWeight: 600,
                    color: (indice === 1) === pomodoro > 0.5 ? cores.texto : cores.textoSecundario,
                    transform: indice === 1 ? `scale(${pressao(quadro, cronometro.cliquePomodoro)})` : undefined,
                  }}
                >
                  {rotulo}
                </span>
              ))}
            </div>
          </div>
          <div style={{ alignSelf: 'stretch', display: 'flex', gap: 12 }}>
            {atividades.map(({ nome, cor }, indice) => {
              const ativa = escolhida && indice === 0;
              const tom = coresCategoria[cor];
              return (
                <span
                  key={nome}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '11px 20px',
                    borderRadius: 999,
                    border: `1.5px solid ${ativa ? tom.cor : cores.bordaForte}`,
                    background: ativa ? tom.suave : 'transparent',
                    fontSize: 20,
                    fontWeight: 500,
                    color: cores.texto,
                    transform: indice === 0 ? `scale(${pressao(quadro, cronometro.cliqueAtividade)})` : undefined,
                  }}
                >
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: tom.cor }} />
                  {nome}
                </span>
              );
            })}
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 18px', borderRadius: 999, border: `1.5px dashed ${cores.bordaForte}`, fontSize: 20, color: cores.textoSecundario }}>
              <Plus size={20} strokeWidth={2.2} />
              Nova atividade
            </span>
          </div>
          <span style={{ marginTop: 22, fontSize: 20, color: cores.textoSecundario }}>Pronto para estudar</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 30, fontWeight: 600, color: escolhida ? cores.texto : cores.textoSecundario }}>
            {escolhida ? <span style={{ width: 13, height: 13, borderRadius: '50%', background: coresCategoria.azul.cor }} /> : null}
            {escolhida ? 'Inglês' : 'Escolha uma atividade'}
          </span>
          <span style={{ fontFamily: fontes.mono, fontSize: 112, fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1, color: escolhida ? cores.texto : cores.textoTerciario }}>
            {pomodoro > 0.5 ? '25:00' : '00:00:00'}
          </span>
          <Botao
            principal
            escala={pressao(quadro, cronometro.cliqueIniciar)}
            estilo={{ minWidth: 240, marginTop: 10, opacity: escolhida ? 1 : 0.5 }}
          >
            <Play size={24} strokeWidth={2.4} />
            {pomodoro > 0.5 ? 'Iniciar foco' : 'Iniciar'}
          </Botao>
        </div>

        <div
          style={{
            position: 'absolute',
            inset: 0,
            padding: 44,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            opacity: rodando,
            transform: `translateY(${misturar(24, 0, entradaRodando)}px)`,
            borderTop: `4px solid rgba(143, 170, 230, ${rodando})`,
          }}
        >
          <div style={{ alignSelf: 'stretch', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Selo cor={cores.sucesso} fundo={cores.sucessoSuave} tamanho={19}>
                Em andamento
              </Selo>
              <span style={{ display: 'flex', gap: 6 }}>
                {[0, 1, 2, 3].map((indice) => (
                  <span key={indice} style={{ width: 12, height: 12, borderRadius: '50%', border: `2px solid ${cores.textoTerciario}` }} />
                ))}
              </span>
              <span style={{ fontSize: 19, fontWeight: 600, color: cores.texto }}>Ciclo 1 de 4</span>
            </span>
            <span style={{ fontSize: 19, color: cores.textoSecundario }}>Pomodoro</span>
          </div>
          <span style={{ marginTop: 40, fontSize: 21, color: cores.textoSecundario }}>Em foco</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10, fontSize: 32, fontWeight: 650, color: cores.texto }}>
            <span style={{ width: 13, height: 13, borderRadius: '50%', background: coresCategoria.azul.cor }} />
            Inglês
          </span>
          <span style={{ display: 'flex', marginTop: 8, fontSize: 150, fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1.1, color: cores.texto, fontVariantNumeric: 'tabular-nums' }}>
            <span>{doisDigitos(Math.floor(restantes / 60))}</span>
            <span style={{ margin: '0 6px', opacity: 0.85 }}>:</span>
            <span style={{ display: 'inline-block', overflow: 'hidden', height: '1.1em' }}>
              <span style={{ display: 'flex', flexDirection: 'column', transform: `translateY(${decorridos > 0 ? misturar(0, -1.1, 1 - giroDigito) : 0}em)` }}>
                <span>{doisDigitos(restantes % 60)}</span>
                <span>{doisDigitos((restantes + 1) % 60)}</span>
              </span>
            </span>
          </span>
          <div style={{ width: 460, marginTop: 6 }}>
            <BarraProgresso valor={0.004 + (decorridos + fracaoSegundo) / cronometro.segundoInicial} cor={cores.destaque} altura={8} />
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 34 }}>
            <Botao principal estilo={{ minWidth: 210 }}>
              <Pause size={24} strokeWidth={2.4} />
              Pausar
            </Botao>
            <Botao estilo={{ minWidth: 210 }}>
              <Square size={22} strokeWidth={2.4} />
              Finalizar
            </Botao>
          </div>
          <div
            style={{
              alignSelf: 'stretch',
              marginTop: 'auto',
              paddingTop: 22,
              borderTop: `1.5px solid ${cores.borda}`,
              display: 'flex',
              alignItems: 'flex-end',
              gap: 40,
            }}
          >
            <span style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 18, color: cores.textoSecundario }}>Início</span>
              <span style={{ fontSize: 22, fontWeight: 600, color: cores.texto }}>19:00</span>
            </span>
            <span style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 18, color: cores.textoSecundario }}>Tempo de estudo</span>
              <span style={{ fontFamily: fontes.mono, fontSize: 22, fontWeight: 600, color: cores.texto }}>00:00:{doisDigitos(decorridos)}</span>
            </span>
            <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10, fontSize: 19, color: cores.textoSecundario }}>
              <Trash2 size={20} strokeWidth={2} />
              Descartar sessão
            </span>
          </div>
        </div>
      </Cartao>
    </CenaDividida>
  );
}
