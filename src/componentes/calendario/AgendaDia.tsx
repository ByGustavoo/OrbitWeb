import type { CSSProperties } from 'react';
import { CalendarPlus, Plus } from 'lucide-react';
import { ItemTarefa } from '@/componentes/tarefas/ItemTarefa';
import { Botao, CabecalhoPainel, EsqueletoLista, EstadoErro, EstadoVazio, Painel } from '@/componentes/ui';
import { coresDaPaleta } from '@/modelos/cores';
import type { SessaoEstudoDTO } from '@/modelos/estudos';
import type { TarefaDTO } from '@/modelos/tarefas';
import { deDataIso, diasEntre } from '@/utilitarios/datas';
import { formatarDiaCompleto, formatarDuracao, formatarDuracaoSegundos, formatarHorario, pluralizar } from '@/utilitarios/formatacao';
import { juntarClasses } from '@/utilitarios/juntarClasses';
import estilos from './AgendaDia.module.css';

export interface AgendaDiaProps {
  dia: string;
  hojeIso: string;
  tarefas: TarefaDTO[] | null;
  desatualizada: boolean;
  erro: Error | null;
  tentando: boolean;
  idsEnviando: ReadonlySet<number>;
  aoTentarNovamente: () => void;
  aoAlternarConclusao: (tarefa: TarefaDTO) => void;
  aoAbrir: (tarefa: TarefaDTO) => void;
  aoNovaTarefa: () => void;
  sessoes: SessaoEstudoDTO[] | null;
  className?: string;
}

function distancia(dia: string, hojeIso: string): string {
  const dias = diasEntre(hojeIso, dia);
  if (dias === 0) return 'Hoje';
  if (dias === 1) return 'Amanhã';
  if (dias === -1) return 'Ontem';
  return dias > 0 ? `Daqui a ${dias} dias` : `Há ${Math.abs(dias)} dias`;
}

function resumir(tarefas: TarefaDTO[]): string {
  const validas = tarefas.filter((tarefa) => tarefa.situacao !== 'CANCELADA');
  if (validas.length === 0) return tarefas.length > 0 ? pluralizar(tarefas.length, 'cancelada', 'canceladas') : 'Nenhuma tarefa';
  const concluidas = validas.filter((tarefa) => tarefa.situacao === 'CONCLUIDA').length;
  const partes = [pluralizar(validas.length, 'tarefa', 'tarefas')];
  if (concluidas > 0) partes.push(pluralizar(concluidas, 'concluída', 'concluídas'));
  return partes.join(' · ');
}

function ordenar(tarefas: TarefaDTO[]): TarefaDTO[] {
  return [...tarefas].sort((a, b) => Number(a.situacao === 'CANCELADA') - Number(b.situacao === 'CANCELADA'));
}

export function AgendaDia({
  dia,
  hojeIso,
  tarefas,
  desatualizada,
  erro,
  tentando,
  idsEnviando,
  aoTentarNovamente,
  aoAlternarConclusao,
  aoAbrir,
  aoNovaTarefa,
  sessoes,
  className,
}: AgendaDiaProps) {
  const data = deDataIso(dia);
  const outroAno = data.getFullYear() !== deDataIso(hojeIso).getFullYear();
  const titulo = `${formatarDiaCompleto(dia)}${outroAno ? ` de ${data.getFullYear()}` : ''}`;
  const passado = dia < hojeIso;
  const idTitulo = 'titulo-agenda-dia';

  return (
    <Painel className={juntarClasses(estilos.agenda, className)} aria-labelledby={idTitulo}>
      <CabecalhoPainel
        titulo={
          <span id={idTitulo} aria-live="polite">
            {titulo}
          </span>
        }
        descricao={
          <>
            <span className={juntarClasses(estilos.distancia, dia === hojeIso && estilos.hoje)}>{distancia(dia, hojeIso)}</span>
            {tarefas && !desatualizada ? <span> · {resumir(tarefas)}</span> : null}
          </>
        }
        acao={
          <Botao variante="secundario" tamanho="sm" icone={Plus} onClick={aoNovaTarefa}>
            Nova tarefa
          </Botao>
        }
      />

      <div className={estilos.conteudo} aria-busy={desatualizada || undefined}>
        {erro && !tentando ? (
          <EstadoErro
            compacto
            titulo="Não foi possível carregar as tarefas deste dia"
            erro={erro}
            aoTentarNovamente={aoTentarNovamente}
            tentando={tentando}
          />
        ) : !tarefas || desatualizada ? (
          <EsqueletoLista linhas={3} rotulo="Carregando as tarefas do dia…" imediato={desatualizada} />
        ) : tarefas.length === 0 ? (
          <EstadoVazio
            compacto
            icone={CalendarPlus}
            titulo="Nenhuma tarefa para este dia."
            descricao={passado ? 'Nada foi agendado para esta data.' : 'Planeje algo para esta data ou deixe o dia livre.'}
            acao={
              <Botao variante="secundario" tamanho="sm" icone={Plus} onClick={aoNovaTarefa}>
                Criar tarefa neste dia
              </Botao>
            }
          />
        ) : (
          <ul className={estilos.lista}>
            {ordenar(tarefas).map((tarefa, indice) => (
              <ItemTarefa
                key={tarefa.id}
                tarefa={tarefa}
                hojeIso={hojeIso}
                indice={indice}
                mostrarSituacao
                enviando={idsEnviando.has(tarefa.id)}
                aoAlternarConclusao={aoAlternarConclusao}
                aoAbrir={aoAbrir}
              />
            ))}
          </ul>
        )}
      </div>

      {sessoes && sessoes.length > 0 ? (
        <section className={estilos.estudos} aria-labelledby="titulo-estudos-dia">
          <h3 className={estilos.tituloEstudos} id="titulo-estudos-dia">
            Estudo neste dia
            <span className={estilos.totalEstudos}>
              {formatarDuracao(Math.round(sessoes.reduce((soma, sessao) => soma + sessao.duracaoSegundos, 0) / 60))} ·{' '}
              {pluralizar(sessoes.length, 'sessão', 'sessões')}
            </span>
          </h3>
          <ul className={estilos.listaEstudos}>
            {[...sessoes]
              .sort((a, b) => a.inicio.localeCompare(b.inicio))
              .map((sessao) => (
                <li
                  key={sessao.id}
                  className={estilos.sessao}
                  style={{ '--cor-atividade': coresDaPaleta(sessao.atividade.cor).texto } as CSSProperties}
                >
                  <span className={estilos.corSessao} aria-hidden="true" />
                  <span className={estilos.nomeSessao}>{sessao.atividade.nome}</span>
                  <span className={estilos.horarioSessao}>
                    {formatarHorario(sessao.inicio)} – {formatarHorario(sessao.fim)}
                  </span>
                  <span className={estilos.duracaoSessao}>{formatarDuracaoSegundos(sessao.duracaoSegundos)}</span>
                </li>
              ))}
          </ul>
        </section>
      ) : null}
    </Painel>
  );
}
