import { CalendarRange } from 'lucide-react';
import { SeloPrioridade } from '@/componentes/tarefas/SelosTarefa';
import { CabecalhoPainel, ConteudoAssincrono, Esqueleto, EsqueletoLista, EstadoVazio, Painel } from '@/componentes/ui';
import type { ResultadoAssincrono } from '@/ganchos/useDadosAssincronos';
import type { DiaCalendarioDTO, TarefaDTO } from '@/modelos/tarefas';
import { formatarDiaRelativo } from '@/utilitarios/formatacao';
import { CargaSemana } from './CargaSemana';
import estilos from './ProximasAtividades.module.css';

export interface DadosProximasAtividades {
  proximas: TarefaDTO[];
  semana: DiaCalendarioDTO[];
}

export interface ProximasAtividadesProps {
  resultado: ResultadoAssincrono<DadosProximasAtividades>;
  hojeIso: string;
  inicioSemana: string;
  diasAdiante: number;
  className?: string;
}

function agruparPorDia(tarefas: TarefaDTO[]): [string, TarefaDTO[]][] {
  const grupos = new Map<string, TarefaDTO[]>();
  for (const tarefa of tarefas) {
    if (!tarefa.data) continue;
    grupos.set(tarefa.data, [...(grupos.get(tarefa.data) ?? []), tarefa]);
  }
  return [...grupos];
}

function EsqueletoProximas() {
  return (
    <div className={estilos.esqueleto}>
      <Esqueleto altura={96} raio="var(--raio-md)" />
      <EsqueletoLista linhas={3} rotulo="Carregando as próximas atividades…" />
    </div>
  );
}

export function ProximasAtividades({ resultado, hojeIso, inicioSemana, diasAdiante, className }: ProximasAtividadesProps) {
  return (
    <Painel className={className} aria-labelledby="titulo-proximas">
      <CabecalhoPainel
        titulo={<span id="titulo-proximas">Próximas atividades</span>}
        descricao={`O que vem nos próximos ${diasAdiante} dias`}
      />

      <ConteudoAssincrono
        resultado={resultado}
        tituloErro="Não foi possível carregar as próximas atividades"
        esqueleto={<EsqueletoProximas />}
      >
        {({ proximas, semana }) => (
          <div className={estilos.conteudo}>
            <CargaSemana inicioSemana={inicioSemana} hojeIso={hojeIso} dias={semana} />

            {proximas.length === 0 ? (
              <EstadoVazio
                compacto
                icone={CalendarRange}
                titulo="Nada agendado por enquanto."
                descricao={`Nenhuma tarefa pendente nos próximos ${diasAdiante} dias.`}
              />
            ) : (
              <div className={estilos.grupos}>
                {agruparPorDia(proximas).map(([data, tarefas]) => (
                  <section key={data} className={estilos.grupo} aria-label={formatarDiaRelativo(data, hojeIso)}>
                    <h3 className={estilos.dia}>
                      <time dateTime={data}>{formatarDiaRelativo(data, hojeIso)}</time>
                    </h3>
                    <ul className={estilos.lista}>
                      {tarefas.map((tarefa) => (
                        <li key={tarefa.id} className={estilos.item}>
                          {tarefa.diaInteiro || !tarefa.horarioInicio ? (
                            <span className={estilos.diaTodo}>Dia todo</span>
                          ) : (
                            <time className={estilos.horario}>{tarefa.horarioInicio}</time>
                          )}
                          <span className={estilos.titulo} title={tarefa.titulo}>
                            {tarefa.titulo}
                          </span>
                          <SeloPrioridade prioridade={tarefa.prioridade} />
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            )}
          </div>
        )}
      </ConteudoAssincrono>
    </Painel>
  );
}
