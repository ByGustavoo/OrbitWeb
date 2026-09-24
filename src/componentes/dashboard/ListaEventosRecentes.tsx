import type { CSSProperties } from 'react';
import { CircleCheck, CircleSlash, History, Plus, Timer } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { CabecalhoPainel, ConteudoAssincrono, EsqueletoLista, EstadoVazio, Painel } from '@/componentes/ui';
import type { ResultadoAssincrono } from '@/ganchos/useDadosAssincronos';
import type { TipoEventoRecente } from '@/modelos/enumeracoes';
import type { ResumoDashboardDTO } from '@/modelos/painel';
import { formatarTempoRelativo } from '@/utilitarios/formatacao';
import estilos from './ListaEventosRecentes.module.css';

const aparencia: Record<TipoEventoRecente, { icone: LucideIcon; verbo: string; tom: string }> = {
  TAREFA_CONCLUIDA: { icone: CircleCheck, verbo: 'Você concluiu', tom: 'sucesso' },
  TAREFA_CRIADA: { icone: Plus, verbo: 'Você criou', tom: 'destaque' },
  TAREFA_CANCELADA: { icone: CircleSlash, verbo: 'Você cancelou', tom: 'neutro' },
  SESSAO_SALVA: { icone: Timer, verbo: 'Você estudou', tom: 'info' },
};

export interface ListaEventosRecentesProps {
  resultado: ResultadoAssincrono<ResumoDashboardDTO>;
  agora: Date;
  className?: string;
}

export function ListaEventosRecentes({ resultado, agora, className }: ListaEventosRecentesProps) {
  return (
    <Painel className={className} aria-labelledby="titulo-recentes">
      <CabecalhoPainel titulo={<span id="titulo-recentes">Atividade recente</span>} descricao="O que mudou nos últimos dias" />

      <ConteudoAssincrono
        resultado={resultado}
        tituloErro="Não foi possível carregar a atividade recente"
        esqueleto={<EsqueletoLista linhas={4} rotulo="Carregando a atividade recente…" />}
      >
        {({ eventosRecentes }) =>
          eventosRecentes.length === 0 ? (
            <EstadoVazio
              compacto
              icone={History}
              titulo="Nenhuma atividade recente."
              descricao="As tarefas que você criar ou concluir e os estudos que salvar aparecem aqui."
            />
          ) : (
            <ol className={estilos.lista}>
              {eventosRecentes.map((evento, indice) => {
                const { icone: Icone, verbo, tom } = aparencia[evento.tipo];
                return (
                  <li
                    key={`${evento.tipo}-${evento.referenciaId}-${evento.ocorridoEm}`}
                    className={`${estilos.item} item-em-cascata`}
                    style={{ '--indice': indice } as CSSProperties}
                  >
                    <span className={`${estilos.icone} ${estilos[tom] ?? ''}`} aria-hidden="true">
                      <Icone size={14} strokeWidth={2.25} />
                    </span>
                    <div className={estilos.textos}>
                      <p className={estilos.texto}>
                        {verbo}{' '}
                        <span className={estilos.referencia}>
                          {evento.tipo === 'SESSAO_SALVA' ? evento.descricao : `“${evento.descricao}”`}
                        </span>
                      </p>
                      <time className={estilos.quando} dateTime={evento.ocorridoEm}>
                        {formatarTempoRelativo(evento.ocorridoEm, agora)}
                      </time>
                    </div>
                  </li>
                );
              })}
            </ol>
          )
        }
      </ConteudoAssincrono>
    </Painel>
  );
}
