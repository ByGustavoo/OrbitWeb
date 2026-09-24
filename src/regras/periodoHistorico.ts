import type { PeriodoHistorico } from '@/modelos/historico';
import { adicionarDiasIso } from '@/utilitarios/datas';

export interface IntervaloDatas {
  dataInicial: string;
  dataFinal: string;
}

export const PERIODO_PADRAO_HISTORICO: PeriodoHistorico = 'ULTIMOS_7_DIAS';

export function intervaloDoPeriodo(periodo: PeriodoHistorico, hojeIso: string, personalizado?: Partial<IntervaloDatas>): IntervaloDatas {
  switch (periodo) {
    case 'HOJE':
      return { dataInicial: hojeIso, dataFinal: hojeIso };
    case 'ONTEM': {
      const ontem = adicionarDiasIso(hojeIso, -1);
      return { dataInicial: ontem, dataFinal: ontem };
    }
    case 'ULTIMOS_30_DIAS':
      return { dataInicial: adicionarDiasIso(hojeIso, -29), dataFinal: hojeIso };
    case 'ESTE_MES':
      return { dataInicial: `${hojeIso.slice(0, 7)}-01`, dataFinal: hojeIso };
    case 'PERSONALIZADO': {
      const padrao = intervaloDoPeriodo(PERIODO_PADRAO_HISTORICO, hojeIso);
      return ajustarIntervalo(
        { dataInicial: personalizado?.dataInicial ?? padrao.dataInicial, dataFinal: personalizado?.dataFinal ?? padrao.dataFinal },
        'dataInicial',
      );
    }
    case 'ULTIMOS_7_DIAS':
    default:
      return { dataInicial: adicionarDiasIso(hojeIso, -6), dataFinal: hojeIso };
  }
}

export function ajustarIntervalo(intervalo: IntervaloDatas, alterado: keyof IntervaloDatas): IntervaloDatas {
  if (intervalo.dataInicial <= intervalo.dataFinal) return intervalo;
  return alterado === 'dataInicial'
    ? { dataInicial: intervalo.dataInicial, dataFinal: intervalo.dataInicial }
    : { dataInicial: intervalo.dataFinal, dataFinal: intervalo.dataFinal };
}
