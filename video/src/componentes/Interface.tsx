import type { CSSProperties, ReactNode } from 'react';
import { ArrowDown, ArrowUp, Check, Minus, TriangleAlert } from 'lucide-react';
import { cores, coresCategoria, fontes, prioridades } from '../tema';
import type { CorCategoria, Prioridade } from '../tema';

interface BotaoProps {
  children: ReactNode;
  principal?: boolean;
  escala?: number;
  estilo?: CSSProperties;
}

export function Botao({ children, principal = false, escala = 1, estilo }: BotaoProps) {
  return (
    <span
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        padding: '16px 28px',
        borderRadius: 14,
        fontFamily: fontes.texto,
        fontSize: 24,
        fontWeight: 600,
        whiteSpace: 'nowrap',
        background: principal ? cores.destaque : 'transparent',
        color: principal ? cores.destaqueContraste : cores.texto,
        border: principal ? '1.5px solid transparent' : `1.5px solid ${cores.bordaForte}`,
        boxShadow: principal ? '0 12px 30px -12px rgba(143, 170, 230, 0.55)' : undefined,
        transform: `scale(${escala})`,
        ...estilo,
      }}
    >
      {children}
    </span>
  );
}

interface SeloProps {
  children: ReactNode;
  cor: string;
  fundo: string;
  tamanho?: number;
  estilo?: CSSProperties;
}

export function Selo({ children, cor, fundo, tamanho = 19, estilo }: SeloProps) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        padding: '4px 11px',
        borderRadius: 8,
        background: fundo,
        color: cor,
        fontFamily: fontes.texto,
        fontSize: tamanho,
        fontWeight: 600,
        whiteSpace: 'nowrap',
        ...estilo,
      }}
    >
      {children}
    </span>
  );
}

const iconesPrioridade = { BAIXA: ArrowDown, MEDIA: Minus, ALTA: ArrowUp, URGENTE: TriangleAlert } as const;

export function SeloPrioridade({ prioridade, tamanho = 19 }: { prioridade: Prioridade; tamanho?: number }) {
  const { rotulo, cor, suave } = prioridades[prioridade];
  const Icone = iconesPrioridade[prioridade];
  return (
    <Selo cor={cor} fundo={suave} tamanho={tamanho}>
      <Icone size={tamanho - 2} strokeWidth={2.4} />
      {rotulo}
    </Selo>
  );
}

export function EtiquetaCategoria({ nome, cor, tamanho = 19 }: { nome: string; cor: CorCategoria; tamanho?: number }) {
  const tom = coresCategoria[cor];
  return (
    <Selo cor={tom.cor} fundo={tom.suave} tamanho={tamanho}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: tom.cor }} />
      {nome}
    </Selo>
  );
}

export function CirculoTarefa({ prioridade, concluida = 0, tamanho = 30 }: { prioridade: Prioridade; concluida?: number; tamanho?: number }) {
  const cor = prioridades[prioridade].cor;
  return (
    <span
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        width: tamanho,
        height: tamanho,
        borderRadius: '50%',
        border: `2px solid ${concluida > 0 ? cores.destaque : cor}`,
        background: `rgba(143, 170, 230, ${concluida})`,
        transform: `scale(${1 + 0.18 * Math.sin(Math.PI * Math.min(concluida, 1))})`,
      }}
    >
      {concluida > 0 ? (
        <Check
          size={tamanho - 10}
          strokeWidth={3.2}
          color={cores.destaqueContraste}
          style={{ clipPath: `inset(0 ${100 - concluida * 100}% 0 0)` }}
        />
      ) : null}
    </span>
  );
}

export function BarraProgresso({ valor, cor, altura = 10, fundo = cores.neutroSuave }: { valor: number; cor: string; altura?: number; fundo?: string }) {
  return (
    <div style={{ height: altura, borderRadius: altura / 2, background: fundo, overflow: 'hidden' }}>
      <div style={{ width: `${Math.min(Math.max(valor, 0), 1) * 100}%`, height: '100%', borderRadius: altura / 2, background: cor }} />
    </div>
  );
}

export function Aviso({ titulo, descricao, icone, acao }: { titulo: string; descricao: string; icone: ReactNode; acao?: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 16,
        width: 620,
        padding: '20px 24px',
        borderRadius: 16,
        background: cores.superficieElevada,
        border: `1.5px solid ${cores.bordaForte}`,
        borderLeft: `4px solid ${cores.sucesso}`,
        boxShadow: '0 28px 60px -24px rgba(0, 0, 0, 0.85)',
        fontFamily: fontes.texto,
      }}
    >
      <span style={{ display: 'flex', marginTop: 2 }}>{icone}</span>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 23, fontWeight: 600, color: cores.texto }}>{titulo}</span>
        <span style={{ fontSize: 20, lineHeight: 1.35, color: cores.textoSecundario }}>{descricao}</span>
      </div>
      {acao ? (
        <span style={{ alignSelf: 'center', padding: '8px 16px', borderRadius: 10, border: `1.5px solid ${cores.bordaForte}`, fontSize: 20, fontWeight: 600, color: cores.texto }}>
          {acao}
        </span>
      ) : null}
    </div>
  );
}

export function pressao(quadro: number, clique: number): number {
  if (quadro < clique || quadro > clique + 6) return 1;
  return 1 - 0.06 * Math.sin((Math.PI * (quadro - clique)) / 6);
}

export function formatarDuracao(minutos: number): string {
  const horas = Math.floor(minutos / 60);
  const resto = Math.round(minutos % 60);
  if (horas === 0) return `${resto}min`;
  if (resto === 0) return `${horas}h`;
  return `${horas}h ${resto}min`;
}
