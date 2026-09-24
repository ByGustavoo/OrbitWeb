import { useId } from 'react';
import { AlertCircle, Repeat } from 'lucide-react';
import { CampoSelecao, GrupoRadio, SeletorData } from '@/componentes/ui';
import type { DiaSemana, Frequencia } from '@/modelos/enumeracoes';
import { DIAS_SEMANA, FREQUENCIAS } from '@/modelos/enumeracoes';
import { rotuloDiaSemana, rotuloFrequencia } from '@/modelos/rotulos';
import { descreverRecorrencia, ordenarDiasSemana } from '@/regras/recorrencia';
import { INICIAIS_DIAS_SEMANA } from '@/utilitarios/datas';
import { juntarClasses } from '@/utilitarios/juntarClasses';
import estilos from './CamposRecorrencia.module.css';

export type TerminoRecorrencia = 'NUNCA' | 'DATA';

export interface ValoresRecorrencia {
  frequencia: Frequencia;
  diasSemana: DiaSemana[];
  termino: TerminoRecorrencia;
  dataFim: string | null;
}

export interface CamposRecorrenciaProps {
  valores: ValoresRecorrencia;
  dataInicial: string | null;
  erros: { frequencia?: string; diasSemana?: string; dataFim?: string };
  idsCampos: { frequencia: string; diasSemana: string; dataFim: string };
  aoMudar: (parcial: Partial<ValoresRecorrencia>) => void;
}

export function CamposRecorrencia({ valores, dataInicial, erros, idsCampos, aoMudar }: CamposRecorrenciaProps) {
  const idBase = useId();
  const idLegendaDias = `${idBase}-dias`;
  const idErroDias = `${idBase}-erro-dias`;

  const alternarDia = (dia: DiaSemana) => {
    const marcados = valores.diasSemana.includes(dia)
      ? valores.diasSemana.filter((item) => item !== dia)
      : [...valores.diasSemana, dia];
    aoMudar({ diasSemana: ordenarDiasSemana(marcados) });
  };

  const resumo =
    dataInicial && (valores.frequencia !== 'DIAS_DA_SEMANA' || valores.diasSemana.length > 0)
      ? descreverRecorrencia(
          {
            frequencia: valores.frequencia,
            diasSemana: valores.diasSemana,
            dataFim: valores.termino === 'DATA' ? valores.dataFim : null,
          },
          dataInicial,
        )
      : null;

  return (
    <div className={estilos.campos}>
      <CampoSelecao
        id={idsCampos.frequencia}
        rotulo="Repetir"
        opcoes={FREQUENCIAS.map((frequencia) => ({ valor: frequencia, rotulo: rotuloFrequencia[frequencia] }))}
        valor={valores.frequencia}
        aoMudar={(frequencia) => frequencia && aoMudar({ frequencia })}
        erro={erros.frequencia}
      />

      {valores.frequencia === 'DIAS_DA_SEMANA' ? (
        <div
          className={estilos.dias}
          role="group"
          aria-labelledby={idLegendaDias}
          aria-describedby={erros.diasSemana ? idErroDias : undefined}
        >
          <span className={estilos.legenda} id={idLegendaDias}>
            Dias da semana
          </span>
          <div className={estilos.botoesDias}>
            {DIAS_SEMANA.map((dia, indice) => {
              const marcado = valores.diasSemana.includes(dia);
              return (
                <button
                  key={dia}
                  id={indice === 0 ? idsCampos.diasSemana : undefined}
                  type="button"
                  className={juntarClasses(estilos.dia, marcado && estilos.diaMarcado, erros.diasSemana && estilos.diaInvalido)}
                  aria-pressed={marcado}
                  aria-label={rotuloDiaSemana[dia]}
                  title={rotuloDiaSemana[dia]}
                  onClick={() => alternarDia(dia)}
                >
                  {INICIAIS_DIAS_SEMANA[indice]}
                </button>
              );
            })}
          </div>
          {erros.diasSemana ? (
            <p className={estilos.erro} id={idErroDias}>
              <AlertCircle size={14} strokeWidth={2} aria-hidden="true" />
              {erros.diasSemana}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className={estilos.termino}>
        <GrupoRadio
          legenda="Termina"
          horizontal
          opcoes={[
            { valor: 'NUNCA', rotulo: 'Nunca' },
            { valor: 'DATA', rotulo: 'Em uma data' },
          ]}
          valor={valores.termino}
          aoMudar={(termino) => aoMudar({ termino })}
        />
        {valores.termino === 'DATA' ? (
          <SeletorData
            id={idsCampos.dataFim}
            rotulo="Última repetição"
            valor={valores.dataFim}
            aoMudar={(dataFim) => aoMudar({ dataFim })}
            permitirLimpar={false}
            erro={erros.dataFim}
            className={estilos.dataFim}
          />
        ) : null}
      </div>

      {resumo ? (
        <p className={estilos.resumo} aria-live="polite">
          <Repeat size={15} strokeWidth={2} aria-hidden="true" />
          {resumo}
        </p>
      ) : null}
    </div>
  );
}
