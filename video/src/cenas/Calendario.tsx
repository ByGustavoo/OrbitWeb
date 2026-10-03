import { ArrowUp, ChevronDown, ChevronLeft, ChevronRight, Clock, Plus, TriangleAlert } from 'lucide-react';
import { useCurrentFrame } from 'remotion';
import { misturar, mola, progresso } from '../animacao';
import { CenaDividida } from '../componentes/CenaDividida';
import { CirculoTarefa, EtiquetaCategoria, pressao, Selo, SeloPrioridade } from '../componentes/Interface';
import { calendario, cenas } from '../linhaDoTempo';
import { cores, fontes, prioridades } from '../tema';

type Marcador = 'F' | 'A' | 'C' | 'N';
type Sinal = 'atraso' | 'urgente' | 'alta';

interface Dia {
  numero: number;
  foraDoMes?: boolean;
  marcadores: string;
  extra?: number;
  sinal?: Sinal;
}

const semanas: Dia[][] = [
  [
    { numero: 27, foraDoMes: true, marcadores: 'C' },
    { numero: 28, foraDoMes: true, marcadores: 'NCC' },
    { numero: 29, foraDoMes: true, marcadores: 'ACCC', sinal: 'atraso' },
    { numero: 30, foraDoMes: true, marcadores: 'ACCC', extra: 3, sinal: 'atraso' },
    { numero: 1, marcadores: 'NCC' },
    { numero: 2, marcadores: 'AAAA', extra: 3, sinal: 'atraso' },
    { numero: 3, marcadores: 'FFF', sinal: 'urgente' },
  ],
  [
    { numero: 4, marcadores: 'F' },
    { numero: 5, marcadores: 'FFF' },
    { numero: 6, marcadores: 'F' },
    { numero: 7, marcadores: 'FFF', sinal: 'alta' },
    { numero: 8, marcadores: 'F' },
    { numero: 9, marcadores: 'F' },
    { numero: 10, marcadores: '' },
  ],
  [11, 12, 13, 14, 15, 16, 17].map((numero) => ({ numero, marcadores: [11, 12, 14, 16].includes(numero) ? 'F' : '' })),
  [18, 19, 20, 21, 22, 23, 24].map((numero) => ({ numero, marcadores: [19, 21, 23].includes(numero) ? 'F' : '' })),
  [25, 26, 27, 28, 29, 30, 31].map((numero) => ({ numero, marcadores: [26, 28, 30].includes(numero) ? 'F' : '' })),
  [1, 2, 3, 4, 5, 6, 7].map((numero) => ({ numero, foraDoMes: true, marcadores: [2, 4, 6].includes(numero) ? 'F' : '' })),
];

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const ALTURA_CELULA = 94;

const legenda: { tipo: Marcador; rotulo: string }[] = [
  { tipo: 'F', rotulo: 'A fazer' },
  { tipo: 'A', rotulo: 'Atrasada' },
  { tipo: 'C', rotulo: 'Concluída' },
  { tipo: 'N', rotulo: 'Não realizada' },
];

function Ponto({ tipo }: { tipo: Marcador }) {
  const cor = { F: cores.cargaAFazer, A: cores.erro, C: cores.cargaConcluida, N: cores.naoRealizada }[tipo];
  return (
    <span
      style={{
        width: 11,
        height: 11,
        borderRadius: '50%',
        background: tipo === 'C' ? 'transparent' : cor,
        border: tipo === 'C' ? `2px solid ${cor}` : 'none',
        boxSizing: 'border-box',
      }}
    />
  );
}

function IconeSinal({ sinal }: { sinal: Sinal }) {
  if (sinal === 'atraso') return <Clock size={19} color={cores.erro} strokeWidth={2.2} />;
  if (sinal === 'urgente') return <TriangleAlert size={19} color={cores.erro} strokeWidth={2.2} />;
  return <ArrowUp size={19} color={prioridades.ALTA.cor} strokeWidth={2.4} />;
}

const agenda = [
  { titulo: 'Pagar a conta de luz', horario: 'Dia todo', prioridade: 'ALTA' as const, situacao: { rotulo: 'Pendente', cor: cores.textoSecundario, fundo: cores.neutroSuave }, categoria: { nome: 'Finanças', cor: 'amarelo' as const } },
  { titulo: 'Academia', horario: '07:00 até 08:00', prioridade: 'BAIXA' as const, situacao: { rotulo: 'Atrasada', cor: cores.erro, fundo: cores.erroSuave }, categoria: { nome: 'Saúde', cor: 'rosa' as const } },
  { titulo: 'Estudar inglês: lição 12', horario: '08:00 até 09:30', prioridade: 'ALTA' as const, situacao: { rotulo: 'Concluída', cor: cores.sucesso, fundo: cores.sucessoSuave }, categoria: { nome: 'Estudos', cor: 'roxo' as const }, concluida: true },
];

export function Calendario() {
  const quadro = useCurrentFrame();
  const entradaCelula = (linha: number, coluna: number) => mola(quadro, calendario.marcadores + (linha + coluna) * 2 * calendario.intervaloMarcadores, 200, 14);
  const selecionado = progresso(quadro, calendario.cliqueDia, 8);
  const entradaAgenda = mola(quadro, calendario.agenda, 120, 16);

  return (
    <CenaDividida
      duracao={cenas.calendario.duracao}
      ladoTexto="direita"
      sobretitulo="CALENDÁRIO"
      titulo="O mês e a carga"
      tituloDestaque="de cada dia."
      subtitulo="Marcadores mostram o que está a fazer, atrasado, concluído ou não realizado. Um clique abre a agenda do dia."
      inicioTitulo={calendario.titulo}
      inicioCartao={calendario.cartao}
      larguraTexto={560}
    >
      <div style={{ position: 'relative' }}>
        <div
          style={{
            borderRadius: 28,
            background: cores.superficie,
            border: `1.5px solid ${cores.borda}`,
            boxShadow: '0 40px 80px -30px rgba(0, 0, 0, 0.75)',
            overflow: 'hidden',
            fontFamily: fontes.texto,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '26px 30px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 32, fontWeight: 650, letterSpacing: '-0.02em', color: cores.texto }}>
              Outubro de 2026
              <ChevronDown size={24} color={cores.textoSecundario} />
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 18, color: cores.textoSecundario }}>
              <span style={{ padding: '8px 16px', borderRadius: 10, border: `1.5px solid ${cores.bordaForte}`, fontSize: 19, fontWeight: 600, color: cores.texto }}>Hoje</span>
              <ChevronLeft size={26} />
              <ChevronRight size={26} />
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderTop: `1.5px solid ${cores.borda}` }}>
            {DIAS_SEMANA.map((dia) => (
              <span key={dia} style={{ padding: '10px 14px', fontSize: 18, color: cores.textoSecundario, borderBottom: `1.5px solid ${cores.borda}` }}>
                {dia}
              </span>
            ))}
            {semanas.flatMap((semana, linha) =>
              semana.map((dia, coluna) => {
                const entrada = entradaCelula(linha, coluna);
                const ehHoje = linha === 0 && coluna === 5;
                const pontos = dia.marcadores.split('') as Marcador[];
                return (
                  <div
                    key={`${linha}-${coluna}`}
                    style={{
                      position: 'relative',
                      height: ALTURA_CELULA,
                      padding: '10px 12px',
                      borderLeft: coluna === 0 ? 'none' : `1.5px solid ${cores.borda}`,
                      borderTop: linha === 0 ? 'none' : `1.5px solid ${cores.borda}`,
                      background: ehHoje ? `rgba(24, 35, 59, ${0.4 + 0.6 * selecionado})` : linha < 1 ? cores.superficieSuave : 'transparent',
                      boxShadow: ehHoje ? `inset 0 0 0 ${2 + selecionado}px rgba(143, 170, 230, ${0.5 + 0.5 * selecionado})` : undefined,
                      transform: ehHoje ? `scale(${pressao(quadro, calendario.cliqueDia)})` : undefined,
                    }}
                  >
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 34,
                        height: 34,
                        borderRadius: '50%',
                        background: ehHoje ? cores.destaque : 'transparent',
                        fontSize: 19,
                        fontWeight: ehHoje ? 650 : 500,
                        color: ehHoje ? cores.destaqueContraste : dia.foraDoMes && linha > 0 ? cores.textoTerciario : cores.texto,
                        marginLeft: ehHoje ? -4 : 0,
                      }}
                    >
                      {dia.numero}
                    </span>
                    {dia.sinal ? (
                      <span style={{ position: 'absolute', top: 14, right: 12, opacity: entrada, transform: `scale(${entrada})` }}>
                        <IconeSinal sinal={dia.sinal} />
                      </span>
                    ) : null}
                    <span
                      style={{
                        position: 'absolute',
                        left: 14,
                        bottom: 12,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        opacity: entrada,
                        transform: `translateY(${misturar(8, 0, entrada)}px)`,
                      }}
                    >
                      {pontos.map((tipo, indice) => (
                        <Ponto key={indice} tipo={tipo} />
                      ))}
                      {dia.extra ? <span style={{ fontSize: 15, fontWeight: 600, color: cores.textoSecundario }}>+{dia.extra}</span> : null}
                    </span>
                  </div>
                );
              }),
            )}
          </div>
          <div style={{ display: 'flex', gap: 28, padding: '16px 24px', borderTop: `1.5px solid ${cores.borda}` }}>
            {legenda.map(({ tipo, rotulo }) => (
              <span key={tipo} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 18, color: cores.textoSecundario }}>
                <Ponto tipo={tipo} />
                {rotulo}
              </span>
            ))}
          </div>
        </div>

        <div
          style={{
            position: 'absolute',
            right: -90,
            top: 190,
            width: 540,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            padding: '26px 28px 14px',
            borderRadius: 24,
            background: cores.superficieElevada,
            border: `1.5px solid ${cores.bordaForte}`,
            boxShadow: '0 40px 80px -24px rgba(0, 0, 0, 0.9)',
            fontFamily: fontes.texto,
            opacity: entradaAgenda,
            transform: `translate(${misturar(-120, 0, entradaAgenda)}px, ${misturar(-40, 0, entradaAgenda)}px) scale(${misturar(0.7, 1, entradaAgenda)})`,
            transformOrigin: 'left top',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 25, fontWeight: 650, letterSpacing: '-0.02em', color: cores.texto }}>Sexta-feira, 2 de outubro</span>
              <span style={{ fontSize: 18, color: cores.textoSecundario }}>
                <span style={{ color: cores.destaque, fontWeight: 600 }}>Hoje</span> · 7 tarefas · 1 concluída
              </span>
            </div>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 10, border: `1.5px solid ${cores.bordaForte}`, fontSize: 17, fontWeight: 600, color: cores.texto }}>
              <Plus size={18} strokeWidth={2.4} />
              Nova tarefa
            </span>
          </div>
          {agenda.map((item, indice) => {
            const entrada = progresso(quadro, calendario.linhasAgenda[indice] ?? 0, 12);
            return (
              <div
                key={item.titulo}
                style={{
                  display: 'flex',
                  gap: 16,
                  padding: '14px 0',
                  borderTop: `1.5px solid ${cores.borda}`,
                  opacity: entrada,
                  transform: `translateY(${misturar(14, 0, entrada)}px)`,
                }}
              >
                <CirculoTarefa prioridade={item.prioridade} concluida={item.concluida ? 1 : 0} tamanho={28} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 21, fontWeight: 600, color: item.concluida ? cores.textoTerciario : cores.texto, textDecoration: item.concluida ? 'line-through' : 'none' }}>
                      {item.titulo}
                    </span>
                    <SeloPrioridade prioridade={item.prioridade} tamanho={16} />
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 17, color: cores.textoSecundario, whiteSpace: 'nowrap' }}>{item.horario}</span>
                    <Selo cor={item.situacao.cor} fundo={item.situacao.fundo} tamanho={16}>
                      {item.situacao.rotulo}
                    </Selo>
                    <EtiquetaCategoria nome={item.categoria.nome} cor={item.categoria.cor} tamanho={16} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </CenaDividida>
  );
}
