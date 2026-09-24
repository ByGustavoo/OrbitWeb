import { useEffect, useMemo, useRef, useState } from 'react';
import type { MouseEvent } from 'react';
import { CabecalhoPainel, ConteudoAssincrono, Esqueleto, Painel } from '@/componentes/ui';
import type { ResultadoAssincrono } from '@/ganchos/useDadosAssincronos';
import { coresDaPaleta } from '@/modelos/cores';
import type { MapaCalorDTO, MinutosDiaDTO } from '@/modelos/estudos';
import { montarEscalaCalor, nivelCalor } from '@/regras/escalaCalor';
import { deDataIso, INICIAIS_DIAS_SEMANA } from '@/utilitarios/datas';
import { formatarDiaCompleto, formatarDuracao, formatarDuracaoPorExtenso, formatarNomeMes } from '@/utilitarios/formatacao';
import { juntarClasses } from '@/utilitarios/juntarClasses';
import estilos from './MapaCalorEstudo.module.css';

const NIVEIS = [0, 1, 2, 3, 4] as const;

interface BlocoMes {
  chave: string;
  deslocamento: number;
  dias: MinutosDiaDTO[];
}

export interface MapaCalorEstudoProps {
  resultado: ResultadoAssincrono<MapaCalorDTO>;
  hojeIso: string;
  meses: number;
  className?: string;
}

function agruparPorMes(dias: MinutosDiaDTO[]): BlocoMes[] {
  const grupos = new Map<string, MinutosDiaDTO[]>();
  for (const dia of dias) {
    const chave = dia.data.slice(0, 7);
    grupos.set(chave, [...(grupos.get(chave) ?? []), dia]);
  }
  return [...grupos].map(([chave, lista]) => ({
    chave,
    deslocamento: lista[0] ? deDataIso(lista[0].data).getDay() : 0,
    dias: lista,
  }));
}

function EsqueletoMapa() {
  return (
    <div className={estilos.corpo} role="status" aria-label="Carregando o mapa de estudo…">
      <Esqueleto altura={150} raio="var(--raio-md)" />
      <div className={estilos.lateral}>
        {[0, 1, 2, 3].map((indice) => (
          <Esqueleto key={indice} altura={16} />
        ))}
      </div>
    </div>
  );
}

interface MapaProps {
  mapa: MapaCalorDTO;
  hojeIso: string;
  focado: string | null;
  aoFocar: (data: string | null) => void;
}

function Mapa({ mapa, hojeIso, focado, aoFocar }: MapaProps) {
  const calendarioRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const calendario = calendarioRef.current;
    if (calendario) calendario.scrollLeft = calendario.scrollWidth;
  }, [mapa.dias]);

  const meses = useMemo(() => agruparPorMes(mapa.dias), [mapa.dias]);
  const decorridos = useMemo(() => mapa.dias.filter((dia) => dia.data <= hojeIso), [mapa.dias, hojeIso]);
  const escala = useMemo(() => montarEscalaCalor(decorridos.map((dia) => dia.minutos)), [decorridos]);

  const total = decorridos.reduce((soma, dia) => soma + dia.minutos, 0);
  const media = decorridos.length > 0 ? total / decorridos.length : 0;
  const semEstudo = decorridos.filter((dia) => dia.minutos === 0).length;
  const maior = decorridos.reduce<MinutosDiaDTO | null>((melhor, dia) => (dia.minutos > (melhor?.minutos ?? 0) ? dia : melhor), null);

  const resumo = maior
    ? `Mapa de minutos de estudo por dia. Média diária de ${formatarDuracaoPorExtenso(media)}. Maior dia: ${formatarDiaCompleto(maior.data)}, com ${formatarDuracaoPorExtenso(maior.minutos)}. ${semEstudo} de ${decorridos.length} dias sem estudo.`
    : 'Mapa de minutos de estudo por dia. Nenhum estudo registrado no período.';

  const aoApontar = (evento: MouseEvent<HTMLDivElement>) => {
    const data = (evento.target as HTMLElement).dataset.data;
    if (data) aoFocar(data);
  };

  return (
    <>
      <div className={estilos.corpo}>
        <div
          ref={calendarioRef}
          className={estilos.calendario}
          role="img"
          aria-label={resumo}
          onMouseOver={aoApontar}
          onClick={aoApontar}
          onMouseLeave={() => aoFocar(null)}
        >
          {meses.map((mes) => (
            <div key={mes.chave} className={estilos.mes}>
              <span className={estilos.nomeMes}>{formatarNomeMes(`${mes.chave}-01`)}</span>
              <div className={estilos.semana} aria-hidden="true">
                {INICIAIS_DIAS_SEMANA.map((inicial, indice) => (
                  <span key={indice}>{inicial}</span>
                ))}
              </div>
              <div className={estilos.grade}>
                {Array.from({ length: mes.deslocamento }, (_, indice) => (
                  <span key={`vazio-${indice}`} className={estilos.vazio} />
                ))}
                {mes.dias.map((item) => (
                  <span
                    key={item.data}
                    data-data={item.data <= hojeIso ? item.data : undefined}
                    className={juntarClasses(
                      estilos.dia,
                      estilos[`nivel${nivelCalor(item.minutos, escala)}`],
                      item.data > hojeIso && estilos.futuro,
                      item.data === hojeIso && estilos.hoje,
                      item.data === focado && estilos.focado,
                    )}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className={estilos.lateral}>
          <dl className={estilos.estatisticas}>
            <div className={estilos.estatistica}>
              <dt>Média diária</dt>
              <dd>{formatarDuracao(media)}</dd>
            </div>
            <div className={estilos.estatistica}>
              <dt>Maior dia</dt>
              <dd>{maior ? formatarDuracao(maior.minutos) : '—'}</dd>
            </div>
            <div className={estilos.estatistica}>
              <dt>Mais estudada</dt>
              <dd className={estilos.atividade}>
                {mapa.atividadeMaisEstudada ? (
                  <>
                    <span
                      className={estilos.corAtividade}
                      style={{ backgroundColor: coresDaPaleta(mapa.atividadeMaisEstudada.cor).texto }}
                      aria-hidden="true"
                    />
                    {mapa.atividadeMaisEstudada.nome}
                  </>
                ) : (
                  '—'
                )}
              </dd>
            </div>
            <div className={estilos.estatistica}>
              <dt>Dias sem estudo</dt>
              <dd>
                {semEstudo} de {decorridos.length}
              </dd>
            </div>
          </dl>

          <div className={estilos.legenda} aria-hidden="true">
            <span>Menos</span>
            {NIVEIS.map((nivel) => (
              <span key={nivel} className={juntarClasses(estilos.amostra, estilos[`nivel${nivel}`])} />
            ))}
            <span>Mais</span>
          </div>
        </div>
      </div>
    </>
  );
}

function Leitura({ dia }: { dia: MinutosDiaDTO | undefined }) {
  return (
    <p className={estilos.leitura}>
      {dia ? (
        <>
          <span>{formatarDiaCompleto(dia.data)}</span>
          <strong>{dia.minutos > 0 ? formatarDuracao(dia.minutos) : 'Sem estudo'}</strong>
        </>
      ) : (
        <span className={estilos.dicaLeitura}>Aponte para um dia para ver o tempo estudado</span>
      )}
    </p>
  );
}

export function MapaCalorEstudo({ resultado, hojeIso, meses, className }: MapaCalorEstudoProps) {
  const [focado, setFocado] = useState<string | null>(null);
  const dia = focado ? resultado.dados?.dias.find((item) => item.data === focado) : undefined;

  return (
    <Painel className={className} aria-labelledby="titulo-mapa">
      <CabecalhoPainel
        titulo={<span id="titulo-mapa">Estudo por dia</span>}
        descricao={`Minutos de estudo nos últimos ${meses} meses`}
        acao={resultado.dados ? <Leitura dia={dia} /> : null}
      />
      <ConteudoAssincrono resultado={resultado} tituloErro="Não foi possível carregar o mapa de estudo" esqueleto={<EsqueletoMapa />}>
        {(mapa) => <Mapa mapa={mapa} hojeIso={hojeIso} focado={focado} aoFocar={setFocado} />}
      </ConteudoAssincrono>
    </Painel>
  );
}
