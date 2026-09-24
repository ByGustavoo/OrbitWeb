import { useEffect, useId, useRef } from 'react';
import type { KeyboardEvent } from 'react';
import type { DiaCalendarioDTO } from '@/modelos/tarefas';
import {
  INICIAIS_DIAS_SEMANA,
  NOMES_DIAS_SEMANA,
  adicionarDias,
  adicionarMeses,
  dataIsoLocal,
  deDataIso,
  gradeDoMes,
} from '@/utilitarios/datas';
import { CelulaDia } from './CelulaDia';
import estilos from './GradeMes.module.css';

const ABREVIACOES_DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] as const;

export interface GradeMesProps {
  mes: Date;
  hojeIso: string;
  selecionado: string;
  resumo: ReadonlyMap<string, DiaCalendarioDTO>;
  carregando: boolean;
  aoSelecionar: (iso: string) => void;
}

export function GradeMes({ mes, hojeIso, selecionado, resumo, carregando, aoSelecionar }: GradeMesProps) {
  const gradeRef = useRef<HTMLDivElement>(null);
  const focarSelecionado = useRef(false);
  const idDica = useId();
  const dias = gradeDoMes(mes.getFullYear(), mes.getMonth());
  const semanas = Array.from({ length: 6 }, (_, semana) => dias.slice(semana * 7, semana * 7 + 7));
  const isosVisiveis = dias.map(dataIsoLocal);
  const focavel = isosVisiveis.includes(selecionado) ? selecionado : dataIsoLocal(new Date(mes.getFullYear(), mes.getMonth(), 1));

  useEffect(() => {
    if (!focarSelecionado.current) return;
    focarSelecionado.current = false;
    gradeRef.current?.querySelector<HTMLElement>(`[data-iso="${selecionado}"]`)?.focus({ preventScroll: false });
  }, [selecionado, mes]);

  const aoTeclar = (evento: KeyboardEvent<HTMLDivElement>) => {
    const atual = deDataIso(focavel);
    const acoes: Record<string, () => Date> = {
      ArrowLeft: () => adicionarDias(atual, -1),
      ArrowRight: () => adicionarDias(atual, 1),
      ArrowUp: () => adicionarDias(atual, -7),
      ArrowDown: () => adicionarDias(atual, 7),
      Home: () => adicionarDias(atual, -atual.getDay()),
      End: () => adicionarDias(atual, 6 - atual.getDay()),
      PageUp: () => adicionarMeses(atual, evento.shiftKey ? -12 : -1),
      PageDown: () => adicionarMeses(atual, evento.shiftKey ? 12 : 1),
    };
    const acao = acoes[evento.key];
    if (!acao) return;
    evento.preventDefault();
    focarSelecionado.current = true;
    aoSelecionar(dataIsoLocal(acao()));
  };

  return (
    <>
      <div
        ref={gradeRef}
        role="grid"
        aria-label="Dias do mês"
        aria-describedby={idDica}
        aria-busy={carregando || undefined}
        className={estilos.grade}
        onKeyDown={aoTeclar}
      >
        <div role="row" className={estilos.linhaSemana}>
          {ABREVIACOES_DIAS.map((abreviacao, indice) => (
            <span key={abreviacao} role="columnheader" className={estilos.diaSemana} aria-label={NOMES_DIAS_SEMANA[indice]}>
              <span className={estilos.abreviacao} aria-hidden="true">
                {abreviacao}
              </span>
              <span className={estilos.inicial} aria-hidden="true">
                {INICIAIS_DIAS_SEMANA[indice]}
              </span>
            </span>
          ))}
        </div>
        {semanas.map((semana, indiceSemana) => (
          <div role="row" key={indiceSemana} className={estilos.linhaDias}>
            {semana.map((dia) => {
              const iso = dataIsoLocal(dia);
              return (
                <CelulaDia
                  key={iso}
                  dia={dia}
                  iso={iso}
                  resumo={resumo.get(iso)}
                  foraDoMes={dia.getMonth() !== mes.getMonth()}
                  ehHoje={iso === hojeIso}
                  passado={iso < hojeIso}
                  selecionado={iso === selecionado}
                  focavel={iso === focavel}
                  aoSelecionar={aoSelecionar}
                />
              );
            })}
          </div>
        ))}
      </div>
      <p id={idDica} className="visualmente-oculto">
        Use as setas para mudar de dia, Page Up e Page Down para mudar de mês, e Shift com Page Up ou Page Down para mudar de ano.
      </p>
    </>
  );
}
