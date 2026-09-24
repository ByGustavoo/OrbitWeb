import { useEffect, useRef, useState } from 'react';
import { FilterX } from 'lucide-react';
import { Botao, CampoBusca, CampoSelecao, GrupoOpcoes, SeletorData } from '@/componentes/ui';
import type { OpcaoSelecao } from '@/componentes/ui';
import type { AreaHistorico } from '@/modelos/enumeracoes';
import type { PeriodoHistorico } from '@/modelos/historico';
import { PERIODOS_HISTORICO } from '@/modelos/historico';
import { rotuloAreaHistorico, rotuloPeriodoHistorico } from '@/modelos/rotulos';
import type { IntervaloDatas } from '@/regras/periodoHistorico';
import estilos from './BarraFiltrosHistorico.module.css';

export interface FiltrosTelaHistorico {
  area: AreaHistorico | null;
  periodo: PeriodoHistorico;
  intervalo: IntervaloDatas;
  busca: string;
}

export interface BarraFiltrosHistoricoProps {
  filtros: FiltrosTelaHistorico;
  temFiltros: boolean;
  aoMudarArea: (area: AreaHistorico | null) => void;
  aoMudarPeriodo: (periodo: PeriodoHistorico) => void;
  aoMudarIntervalo: (campo: keyof IntervaloDatas, data: string) => void;
  aoMudarBusca: (busca: string) => void;
  aoLimpar: () => void;
}

type OpcaoArea = 'TUDO' | AreaHistorico;

const ESPERA_BUSCA_MS = 300;

const opcoesArea: { valor: OpcaoArea; rotulo: string }[] = [
  { valor: 'TUDO', rotulo: 'Tudo' },
  { valor: 'TAREFAS', rotulo: rotuloAreaHistorico.TAREFAS },
  { valor: 'ESTUDOS', rotulo: rotuloAreaHistorico.ESTUDOS },
];

const opcoesPeriodo: OpcaoSelecao<PeriodoHistorico>[] = PERIODOS_HISTORICO.map((periodo) => ({
  valor: periodo,
  rotulo: rotuloPeriodoHistorico[periodo],
  descricao: periodo === 'PERSONALIZADO' ? 'Escolha as datas de início e fim' : undefined,
}));

export function BarraFiltrosHistorico({
  filtros,
  temFiltros,
  aoMudarArea,
  aoMudarPeriodo,
  aoMudarIntervalo,
  aoMudarBusca,
  aoLimpar,
}: BarraFiltrosHistoricoProps) {
  const [busca, setBusca] = useState(filtros.busca);
  const ultimaEnviada = useRef(filtros.busca);

  useEffect(() => {
    if (filtros.busca !== ultimaEnviada.current) {
      ultimaEnviada.current = filtros.busca;
      setBusca(filtros.busca);
    }
  }, [filtros.busca]);

  useEffect(() => {
    if (busca === ultimaEnviada.current) return;
    const temporizador = window.setTimeout(() => {
      ultimaEnviada.current = busca;
      aoMudarBusca(busca);
    }, ESPERA_BUSCA_MS);
    return () => window.clearTimeout(temporizador);
  }, [busca, aoMudarBusca]);

  const personalizado = filtros.periodo === 'PERSONALIZADO';

  return (
    <div className={estilos.barra} role="group" aria-label="Filtros do histórico">
      <div className={estilos.topo}>
        <GrupoOpcoes
          rotulo="Mostrar"
          opcoes={opcoesArea}
          valor={filtros.area ?? 'TUDO'}
          aoMudar={(valor) => aoMudarArea(valor === 'TUDO' ? null : valor)}
        />
        {temFiltros ? (
          <Botao variante="terciario" tamanho="sm" icone={FilterX} className={estilos.limpar} onClick={aoLimpar}>
            Limpar filtros
          </Botao>
        ) : null}
      </div>

      <div className={estilos.campos}>
        <CampoBusca
          className={estilos.busca}
          rotulo="Buscar no histórico"
          placeholder="Tarefa, categoria ou atividade"
          valor={busca}
          aoMudar={setBusca}
        />
        <CampoSelecao
          className={estilos.periodo}
          rotulo="Período"
          opcoes={opcoesPeriodo}
          valor={filtros.periodo}
          aoMudar={(periodo) => periodo && aoMudarPeriodo(periodo)}
        />
        {personalizado ? (
          <div className={estilos.intervalo} role="group" aria-label="Período personalizado">
            <SeletorData
              className={estilos.data}
              rotulo="De"
              valor={filtros.intervalo.dataInicial}
              permitirLimpar={false}
              aoMudar={(data) => data && aoMudarIntervalo('dataInicial', data)}
            />
            <SeletorData
              className={estilos.data}
              rotulo="Até"
              valor={filtros.intervalo.dataFinal}
              permitirLimpar={false}
              aoMudar={(data) => data && aoMudarIntervalo('dataFinal', data)}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
