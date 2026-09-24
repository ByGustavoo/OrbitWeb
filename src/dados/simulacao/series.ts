import type { RecorrenciaDTO } from '@/modelos/tarefas';
import { gerarDatasOcorrencias } from '@/regras/recorrencia';
import { adicionarDiasIso, adicionarMesesIso, dataIsoLocal } from '@/utilitarios/datas';
import { gerarId } from './bancoSimulado';
import type { BancoSimulado, SerieArmazenada, TarefaArmazenada } from './bancoSimulado';

const MESES_JANELA = 12;
const MESES_ANTECEDENCIA_EXTENSAO = 3;

function fimDaJanela(serie: SerieArmazenada, hojeIso: string): string {
  const janela = adicionarMesesIso(hojeIso, MESES_JANELA);
  const fim = serie.recorrencia.dataFim;
  return fim && fim < janela ? fim : janela;
}

function copiarOcorrencia(modelo: TarefaArmazenada, data: string, agora: Date): TarefaArmazenada {
  return {
    ...modelo,
    id: gerarId(),
    data,
    situacao: 'PENDENTE',
    dataConclusao: null,
    categoria: modelo.categoria ? { ...modelo.categoria } : null,
    atividade: modelo.atividade ? { ...modelo.atividade } : null,
    recorrencia: modelo.recorrencia ? { ...modelo.recorrencia, diasSemana: modelo.recorrencia.diasSemana ? [...modelo.recorrencia.diasSemana] : null } : null,
    criadoEm: agora.toISOString(),
    atualizadoEm: agora.toISOString(),
  };
}

function gerarNaSerie(
  banco: BancoSimulado,
  serie: SerieArmazenada,
  modelo: TarefaArmazenada,
  de: string,
  ate: string,
  agora: Date,
  datasOcupadas: ReadonlySet<string> = new Set(),
): void {
  for (const data of gerarDatasOcorrencias(serie.recorrencia, serie.dataInicial, de, ate)) {
    if (datasOcupadas.has(data)) continue;
    banco.tarefas.push(copiarOcorrencia(modelo, data, agora));
  }
  if (ate > serie.geradaAte) serie.geradaAte = ate;
}

export function iniciarSerie(
  banco: BancoSimulado,
  primeira: TarefaArmazenada,
  recorrencia: RecorrenciaDTO,
  agora: Date,
  datasOcupadas?: ReadonlySet<string>,
): void {
  if (!primeira.data) return;
  const serie: SerieArmazenada = {
    id: gerarId(),
    dataInicial: primeira.data,
    recorrencia: { ...recorrencia },
    geradaAte: primeira.data,
  };
  banco.series.push(serie);
  primeira.serieId = serie.id;
  primeira.recorrencia = { ...recorrencia };
  gerarNaSerie(banco, serie, primeira, adicionarDiasIso(primeira.data, 1), fimDaJanela(serie, dataIsoLocal(agora)), agora, datasOcupadas);
}

export function ocorrenciasDaSerie(banco: BancoSimulado, serieId: number): TarefaArmazenada[] {
  return banco.tarefas.filter((tarefa) => tarefa.serieId === serieId);
}

export function encerrarSerieAntesDe(banco: BancoSimulado, serieId: number, data: string): void {
  const vespera = adicionarDiasIso(data, -1);
  const anteriores = ocorrenciasDaSerie(banco, serieId).filter((tarefa) => tarefa.data !== null && tarefa.data < data);
  const serie = banco.series.find((item) => item.id === serieId);

  if (anteriores.length === 0) {
    banco.series = banco.series.filter((item) => item.id !== serieId);
    return;
  }
  if (serie) {
    serie.recorrencia = { ...serie.recorrencia, dataFim: vespera };
    serie.geradaAte = vespera;
  }
  anteriores.forEach((tarefa) => {
    if (tarefa.recorrencia) tarefa.recorrencia = { ...tarefa.recorrencia, dataFim: vespera };
  });
}

export function estenderSeries(banco: BancoSimulado, agora: Date): boolean {
  const hojeIso = dataIsoLocal(agora);
  const limiteAntecedencia = adicionarMesesIso(hojeIso, MESES_ANTECEDENCIA_EXTENSAO);
  let alterou = false;

  for (const serie of [...banco.series]) {
    const alvo = fimDaJanela(serie, hojeIso);
    if (serie.geradaAte >= alvo || serie.geradaAte > limiteAntecedencia) continue;

    const ocorrencias = ocorrenciasDaSerie(banco, serie.id).sort((a, b) => (a.data ?? '').localeCompare(b.data ?? ''));
    const modelo = ocorrencias[ocorrencias.length - 1];
    if (!modelo) {
      banco.series = banco.series.filter((item) => item.id !== serie.id);
      alterou = true;
      continue;
    }
    gerarNaSerie(banco, serie, modelo, adicionarDiasIso(serie.geradaAte, 1), alvo, agora);
    alterou = true;
  }

  return alterou;
}
