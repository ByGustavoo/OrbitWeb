import type { CSSProperties } from 'react';
import { ArrowRight, CalendarCheck2, ListChecks } from 'lucide-react';
import { ItemTarefa } from '@/componentes/tarefas/ItemTarefa';
import { Botao, CabecalhoPainel, EstadoVazio, Painel } from '@/componentes/ui';
import type { TarefasSemanaDTO } from '@/modelos/revisao';
import type { TarefaDTO } from '@/modelos/tarefas';
import { precisaDeNovaData } from '@/regras/prazo';
import { pluralizar } from '@/utilitarios/formatacao';
import estilos from './TarefasDaSemana.module.css';

export interface TarefasDaSemanaProps {
  tarefas: TarefasSemanaDTO;
  pendentes: TarefaDTO[];
  hojeIso: string;
  idsEnviando: ReadonlySet<number>;
  movendoAtrasadas: boolean;
  aoAlternarConclusao: (tarefa: TarefaDTO) => void;
  aoAbrir: (tarefa: TarefaDTO) => void;
  aoMoverAtrasadas: (atrasadas: TarefaDTO[]) => void;
  aoVerCalendario: () => void;
  className?: string;
}

interface Fatia {
  chave: string;
  rotulo: string;
  quantidade: number;
  cor: string;
}

export function TarefasDaSemana({
  tarefas,
  pendentes,
  hojeIso,
  idsEnviando,
  movendoAtrasadas,
  aoAlternarConclusao,
  aoAbrir,
  aoMoverAtrasadas,
  aoVerCalendario,
  className,
}: TarefasDaSemanaProps) {
  const fatias: Fatia[] = [
    { chave: 'concluidas', rotulo: 'Concluídas', quantidade: tarefas.concluidas, cor: 'var(--sucesso-grafico)' },
    { chave: 'em-aberto', rotulo: 'A fazer', quantidade: tarefas.emAberto, cor: 'var(--grafico-1)' },
    { chave: 'atrasadas', rotulo: 'Atrasadas', quantidade: tarefas.atrasadas, cor: 'var(--erro-grafico)' },
    { chave: 'nao-realizadas', rotulo: 'Não realizadas', quantidade: tarefas.naoRealizadas, cor: 'var(--aviso-grafico)' },
    { chave: 'canceladas', rotulo: 'Canceladas', quantidade: tarefas.canceladas, cor: 'var(--texto-desabilitado)' },
  ];
  const total = fatias.reduce((soma, fatia) => soma + fatia.quantidade, 0);
  const atrasadas = pendentes.filter((tarefa) => precisaDeNovaData(tarefa, hojeIso));
  const descricao =
    total === 0
      ? 'Tarefas com data nesta semana'
      : `${pluralizar(total, 'tarefa com data', 'tarefas com data')} nesta semana${
          tarefas.concluidasComAtraso > 0 ? ` · ${tarefas.concluidasComAtraso} concluída${tarefas.concluidasComAtraso === 1 ? '' : 's'} com atraso` : ''
        }`;

  return (
    <Painel className={className} aria-labelledby="titulo-tarefas-semana">
      <CabecalhoPainel
        titulo={<span id="titulo-tarefas-semana">Tarefas planejadas para a semana</span>}
        descricao={descricao}
        acao={
          <Botao variante="terciario" tamanho="sm" iconeDireita={ArrowRight} onClick={aoVerCalendario}>
            Ver no calendário
          </Botao>
        }
      />

      {total === 0 ? (
        <EstadoVazio
          compacto
          icone={ListChecks}
          titulo="Nenhuma tarefa com data nesta semana."
          descricao="As tarefas agendadas para estes dias aparecem aqui, separadas por situação."
        />
      ) : (
        <div className={estilos.conteudo}>
          <figure className={estilos.distribuicao}>
            <figcaption className="visualmente-oculto">
              Situação das {total} tarefas com data nesta semana:{' '}
              {fatias
                .filter((fatia) => fatia.quantidade > 0)
                .map((fatia) => `${fatia.quantidade} ${fatia.rotulo.toLocaleLowerCase('pt-BR')}`)
                .join(', ')}
              .
            </figcaption>
            <div className={estilos.barra} aria-hidden="true">
              {fatias
                .filter((fatia) => fatia.quantidade > 0)
                .map((fatia) => (
                  <span
                    key={fatia.chave}
                    className={estilos.fatia}
                    style={{ flexGrow: fatia.quantidade, backgroundColor: fatia.cor } as CSSProperties}
                  />
                ))}
            </div>
            <ul className={estilos.legenda} aria-hidden="true">
              {fatias.map((fatia) => (
                <li key={fatia.chave} className={estilos.itemLegenda}>
                  <span className={estilos.marca} style={{ backgroundColor: fatia.cor }} />
                  <span className={estilos.rotuloLegenda}>{fatia.rotulo}</span>
                  <span className={estilos.quantidade}>{fatia.quantidade}</span>
                </li>
              ))}
            </ul>
          </figure>

          <section className={estilos.pendentes} aria-labelledby="titulo-pendentes-semana">
            <header className={estilos.cabecalhoPendentes}>
              <h3 id="titulo-pendentes-semana" className={estilos.tituloPendentes}>
                Continuam em aberto
                <span className={estilos.contagem}>{pendentes.length}</span>
              </h3>
              {atrasadas.length > 0 ? (
                <Botao
                  variante="secundario"
                  tamanho="sm"
                  icone={CalendarCheck2}
                  carregando={movendoAtrasadas}
                  onClick={() => aoMoverAtrasadas(atrasadas)}
                >
                  {atrasadas.length === 1 ? 'Mover a atrasada para hoje' : 'Mover as atrasadas para hoje'}
                </Botao>
              ) : null}
            </header>
            {pendentes.length === 0 ? (
              <p className={estilos.semPendentes}>Nenhuma tarefa desta semana continua em aberto.</p>
            ) : (
              <ul className={estilos.lista}>
                {pendentes.map((tarefa, indice) => (
                  <ItemTarefa
                    key={tarefa.id}
                    tarefa={tarefa}
                    hojeIso={hojeIso}
                    mostrarDia
                    indice={indice}
                    enviando={idsEnviando.has(tarefa.id)}
                    aoAlternarConclusao={aoAlternarConclusao}
                    aoAbrir={aoAbrir}
                  />
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </Painel>
  );
}
