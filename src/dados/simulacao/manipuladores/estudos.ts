import type { RequisicaoTransporte, RespostaTransporte } from '@/api/transporte';
import type { MapaCalorDTO, ProgressoMetaDTO } from '@/modelos/estudos';
import { adicionarDiasIso, intervaloDeDias } from '@/utilitarios/datas';
import type { BancoSimulado } from '../bancoSimulado';
import { diaDoInstante, minutosDaSessao, texto } from '../consultas';
import { ok, requisicaoInvalida } from '../resposta';

export function minutosPorDia(banco: BancoSimulado, dataInicial: string, dataFinal: string): Map<string, number> {
  const minutos = new Map(intervaloDeDias(dataInicial, dataFinal).map((dia) => [dia, 0]));
  for (const sessao of banco.sessoes) {
    const dia = diaDoInstante(sessao.inicio);
    if (minutos.has(dia)) minutos.set(dia, (minutos.get(dia) ?? 0) + minutosDaSessao(sessao));
  }
  return minutos;
}

export function minutosPorAtividade(banco: BancoSimulado, dataInicial: string, dataFinal: string) {
  const totais = new Map<number, number>();
  for (const sessao of banco.sessoes) {
    const dia = diaDoInstante(sessao.inicio);
    if (dia < dataInicial || dia > dataFinal) continue;
    totais.set(sessao.atividadeId, (totais.get(sessao.atividadeId) ?? 0) + minutosDaSessao(sessao));
  }
  return banco.atividades
    .filter((atividade) => (totais.get(atividade.id) ?? 0) > 0)
    .map((atividade) => ({
      atividade: { id: atividade.id, nome: atividade.nome, cor: atividade.cor },
      minutos: totais.get(atividade.id) ?? 0,
    }))
    .sort((a, b) => b.minutos - a.minutos);
}

export function buscarMapaCalor(banco: BancoSimulado, requisicao: RequisicaoTransporte): RespostaTransporte {
  const dataInicial = texto(requisicao.consulta, 'dataInicial');
  const dataFinal = texto(requisicao.consulta, 'dataFinal');
  if (!dataInicial || !dataFinal) return requisicaoInvalida('Informe dataInicial e dataFinal.');

  const [maisEstudada] = minutosPorAtividade(banco, dataInicial, dataFinal);
  const resposta: MapaCalorDTO = {
    dias: [...minutosPorDia(banco, dataInicial, dataFinal)].map(([data, minutos]) => ({ data, minutos })),
    atividadeMaisEstudada: maisEstudada ? { ...maisEstudada.atividade, minutos: maisEstudada.minutos } : null,
  };
  return ok(resposta);
}

export function buscarProgressoSemanal(banco: BancoSimulado, requisicao: RequisicaoTransporte): RespostaTransporte {
  const inicioSemana = texto(requisicao.consulta, 'inicioSemana');
  if (!inicioSemana) return requisicaoInvalida('Informe inicioSemana.');

  const realizados = new Map(
    minutosPorAtividade(banco, inicioSemana, adicionarDiasIso(inicioSemana, 6)).map((item) => [item.atividade.id, item.minutos]),
  );
  const resposta: ProgressoMetaDTO[] = banco.atividades
    .filter((atividade) => !atividade.arquivada && atividade.metaSemanalMinutos !== null)
    .map((atividade) => ({
      atividade: { id: atividade.id, nome: atividade.nome, cor: atividade.cor },
      metaMinutos: atividade.metaSemanalMinutos ?? 0,
      minutosRealizados: realizados.get(atividade.id) ?? 0,
    }));
  return ok(resposta);
}
