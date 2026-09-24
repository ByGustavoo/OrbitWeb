import type { TarefaDTO } from '@/modelos/tarefas';
import { deDataIso, diasEntre } from '@/utilitarios/datas';
import { formatarDiaCompleto } from '@/utilitarios/formatacao';
import { juntarClasses } from '@/utilitarios/juntarClasses';
import { ItemTarefa } from './ItemTarefa';
import estilos from './ListaTarefas.module.css';

export interface ListaTarefasProps {
  tarefas: TarefaDTO[];
  hojeIso: string;
  agruparPorDia: boolean;
  idsEnviando: ReadonlySet<number>;
  aoAlternarConclusao: (tarefa: TarefaDTO) => void;
  aoAbrir: (tarefa: TarefaDTO) => void;
}

interface Grupo {
  data: string | null;
  tarefas: TarefaDTO[];
}

function agrupar(tarefas: TarefaDTO[]): Grupo[] {
  const grupos: Grupo[] = [];
  for (const tarefa of tarefas) {
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.data === tarefa.data) ultimo.tarefas.push(tarefa);
    else grupos.push({ data: tarefa.data, tarefas: [tarefa] });
  }
  return grupos;
}

function tituloGrupo(data: string | null, hojeIso: string): { principal: string; relativo: string | null } {
  if (!data) return { principal: 'Sem data', relativo: null };
  const distancia = diasEntre(hojeIso, data);
  const relativo = distancia === 0 ? 'Hoje' : distancia === 1 ? 'Amanhã' : distancia === -1 ? 'Ontem' : null;
  const outroAno = deDataIso(data).getFullYear() !== deDataIso(hojeIso).getFullYear();
  return { principal: `${formatarDiaCompleto(data)}${outroAno ? ` de ${deDataIso(data).getFullYear()}` : ''}`, relativo };
}

export function ListaTarefas({
  tarefas,
  hojeIso,
  agruparPorDia,
  idsEnviando,
  aoAlternarConclusao,
  aoAbrir,
}: ListaTarefasProps) {
  const item = (tarefa: TarefaDTO, indice: number, mostrarDia: boolean) => (
    <ItemTarefa
      key={tarefa.id}
      tarefa={tarefa}
      hojeIso={hojeIso}
      indice={indice}
      mostrarDia={mostrarDia}
      mostrarSituacao
      enviando={idsEnviando.has(tarefa.id)}
      aoAlternarConclusao={aoAlternarConclusao}
      aoAbrir={aoAbrir}
    />
  );

  if (!agruparPorDia) {
    return (
      <div className={estilos.lista}>
        <ul className={estilos.itens}>{tarefas.map((tarefa, indice) => item(tarefa, indice, true))}</ul>
      </div>
    );
  }

  let indiceGlobal = 0;
  return (
    <div className={estilos.lista}>
      {agrupar(tarefas).map((grupo) => {
        const { principal, relativo } = tituloGrupo(grupo.data, hojeIso);
        const passado = grupo.data !== null && grupo.data < hojeIso;
        return (
          <section key={grupo.data ?? 'sem-data'} className={estilos.grupo} aria-label={relativo ? `${relativo}, ${principal}` : principal}>
            <h2 className={juntarClasses(estilos.tituloGrupo, passado && estilos.passado)}>
              {relativo ? <span className={estilos.relativo}>{relativo}</span> : null}
              <span>{principal}</span>
              <span className={estilos.contagem} aria-hidden="true">
                {grupo.tarefas.length}
              </span>
            </h2>
            <ul className={estilos.itens}>{grupo.tarefas.map((tarefa) => item(tarefa, indiceGlobal++, false))}</ul>
          </section>
        );
      })}
    </div>
  );
}
