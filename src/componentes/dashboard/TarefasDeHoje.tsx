import { CalendarCheck2, CalendarClock, PartyPopper } from 'lucide-react';
import { ItemTarefa } from '@/componentes/tarefas/ItemTarefa';
import { BarraProgresso, Botao, CabecalhoPainel, ConteudoAssincrono, EsqueletoLista, EstadoVazio, Painel } from '@/componentes/ui';
import type { ResultadoAssincrono } from '@/ganchos/useDadosAssincronos';
import type { TarefaDTO } from '@/modelos/tarefas';
import { formatarDiaCompleto } from '@/utilitarios/formatacao';
import estilos from './TarefasDeHoje.module.css';

export interface DadosTarefasDeHoje {
  hoje: TarefaDTO[];
  atrasadas: TarefaDTO[];
}

export interface TarefasDeHojeProps {
  resultado: ResultadoAssincrono<DadosTarefasDeHoje>;
  hojeIso: string;
  idsEnviando: ReadonlySet<number>;
  movendoAtrasadas: boolean;
  aoAlternarConclusao: (tarefa: TarefaDTO) => void;
  aoMoverAtrasadas: (tarefas: TarefaDTO[]) => void;
  aoAbrirCalendario: () => void;
  className?: string;
}

function Progresso({ hoje }: { hoje: TarefaDTO[] }) {
  const validas = hoje.filter((tarefa) => tarefa.situacao !== 'CANCELADA');
  const concluidas = validas.filter((tarefa) => tarefa.situacao === 'CONCLUIDA').length;
  if (validas.length === 0) return null;
  const texto = `${concluidas} de ${validas.length} concluídas`;

  return (
    <div className={estilos.progresso}>
      <span className={estilos.progressoTexto}>
        <strong>{concluidas}</strong> de {validas.length}
        <span className="visualmente-oculto"> concluídas</span>
      </span>
      <BarraProgresso
        className={estilos.progressoBarra}
        valor={concluidas}
        maximo={validas.length}
        rotulo="Tarefas de hoje concluídas"
        textoValor={texto}
        tom={concluidas === validas.length ? 'sucesso' : 'destaque'}
      />
    </div>
  );
}

export function TarefasDeHoje({
  resultado,
  hojeIso,
  idsEnviando,
  movendoAtrasadas,
  aoAlternarConclusao,
  aoMoverAtrasadas,
  aoAbrirCalendario,
  className,
}: TarefasDeHojeProps) {
  const hoje = resultado.dados?.hoje.filter((tarefa) => tarefa.situacao !== 'CANCELADA') ?? [];

  return (
    <Painel className={className} aria-labelledby="titulo-hoje">
      <CabecalhoPainel
        titulo={<span id="titulo-hoje">Tarefas de hoje</span>}
        descricao={formatarDiaCompleto(hojeIso)}
        acao={resultado.dados ? <Progresso hoje={hoje} /> : null}
      />

      <ConteudoAssincrono
        resultado={resultado}
        tituloErro="Não foi possível carregar as tarefas de hoje"
        esqueleto={<EsqueletoLista linhas={5} rotulo="Carregando as tarefas de hoje…" />}
      >
        {({ atrasadas }) => {
          const todasConcluidas = hoje.length > 0 && hoje.every((tarefa) => tarefa.situacao === 'CONCLUIDA');

          return (
            <div className={estilos.conteudo}>
              {atrasadas.length > 0 ? (
                <section className={estilos.grupo} aria-labelledby="titulo-atrasadas">
                  <header className={estilos.cabecalhoGrupo}>
                    <h3 id="titulo-atrasadas" className={estilos.tituloGrupo}>
                      <CalendarClock size={15} strokeWidth={2} aria-hidden="true" className={estilos.iconeAtraso} />
                      Atrasadas
                      <span className={estilos.contagem}>{atrasadas.length}</span>
                    </h3>
                    <Botao
                      variante="terciario"
                      tamanho="sm"
                      icone={CalendarCheck2}
                      carregando={movendoAtrasadas}
                      onClick={() => aoMoverAtrasadas(atrasadas)}
                    >
                      Mover todas para hoje
                    </Botao>
                  </header>
                  <ul className={estilos.lista}>
                    {atrasadas.map((tarefa, indice) => (
                      <ItemTarefa
                        key={tarefa.id}
                        tarefa={tarefa}
                        hojeIso={hojeIso}
                        mostrarDia
                        indice={indice}
                        enviando={idsEnviando.has(tarefa.id)}
                        aoAlternarConclusao={aoAlternarConclusao}
                      />
                    ))}
                  </ul>
                </section>
              ) : null}

              <section className={estilos.grupo} aria-labelledby={atrasadas.length > 0 ? 'titulo-grupo-hoje' : 'titulo-hoje'}>
                {atrasadas.length > 0 ? (
                  <header className={estilos.cabecalhoGrupo}>
                    <h3 id="titulo-grupo-hoje" className={estilos.tituloGrupo}>
                      Hoje
                      <span className={estilos.contagem}>{hoje.length}</span>
                    </h3>
                  </header>
                ) : null}

                {hoje.length === 0 ? (
                  <EstadoVazio
                    compacto
                    icone={CalendarCheck2}
                    titulo="Nenhuma tarefa para hoje."
                    descricao="Aproveite o tempo para planejar suas próximas atividades."
                    acao={
                      <Botao variante="secundario" tamanho="sm" onClick={aoAbrirCalendario}>
                        Abrir o calendário
                      </Botao>
                    }
                  />
                ) : (
                  <ul className={estilos.lista}>
                    {hoje.map((tarefa, indice) => (
                      <ItemTarefa
                        key={tarefa.id}
                        tarefa={tarefa}
                        hojeIso={hojeIso}
                        indice={indice + atrasadas.length}
                        enviando={idsEnviando.has(tarefa.id)}
                        aoAlternarConclusao={aoAlternarConclusao}
                      />
                    ))}
                  </ul>
                )}

                {todasConcluidas ? (
                  <p className={estilos.celebracao} role="status">
                    <PartyPopper size={16} strokeWidth={2} aria-hidden="true" />
                    Tudo feito por hoje. Bom trabalho!
                  </p>
                ) : null}
              </section>
            </div>
          );
        }}
      </ConteudoAssincrono>
    </Painel>
  );
}
