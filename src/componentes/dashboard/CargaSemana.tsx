import type { CSSProperties } from 'react';
import type { DiaCalendarioDTO } from '@/modelos/tarefas';
import { adicionarDiasIso, deDataIso, NOMES_DIAS_SEMANA } from '@/utilitarios/datas';
import { formatarDiaCurto, pluralizar } from '@/utilitarios/formatacao';
import { juntarClasses } from '@/utilitarios/juntarClasses';
import estilos from './CargaSemana.module.css';

const ABREVIACOES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] as const;

export interface CargaSemanaProps {
  inicioSemana: string;
  hojeIso: string;
  dias: DiaCalendarioDTO[];
}

function descreverDia(data: string, dia: DiaCalendarioDTO | undefined): string {
  const nome = NOMES_DIAS_SEMANA[deDataIso(data).getDay()] ?? '';
  if (!dia || dia.quantidade === 0) return `${nome}: nenhuma tarefa`;
  const partes = [pluralizar(dia.quantidade, 'tarefa', 'tarefas')];
  if (dia.concluidas > 0) partes.push(pluralizar(dia.concluidas, 'concluída', 'concluídas'));
  if (dia.atrasadas > 0) partes.push(pluralizar(dia.atrasadas, 'atrasada', 'atrasadas'));
  return `${nome}: ${partes.join(', ')}`;
}

export function CargaSemana({ inicioSemana, hojeIso, dias }: CargaSemanaProps) {
  const porData = new Map(dias.map((dia) => [dia.data, dia]));
  const datas = Array.from({ length: 7 }, (_, indice) => adicionarDiasIso(inicioSemana, indice));
  const maximo = Math.max(1, ...dias.map((dia) => dia.quantidade));

  return (
    <div className={estilos.carga}>
      <p className={estilos.legenda} id="legenda-carga">
        Tarefas por dia nesta semana
      </p>
      <ol className={estilos.dias} aria-labelledby="legenda-carga">
        {datas.map((data, indice) => {
          const dia = porData.get(data);
          const quantidade = dia?.quantidade ?? 0;
          const concluidas = dia?.concluidas ?? 0;
          const estilo = {
            '--proporcao': quantidade / maximo,
            '--proporcao-concluidas': quantidade > 0 ? concluidas / quantidade : 0,
            '--indice': indice,
          } as CSSProperties;

          return (
            <li
              key={data}
              className={juntarClasses(estilos.dia, data === hojeIso && estilos.hoje, data < hojeIso && estilos.passado)}
              style={estilo}
              title={`${formatarDiaCurto(data)} · ${descreverDia(data, dia).split(': ')[1]}`}
            >
              <span className="visualmente-oculto">
                {descreverDia(data, dia)}
                {data === hojeIso ? ' (hoje)' : ''}
              </span>
              <span className={estilos.quantidade} aria-hidden="true">
                {quantidade}
              </span>
              <span className={estilos.trilho} aria-hidden="true">
                <span className={estilos.barra}>
                  {concluidas > 0 ? (
                    <span className={juntarClasses(estilos.concluidas, concluidas < quantidade && estilos.parcial)} />
                  ) : null}
                </span>
              </span>
              <span className={estilos.nome} aria-hidden="true">
                {ABREVIACOES[indice]}
              </span>
            </li>
          );
        })}
      </ol>
      <div className={estilos.chaves} aria-hidden="true">
        <span className={estilos.chave}>
          <span className={juntarClasses(estilos.amostra, estilos.amostraConcluidas)} />
          Concluídas
        </span>
        <span className={estilos.chave}>
          <span className={estilos.amostra} />
          A fazer
        </span>
      </div>
    </div>
  );
}
