import type { RequisicaoTransporte, RespostaTransporte } from '@/api/transporte';
import { PRIORIDADES } from '@/modelos/enumeracoes';
import type { ResumoDashboardDTO } from '@/modelos/painel';
import { calcularSequencia } from '@/regras/sequencia';
import { adicionarDiasIso, dataIsoLocal, inicioDaSemana, intervaloDeDias } from '@/utilitarios/datas';
import type { BancoSimulado } from '../bancoSimulado';
import { diaDoInstante, emAberto, tarefasComPrazo, texto } from '../consultas';
import { ok, requisicaoInvalida } from '../resposta';
import { minutosPorDia } from './estudos';
import { eventosRecentes } from './historico';

const LIMITE_EVENTOS = 6;

export function buscarResumo(banco: BancoSimulado, requisicao: RequisicaoTransporte, agora: Date): RespostaTransporte {
  const dataInicial = texto(requisicao.consulta, 'dataInicial');
  const dataFinal = texto(requisicao.consulta, 'dataFinal');
  if (!dataInicial || !dataFinal || dataInicial > dataFinal) return requisicaoInvalida('Informe um período válido.');

  const inicioSemana = dataIsoLocal(inicioDaSemana(agora));
  const fimSemana = adicionarDiasIso(inicioSemana, 6);
  const tarefas = tarefasComPrazo(banco, agora);
  const naSemana = (data: string | null) => data !== null && data >= inicioSemana && data <= fimSemana;

  const concluidasPorDia = new Map(intervaloDeDias(dataInicial, dataFinal).map((dia) => [dia, 0]));
  for (const tarefa of tarefas) {
    if (tarefa.situacao !== 'CONCLUIDA' || !tarefa.dataConclusao) continue;
    const dia = diaDoInstante(tarefa.dataConclusao);
    if (concluidasPorDia.has(dia)) concluidasPorDia.set(dia, (concluidasPorDia.get(dia) ?? 0) + 1);
  }

  const resposta: ResumoDashboardDTO = {
    dataInicial,
    dataFinal,
    contagens: {
      concluidas: tarefas.filter((tarefa) => tarefa.dataConclusao && naSemana(diaDoInstante(tarefa.dataConclusao))).length,
      pendentes: tarefas.filter((tarefa) => tarefa.situacao === 'PENDENTE' && tarefa.prazo === 'NO_PRAZO' && naSemana(tarefa.data)).length,
      emAndamento: tarefas.filter((tarefa) => tarefa.situacao === 'EM_ANDAMENTO' && tarefa.prazo === 'NO_PRAZO' && naSemana(tarefa.data)).length,
      atrasadas: tarefas.filter((tarefa) => tarefa.prazo === 'ATRASADA').length,
      urgentes: tarefas.filter((tarefa) => tarefa.prioridade === 'URGENTE' && emAberto(tarefa)).length,
    },
    concluidasPorDia: [...concluidasPorDia].map(([data, quantidade]) => ({ data, quantidade })),
    minutosEstudoPorDia: [...minutosPorDia(banco, dataInicial, dataFinal)].map(([data, minutos]) => ({ data, minutos })),
    distribuicaoPrioridade: PRIORIDADES.map((prioridade) => ({
      prioridade,
      quantidade: tarefas.filter((tarefa) => tarefa.prioridade === prioridade && emAberto(tarefa)).length,
    })),
    eventosRecentes: eventosRecentes(banco, agora, LIMITE_EVENTOS),
  };
  return ok(resposta);
}

export function buscarSequencia(banco: BancoSimulado, requisicao: RequisicaoTransporte, agora: Date): RespostaTransporte {
  const data = texto(requisicao.consulta, 'data') ?? dataIsoLocal(agora);
  const dias = new Set<string>();
  banco.sessoes.forEach((sessao) => dias.add(diaDoInstante(sessao.inicio)));
  banco.tarefas.forEach((tarefa) => {
    if (tarefa.situacao === 'CONCLUIDA' && tarefa.dataConclusao) dias.add(diaDoInstante(tarefa.dataConclusao));
  });
  return ok(calcularSequencia(dias, data));
}
