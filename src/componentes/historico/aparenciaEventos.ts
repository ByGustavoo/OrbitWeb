import { CalendarClock, CalendarX, CircleCheck, CirclePlus, CircleSlash, Flag, RotateCcw, Timer } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Prioridade, Situacao, TipoEventoHistorico } from '@/modelos/enumeracoes';
import { PRIORIDADES, SITUACOES } from '@/modelos/enumeracoes';
import type { RegistroHistoricoDTO } from '@/modelos/historico';
import { rotuloPrioridade, rotuloSituacao } from '@/modelos/rotulos';
import { formatarDiaMesCurto } from '@/utilitarios/formatacao';

export type TomEvento = 'sucesso' | 'destaque' | 'neutro' | 'aviso' | 'erro' | 'info';

export const aparenciaEvento: Record<TipoEventoHistorico, { icone: LucideIcon; tom: TomEvento }> = {
  TAREFA_CRIADA: { icone: CirclePlus, tom: 'destaque' },
  TAREFA_CONCLUIDA: { icone: CircleCheck, tom: 'sucesso' },
  TAREFA_CANCELADA: { icone: CircleSlash, tom: 'neutro' },
  TAREFA_REABERTA: { icone: RotateCcw, tom: 'aviso' },
  TAREFA_NAO_REALIZADA: { icone: CalendarX, tom: 'erro' },
  PRIORIDADE_ALTERADA: { icone: Flag, tom: 'neutro' },
  DATA_ALTERADA: { icone: CalendarClock, tom: 'neutro' },
  SESSAO_ESTUDO: { icone: Timer, tom: 'info' },
};

function ehPrioridade(valor: string | null): valor is Prioridade {
  return PRIORIDADES.includes(valor as Prioridade);
}

function ehSituacao(valor: string | null): valor is Situacao {
  return SITUACOES.includes(valor as Situacao);
}

export function rotuloValorAlterado(tipo: TipoEventoHistorico, valor: string | null): string {
  if (tipo === 'PRIORIDADE_ALTERADA') return ehPrioridade(valor) ? rotuloPrioridade[valor] : 'Sem prioridade';
  if (tipo === 'TAREFA_REABERTA') return ehSituacao(valor) ? rotuloSituacao[valor] : 'Sem situação';
  if (tipo === 'DATA_ALTERADA') return valor ? formatarDiaMesCurto(valor) : 'Sem data';
  return valor ?? '';
}

export interface AlteracaoDescrita {
  anterior: string;
  novo: string;
}

export function descreverAlteracao(registro: RegistroHistoricoDTO): AlteracaoDescrita | null {
  if (!registro.alteracao) return null;
  return {
    anterior: rotuloValorAlterado(registro.tipo, registro.alteracao.anterior),
    novo: rotuloValorAlterado(registro.tipo, registro.alteracao.novo),
  };
}
