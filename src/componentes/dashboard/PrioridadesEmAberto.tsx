import type { CSSProperties } from 'react';
import { Inbox } from 'lucide-react';
import { iconePrioridade } from '@/componentes/tarefas/iconesTarefa';
import { CabecalhoPainel, ConteudoAssincrono, Esqueleto, EstadoVazio, Painel } from '@/componentes/ui';
import type { ResultadoAssincrono } from '@/ganchos/useDadosAssincronos';
import { coresDaPrioridade } from '@/modelos/cores';
import type { Prioridade } from '@/modelos/enumeracoes';
import type { ResumoDashboardDTO } from '@/modelos/painel';
import { rotuloPrioridade } from '@/modelos/rotulos';
import { formatarNumero, pluralizar } from '@/utilitarios/formatacao';
import estilos from './PrioridadesEmAberto.module.css';

const ORDEM: Prioridade[] = ['URGENTE', 'ALTA', 'MEDIA', 'BAIXA'];

export interface PrioridadesEmAbertoProps {
  resultado: ResultadoAssincrono<ResumoDashboardDTO>;
  className?: string;
}

function EsqueletoPrioridades() {
  return (
    <div className={estilos.esqueleto} role="status" aria-label="Carregando as prioridades…">
      <Esqueleto largura={64} altura={34} raio="var(--raio-sm)" />
      {ORDEM.map((prioridade) => (
        <Esqueleto key={prioridade} altura={28} raio="var(--raio-sm)" />
      ))}
    </div>
  );
}

export function PrioridadesEmAberto({ resultado, className }: PrioridadesEmAbertoProps) {
  return (
    <Painel className={className} aria-labelledby="titulo-prioridades">
      <CabecalhoPainel
        titulo={<span id="titulo-prioridades">Em aberto por prioridade</span>}
        descricao="Pendentes e em andamento, com qualquer data"
      />

      <ConteudoAssincrono resultado={resultado} tituloErro="Não foi possível carregar as prioridades" esqueleto={<EsqueletoPrioridades />}>
        {({ distribuicaoPrioridade }) => {
          const quantidades = new Map(distribuicaoPrioridade.map((item) => [item.prioridade, item.quantidade]));
          const total = distribuicaoPrioridade.reduce((soma, item) => soma + item.quantidade, 0);
          const maior = Math.max(1, ...distribuicaoPrioridade.map((item) => item.quantidade));

          if (total === 0) {
            return (
              <EstadoVazio
                compacto
                icone={Inbox}
                titulo="Nenhuma tarefa em aberto."
                descricao="Tarefas pendentes e em andamento aparecem aqui, separadas por prioridade."
              />
            );
          }

          return (
            <div className={estilos.conteudo}>
              <p className={estilos.total}>
                <strong>{formatarNumero(total)}</strong>
                <span>{total === 1 ? 'tarefa em aberto' : 'tarefas em aberto'}</span>
              </p>
              <ul className={estilos.lista}>
                {ORDEM.map((prioridade, indice) => {
                  const quantidade = quantidades.get(prioridade) ?? 0;
                  const Icone = iconePrioridade[prioridade];
                  const estilo = {
                    '--cor-prioridade': coresDaPrioridade(prioridade).texto,
                    '--proporcao': quantidade / maior,
                    '--indice': indice,
                  } as CSSProperties;
                  return (
                    <li key={prioridade} className={estilos.linha} style={estilo}>
                      <span className={estilos.nome}>
                        <Icone size={14} strokeWidth={2.25} aria-hidden="true" className={estilos.icone} />
                        {rotuloPrioridade[prioridade]}
                      </span>
                      <span className={estilos.trilho} aria-hidden="true">
                        <span className={estilos.barra} />
                      </span>
                      <span className={estilos.quantidade}>
                        <span aria-hidden="true">{formatarNumero(quantidade)}</span>
                        <span className="visualmente-oculto">{pluralizar(quantidade, 'tarefa', 'tarefas')}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        }}
      </ConteudoAssincrono>
    </Painel>
  );
}
