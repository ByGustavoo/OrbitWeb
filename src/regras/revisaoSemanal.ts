import type { RevisaoSemanalDTO } from '@/modelos/revisao';
import { adicionarDiasIso, dataIsoLocal, deDataIso, ehDataIsoValida, inicioDaSemana } from '@/utilitarios/datas';
import { formatarDuracao, pluralizar } from '@/utilitarios/formatacao';

export interface FatoSemana {
  chave: string;
  texto: string;
}

export function inicioDaSemanaIso(iso: string): string {
  return dataIsoLocal(inicioDaSemana(deDataIso(iso)));
}

export function lerSemana(valor: string | null, hojeIso: string): string {
  const atual = inicioDaSemanaIso(hojeIso);
  if (!valor || !ehDataIsoValida(valor)) return atual;
  const semana = inicioDaSemanaIso(valor);
  return semana > atual ? atual : semana;
}

export function semanaSeguinte(inicioSemana: string): string {
  return adicionarDiasIso(inicioSemana, 7);
}

export function semanaAnterior(inicioSemana: string): string {
  return adicionarDiasIso(inicioSemana, -7);
}

export function compararComSemanaAnterior(atual: number, anterior: number, formatar: (valor: number) => string): string {
  const diferenca = atual - anterior;
  if (diferenca === 0) return 'Igual à semana anterior';
  return `${formatar(Math.abs(diferenca))} a ${diferenca > 0 ? 'mais' : 'menos'} que na semana anterior`;
}

export function compararTaxas(atual: number | null, anterior: number | null): string {
  if (anterior === null) return 'Sem tarefas planejadas na semana anterior';
  if (atual === null) return `Semana anterior: ${Math.round(anterior * 100)}%`;
  const pontos = Math.round(atual * 100) - Math.round(anterior * 100);
  if (pontos === 0) return 'Igual à semana anterior';
  return `${pluralizar(Math.abs(pontos), 'ponto', 'pontos')} a ${pontos > 0 ? 'mais' : 'menos'} que na semana anterior`;
}

export function semanaSemRegistros(revisao: RevisaoSemanalDTO): boolean {
  const { resumo, tarefas } = revisao;
  return (
    resumo.concluidas === 0 &&
    resumo.criadas === 0 &&
    resumo.sessoes === 0 &&
    tarefas.planejadas === 0 &&
    tarefas.canceladas === 0 &&
    tarefas.naoRealizadas === 0
  );
}

export function montarDestaques(revisao: RevisaoSemanalDTO): FatoSemana[] {
  const { resumo, estudos } = revisao;
  const destaques: FatoSemana[] = [];
  if (resumo.concluidas > 0) {
    destaques.push({ chave: 'concluidas', texto: pluralizar(resumo.concluidas, 'tarefa concluída', 'tarefas concluídas') });
  }
  if (resumo.minutosEstudo > 0) {
    destaques.push({
      chave: 'estudo',
      texto: `${formatarDuracao(resumo.minutosEstudo)} de estudo em ${pluralizar(resumo.sessoes, 'sessão', 'sessões')}`,
    });
  }
  const metasAtingidas = estudos.metas.filter((meta) => meta.minutosRealizados >= meta.metaMinutos).length;
  if (metasAtingidas > 0) {
    destaques.push({
      chave: 'metas',
      texto: metasAtingidas === 1 ? '1 meta de estudo atingida' : `${metasAtingidas} metas de estudo atingidas`,
    });
  }
  if (resumo.diasComAtividade > 0) {
    destaques.push({
      chave: 'dias',
      texto: resumo.diasComAtividade === 1 ? '1 dia com atividades registradas' : `${resumo.diasComAtividade} dias com atividades registradas`,
    });
  }
  return destaques;
}

export function montarPontosDeAtencao(revisao: RevisaoSemanalDTO): FatoSemana[] {
  const { tarefas, resumo, estudos, diasDecorridos, emAndamento } = revisao;
  const pontos: FatoSemana[] = [];

  if (tarefas.atrasadas > 0) {
    pontos.push({
      chave: 'atrasadas',
      texto:
        tarefas.atrasadas === 1
          ? '1 tarefa planejada para a semana está atrasada.'
          : `${tarefas.atrasadas} tarefas planejadas para a semana estão atrasadas.`,
    });
  }
  if (tarefas.importantesPendentes > 0) {
    pontos.push({
      chave: 'importantes',
      texto:
        tarefas.importantesPendentes === 1
          ? '1 tarefa de prioridade alta ou urgente continua em aberto.'
          : `${tarefas.importantesPendentes} tarefas de prioridade alta ou urgente continuam em aberto.`,
    });
  }
  if (tarefas.naoRealizadas > 0) {
    pontos.push({
      chave: 'nao-realizadas',
      texto:
        tarefas.naoRealizadas === 1
          ? '1 ocorrência de tarefa recorrente não foi realizada.'
          : `${tarefas.naoRealizadas} ocorrências de tarefas recorrentes não foram realizadas.`,
    });
  }
  if (tarefas.concluidasComAtraso > 0) {
    pontos.push({
      chave: 'com-atraso',
      texto:
        tarefas.concluidasComAtraso === 1
          ? '1 tarefa foi concluída depois do prazo.'
          : `${tarefas.concluidasComAtraso} tarefas foram concluídas depois do prazo.`,
    });
  }
  if (diasDecorridos > 0 && resumo.diasComAtividade < diasDecorridos) {
    const periodo = emAndamento ? `dos ${diasDecorridos} dias até hoje` : `dos ${diasDecorridos} dias`;
    pontos.push({
      chave: 'dias',
      texto:
        diasDecorridos === 1
          ? 'Nenhuma atividade registrada hoje até agora.'
          : `Atividades registradas em ${resumo.diasComAtividade} ${periodo}.`,
    });
  }
  if (!emAndamento) {
    const naoAtingidas = estudos.metas.filter((meta) => meta.minutosRealizados < meta.metaMinutos).length;
    if (naoAtingidas > 0) {
      pontos.push({
        chave: 'metas',
        texto: naoAtingidas === 1 ? '1 meta de estudo não foi atingida.' : `${naoAtingidas} metas de estudo não foram atingidas.`,
      });
    }
  }
  return pontos;
}
