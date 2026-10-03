import { CalendarArrowUp, CalendarX2, CircleCheck, Clock3, Repeat } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import { useCurrentFrame } from 'remotion';
import { misturar, mola, progresso } from '../animacao';
import { Cartao } from '../componentes/Cartao';
import { CenaDividida } from '../componentes/CenaDividida';
import { Aviso, BarraProgresso, CirculoTarefa, EtiquetaCategoria, pressao, Selo, SeloPrioridade } from '../componentes/Interface';
import { cenas, tarefas } from '../linhaDoTempo';
import { cores, fontes } from '../tema';
import type { CorCategoria, Prioridade } from '../tema';

interface Tarefa {
  titulo: string;
  inicio: string;
  fim?: string;
  prioridade: Prioridade;
  categoria: { nome: string; cor: CorCategoria };
  atraso?: string;
  recorrente?: boolean;
  andamento?: boolean;
}

const atrasadas: Tarefa[] = [
  { titulo: 'Marcar consulta no dentista', inicio: 'Dia todo', prioridade: 'BAIXA', categoria: { nome: 'Saúde', cor: 'rosa' }, atraso: 'Ter., 29 de set.' },
  { titulo: 'Enviar o relatório do mês', inicio: '17:00', fim: 'até 18:00', prioridade: 'ALTA', categoria: { nome: 'Trabalho', cor: 'azul' }, atraso: 'Qua., 30 de set.' },
];

const deHoje: Tarefa[] = [
  { titulo: 'Pagar a conta de luz', inicio: 'Dia todo', prioridade: 'ALTA', categoria: { nome: 'Finanças', cor: 'amarelo' } },
  { titulo: 'Academia', inicio: '07:00', fim: 'até 08:00', prioridade: 'BAIXA', categoria: { nome: 'Saúde', cor: 'rosa' }, recorrente: true },
  { titulo: 'Estudar inglês: lição 12', inicio: '08:00', fim: 'até 09:30', prioridade: 'ALTA', categoria: { nome: 'Estudos', cor: 'roxo' } },
  { titulo: 'Reunião com a equipe', inicio: '10:30', fim: 'até 11:30', prioridade: 'MEDIA', categoria: { nome: 'Trabalho', cor: 'azul' }, andamento: true },
  { titulo: 'Responder os e-mails dos clientes', inicio: '14:00', fim: 'até 15:00', prioridade: 'BAIXA', categoria: { nome: 'Trabalho', cor: 'azul' } },
];

const ALTURA_LINHA = 92;

function Linha({ tarefa, concluida = 0, estilo }: { tarefa: Tarefa; concluida?: number; estilo?: CSSProperties }) {
  const feita = concluida > 0.5;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 20,
        height: ALTURA_LINHA,
        paddingTop: 16,
        borderTop: `1.5px solid ${cores.borda}`,
        fontFamily: fontes.texto,
        ...estilo,
      }}
    >
      <CirculoTarefa prioridade={tarefa.prioridade} concluida={concluida} />
      <div style={{ width: 104, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontFamily: tarefa.fim ? fontes.mono : fontes.texto, fontSize: tarefa.fim ? 21 : 19, fontWeight: tarefa.fim ? 600 : 400, color: tarefa.fim ? cores.texto : cores.textoSecundario }}>
          {tarefa.inicio}
        </span>
        {tarefa.fim ? <span style={{ fontSize: 17, color: cores.textoTerciario }}>{tarefa.fim}</span> : null}
      </div>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 9 }}>
        <span
          style={{
            fontSize: 24,
            fontWeight: 550,
            color: feita ? cores.textoTerciario : cores.texto,
            textDecoration: feita ? 'line-through' : 'none',
            whiteSpace: 'nowrap',
          }}
        >
          {tarefa.titulo}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {tarefa.atraso ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 18, fontWeight: 500, color: cores.erro }}>
              <CalendarX2 size={18} strokeWidth={2.2} />
              {tarefa.atraso}
            </span>
          ) : null}
          {tarefa.andamento ? (
            <Selo cor={cores.info} fundo={cores.infoSuave} tamanho={17}>
              <Clock3 size={16} strokeWidth={2.4} />
              Em andamento
            </Selo>
          ) : null}
          <EtiquetaCategoria nome={tarefa.categoria.nome} cor={tarefa.categoria.cor} tamanho={17} />
          {tarefa.recorrente ? <Repeat size={18} color={cores.textoTerciario} strokeWidth={2.2} /> : null}
        </span>
      </div>
      <SeloPrioridade prioridade={tarefa.prioridade} tamanho={18} />
    </div>
  );
}

function CabecalhoSecao({ icone, titulo, quantidade, acao }: { icone?: ReactNode; titulo: string; quantidade: number; acao?: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 58, fontFamily: fontes.texto }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 21, fontWeight: 600, color: cores.texto }}>
        {icone}
        {titulo}
        <span style={{ padding: '1px 10px', borderRadius: 999, background: cores.neutroSuave, fontSize: 17, color: cores.textoSecundario }}>{quantidade}</span>
      </span>
      {acao}
    </div>
  );
}

export function Tarefas() {
  const quadro = useCurrentFrame();
  const recolher = progresso(quadro, tarefas.movimento, 16);
  const inserir = progresso(quadro, tarefas.movimento + 8, 16);
  const movidas = quadro >= tarefas.movimento + 8;
  const concluir = progresso(quadro, tarefas.cliqueConcluir, 10);
  const aviso = mola(quadro, tarefas.aviso, 160, 18);
  const total = movidas ? 9 : 7;
  const feitas = quadro >= tarefas.cliqueConcluir + 4 ? 2 : 1;
  const brilhoInserida = movidas ? 1 - progresso(quadro, tarefas.movimento + 20, 40) : 0;
  const entradaLinha = (indice: number) => progresso(quadro, tarefas.linhas + indice * tarefas.intervaloLinhas, 14);

  return (
    <CenaDividida
      duracao={cenas.tarefas.duracao}
      ladoTexto="esquerda"
      sobretitulo="TAREFAS DE HOJE"
      titulo="O dia inteiro"
      tituloDestaque="em uma lista."
      subtitulo="Horário, prioridade e categoria de cada tarefa. O que atrasou volta para hoje com um clique."
      inicioTitulo={tarefas.titulo}
      inicioCartao={tarefas.cartao}
      larguraTexto={600}
      complemento={
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginTop: 24,
            opacity: aviso,
            transform: `translateY(${misturar(30, 0, aviso)}px) scale(${misturar(0.94, 1, aviso)})`,
          }}
        >
          <Aviso
            titulo="2 tarefas movidas para hoje."
            descricao="Só a data mudou. Horário, prioridade e situação continuam iguais."
            icone={<CircleCheck size={26} color={cores.sucesso} strokeWidth={2.2} />}
            acao="Desfazer"
          />
        </div>
      }
    >
      <Cartao estilo={{ padding: '36px 40px 0', height: 740, overflow: 'hidden', display: 'flex', flexDirection: 'column', maskImage: 'linear-gradient(black 86%, transparent 99%)', WebkitMaskImage: 'linear-gradient(black 86%, transparent 99%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, fontFamily: fontes.texto }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 30, fontWeight: 650, letterSpacing: '-0.02em', color: cores.texto }}>Tarefas de hoje</span>
            <span style={{ fontSize: 20, color: cores.textoSecundario }}>Sexta-feira, 2 de outubro</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12, width: 150 }}>
            <span style={{ fontSize: 21, color: cores.textoSecundario }}>
              <strong style={{ color: cores.texto, fontWeight: 650 }}>{feitas}</strong> de {total}
            </span>
            <div style={{ width: '100%' }}>
              <BarraProgresso valor={feitas / total} cor={cores.destaque} altura={8} />
            </div>
          </div>
        </div>

        <div style={{ height: misturar(58 + ALTURA_LINHA * 2, 0, recolher), opacity: 1 - recolher, overflow: 'hidden', flexShrink: 0 }}>
          <CabecalhoSecao
            icone={<CalendarX2 size={22} color={cores.erro} strokeWidth={2.2} />}
            titulo="Atrasadas de dias anteriores"
            quantidade={2}
            acao={
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '9px 16px',
                  borderRadius: 11,
                  border: `1.5px solid ${quadro >= tarefas.cliqueMover ? cores.destaque : cores.bordaForte}`,
                  background: quadro >= tarefas.cliqueMover ? cores.destaqueSuave : 'transparent',
                  fontSize: 19,
                  fontWeight: 600,
                  color: cores.texto,
                  transform: `scale(${pressao(quadro, tarefas.cliqueMover)})`,
                }}
              >
                <CalendarArrowUp size={20} strokeWidth={2.2} />
                Mover todas para hoje
              </span>
            }
          />
          {atrasadas.map((tarefa, indice) => (
            <Linha key={tarefa.titulo} tarefa={tarefa} estilo={{ opacity: entradaLinha(indice), transform: `translateY(${misturar(16, 0, entradaLinha(indice))}px)` }} />
          ))}
        </div>

        <CabecalhoSecao titulo="Hoje" quantidade={total} />
        <div style={{ height: misturar(0, ALTURA_LINHA, inserir), overflow: 'hidden', flexShrink: 0 }}>
          <Linha
            tarefa={{ ...(atrasadas[0] as Tarefa), atraso: undefined }}
            estilo={{ background: `rgba(143, 170, 230, ${0.12 * brilhoInserida})`, margin: '0 -16px', padding: '16px 16px 0' }}
          />
        </div>
        {deHoje.map((tarefa, indice) => (
          <Linha
            key={tarefa.titulo}
            tarefa={tarefa}
            concluida={indice === 0 ? concluir : indice === 2 ? 1 : 0}
            estilo={{ opacity: entradaLinha(indice + 2), transform: `translateY(${misturar(16, 0, entradaLinha(indice + 2))}px)` }}
          />
        ))}
      </Cartao>
    </CenaDividida>
  );
}
