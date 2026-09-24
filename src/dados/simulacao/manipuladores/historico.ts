import type { RequisicaoTransporte, RespostaTransporte } from '@/api/transporte';
import type { PaginaDTO } from '@/modelos/comum';
import type { AreaHistorico } from '@/modelos/enumeracoes';
import { AREAS_HISTORICO } from '@/modelos/enumeracoes';
import type { DetalheHistoricoDTO, RegistroHistoricoDTO } from '@/modelos/historico';
import type { EventoRecenteDTO } from '@/modelos/painel';
import type { TarefaDTO } from '@/modelos/tarefas';
import { deDataIso, ehDataIsoValida } from '@/utilitarios/datas';
import type { BancoSimulado, EventoArmazenado, SessaoArmazenada } from '../bancoSimulado';
import { diaDoInstante, numero, tarefasComPrazo, texto } from '../consultas';
import { naoEncontrado, ok, requisicaoInvalida } from '../resposta';
import { paraDTO } from './estudos';

const PREFIXO_EVENTO = 'evento-';
const PREFIXO_SESSAO = 'sessao-';
const PREFIXO_NAO_REALIZADA = 'nao-realizada-';
const TAMANHO_MAXIMO = 100;

function resumoCategoria(tarefa: TarefaDTO | undefined): RegistroHistoricoDTO['categoria'] {
  return tarefa?.categoria ? { ...tarefa.categoria } : null;
}

function registroDoEvento(evento: EventoArmazenado, tarefa: TarefaDTO | undefined): RegistroHistoricoDTO {
  const alterou = evento.tipo === 'PRIORIDADE_ALTERADA' || evento.tipo === 'DATA_ALTERADA' || evento.tipo === 'TAREFA_REABERTA';
  return {
    id: `${PREFIXO_EVENTO}${evento.id}`,
    tipo: evento.tipo,
    area: 'TAREFAS',
    ocorridoEm: evento.ocorridoEm,
    comHorario: true,
    titulo: evento.titulo,
    tarefaId: evento.tarefaId,
    sessaoId: null,
    categoria: resumoCategoria(tarefa),
    atividade: null,
    alteracao: alterou ? { anterior: evento.anterior, novo: evento.novo } : null,
    duracaoSegundos: null,
  };
}

function registroDaSessao(banco: BancoSimulado, sessao: SessaoArmazenada): RegistroHistoricoDTO {
  const { atividade, tarefa } = paraDTO(banco, sessao);
  return {
    id: `${PREFIXO_SESSAO}${sessao.id}`,
    tipo: 'SESSAO_ESTUDO',
    area: 'ESTUDOS',
    ocorridoEm: sessao.inicio,
    comHorario: true,
    titulo: atividade.nome,
    tarefaId: tarefa?.id ?? null,
    sessaoId: sessao.id,
    categoria: null,
    atividade,
    alteracao: null,
    duracaoSegundos: sessao.duracaoSegundos,
  };
}

function instanteDaOcorrencia(tarefa: TarefaDTO): { ocorridoEm: string; comHorario: boolean } {
  const dia = deDataIso(tarefa.data ?? '1970-01-01');
  const horario = tarefa.diaInteiro ? null : tarefa.horarioInicio;
  const [horas = 23, minutos = 59] = (horario ?? '23:59').split(':').map(Number);
  const instante = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate(), horas, minutos);
  return { ocorridoEm: instante.toISOString(), comHorario: horario !== null };
}

function registroNaoRealizada(tarefa: TarefaDTO): RegistroHistoricoDTO {
  return {
    id: `${PREFIXO_NAO_REALIZADA}${tarefa.id}`,
    tipo: 'TAREFA_NAO_REALIZADA',
    area: 'TAREFAS',
    ...instanteDaOcorrencia(tarefa),
    titulo: tarefa.titulo,
    tarefaId: tarefa.id,
    sessaoId: null,
    categoria: resumoCategoria(tarefa),
    atividade: null,
    alteracao: null,
    duracaoSegundos: null,
  };
}

function compararRegistros(a: RegistroHistoricoDTO, b: RegistroHistoricoDTO): number {
  if (a.ocorridoEm !== b.ocorridoEm) return b.ocorridoEm.localeCompare(a.ocorridoEm);
  return b.id.localeCompare(a.id, 'pt-BR', { numeric: true });
}

export function montarLinhaDoTempo(banco: BancoSimulado, agora: Date): RegistroHistoricoDTO[] {
  const tarefas = tarefasComPrazo(banco, agora);
  const porId = new Map(tarefas.map((tarefa) => [tarefa.id, tarefa]));
  const limite = agora.toISOString();

  const registros = [
    ...banco.eventos.filter((evento) => evento.ocorridoEm <= limite).map((evento) => registroDoEvento(evento, porId.get(evento.tarefaId))),
    ...banco.sessoes.map((sessao) => registroDaSessao(banco, sessao)),
    ...tarefas.filter((tarefa) => tarefa.prazo === 'NAO_REALIZADA').map(registroNaoRealizada),
  ];
  return registros.sort(compararRegistros);
}

function contemBusca(registro: RegistroHistoricoDTO, busca: string): boolean {
  const alvo = [registro.titulo, registro.categoria?.nome, registro.atividade?.nome].filter(Boolean).join(' ');
  return alvo.toLocaleLowerCase('pt-BR').includes(busca);
}

export function listarHistorico(banco: BancoSimulado, requisicao: RequisicaoTransporte, agora: Date): RespostaTransporte {
  const { consulta } = requisicao;
  const dataInicial = texto(consulta, 'dataInicial');
  const dataFinal = texto(consulta, 'dataFinal');
  if (!dataInicial || !dataFinal || !ehDataIsoValida(dataInicial) || !ehDataIsoValida(dataFinal)) {
    return requisicaoInvalida('Informe dataInicial e dataFinal no formato AAAA-MM-DD.');
  }
  if (dataInicial > dataFinal) return requisicaoInvalida('A data inicial precisa ser antes da final.');

  const areaInformada = texto(consulta, 'area');
  const area = AREAS_HISTORICO.includes(areaInformada as AreaHistorico) ? (areaInformada as AreaHistorico) : undefined;
  const busca = texto(consulta, 'busca')?.trim().toLocaleLowerCase('pt-BR');
  const pagina = Math.max(0, numero(consulta, 'pagina', 0));
  const tamanho = Math.min(TAMANHO_MAXIMO, Math.max(1, numero(consulta, 'tamanho', 30)));

  const filtrados = montarLinhaDoTempo(banco, agora).filter((registro) => {
    const dia = diaDoInstante(registro.ocorridoEm);
    if (dia < dataInicial || dia > dataFinal) return false;
    if (area && registro.area !== area) return false;
    if (busca && !contemBusca(registro, busca)) return false;
    return true;
  });

  const resposta: PaginaDTO<RegistroHistoricoDTO> = {
    itens: filtrados.slice(pagina * tamanho, (pagina + 1) * tamanho),
    pagina,
    tamanho,
    totalItens: filtrados.length,
    totalPaginas: Math.ceil(filtrados.length / tamanho),
  };
  return ok(resposta);
}

export function buscarDetalheHistorico(
  banco: BancoSimulado,
  _requisicao: RequisicaoTransporte,
  agora: Date,
  _numero: number,
  identificador: string,
): RespostaTransporte {
  const registro = montarLinhaDoTempo(banco, agora).find((item) => item.id === identificador);
  if (!registro) return naoEncontrado('Este registro não existe mais. A tarefa ou a sessão pode ter sido excluída.');

  const tarefa = registro.tarefaId === null ? null : tarefasComPrazo(banco, agora).find((item) => item.id === registro.tarefaId) ?? null;
  const sessaoArmazenada = registro.sessaoId === null ? undefined : banco.sessoes.find((item) => item.id === registro.sessaoId);
  const resposta: DetalheHistoricoDTO = {
    registro,
    tarefa,
    sessao: sessaoArmazenada ? paraDTO(banco, sessaoArmazenada) : null,
  };
  return ok(resposta);
}

const TIPOS_RECENTES: Partial<Record<RegistroHistoricoDTO['tipo'], EventoRecenteDTO['tipo']>> = {
  TAREFA_CRIADA: 'TAREFA_CRIADA',
  TAREFA_CONCLUIDA: 'TAREFA_CONCLUIDA',
  TAREFA_CANCELADA: 'TAREFA_CANCELADA',
  TAREFA_REABERTA: 'TAREFA_REABERTA',
  SESSAO_ESTUDO: 'SESSAO_SALVA',
};

export function eventosRecentes(banco: BancoSimulado, agora: Date, limite: number): EventoRecenteDTO[] {
  const recentes: EventoRecenteDTO[] = [];
  for (const registro of montarLinhaDoTempo(banco, agora)) {
    const tipo = TIPOS_RECENTES[registro.tipo];
    if (!tipo) continue;
    recentes.push({
      tipo,
      descricao: registro.titulo,
      ocorridoEm: registro.ocorridoEm,
      referenciaId: registro.sessaoId ?? registro.tarefaId ?? 0,
    });
    if (recentes.length === limite) break;
  }
  return recentes;
}
