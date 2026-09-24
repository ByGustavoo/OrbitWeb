import type { CategoriaDTO } from '@/modelos/comum';
import type { Prioridade, Situacao } from '@/modelos/enumeracoes';
import type { EventoRecenteDTO } from '@/modelos/painel';
import type { RecorrenciaDTO } from '@/modelos/tarefas';
import { adicionarDias, dataIsoLocal } from '@/utilitarios/datas';
import type { AtividadeArmazenada, BancoSimulado, SessaoArmazenada, TarefaArmazenada } from './bancoSimulado';

function criarAleatorio(semente: number): () => number {
  let estado = semente;
  return () => {
    estado = (estado + 0x6d2b79f5) | 0;
    let valor = Math.imul(estado ^ (estado >>> 15), 1 | estado);
    valor = (valor + Math.imul(valor ^ (valor >>> 7), 61 | valor)) ^ valor;
    return ((valor ^ (valor >>> 14)) >>> 0) / 4294967296;
  };
}

function instante(dia: Date, horario: string): Date {
  const [horas = 0, minutos = 0] = horario.split(':').map(Number);
  return new Date(dia.getFullYear(), dia.getMonth(), dia.getDate(), horas, minutos);
}

function somarMinutos(horario: string, minutos: number): string {
  const [horas = 0, resto = 0] = horario.split(':').map(Number);
  const total = horas * 60 + resto + minutos;
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

const categorias: CategoriaDTO[] = [
  { id: 1, nome: 'Faculdade', cor: 'ROXO' },
  { id: 2, nome: 'Trabalho', cor: 'AZUL' },
  { id: 3, nome: 'Pessoal', cor: 'VERDE' },
  { id: 4, nome: 'Saúde', cor: 'ROSA' },
];

const atividades: AtividadeArmazenada[] = [
  { id: 1, nome: 'Banco de Dados', cor: 'AZUL', metaSemanalMinutos: 300, arquivada: false },
  { id: 2, nome: 'Java e Spring Boot', cor: 'LARANJA', metaSemanalMinutos: 360, arquivada: false },
  { id: 3, nome: 'Inglês', cor: 'VERDE', metaSemanalMinutos: 120, arquivada: false },
  { id: 4, nome: 'Algoritmos', cor: 'ROXO', metaSemanalMinutos: null, arquivada: false },
];

interface ModeloTarefa {
  titulo: string;
  dias: number;
  inicio?: string;
  duracao?: number;
  prioridade: Prioridade;
  situacao?: Situacao;
  categoriaId?: number;
  atividadeId?: number;
  concluidaHaMinutos?: number;
  criadaHaDias?: number;
}

const modelosFixos: ModeloTarefa[] = [
  { titulo: 'Estudar Java: coleções e streams', dias: 0, inicio: '08:00', duracao: 90, prioridade: 'ALTA', situacao: 'CONCLUIDA', categoriaId: 1, atividadeId: 2, concluidaHaMinutos: 25 },
  { titulo: 'Reunião do projeto Orbit', dias: 0, inicio: '10:30', duracao: 60, prioridade: 'MEDIA', situacao: 'EM_ANDAMENTO', categoriaId: 2 },
  { titulo: 'Revisar a documentação da API', dias: 0, inicio: '14:00', duracao: 60, prioridade: 'BAIXA', categoriaId: 2, criadaHaDias: 0 },
  { titulo: 'Entregar o trabalho de Banco de Dados', dias: 0, inicio: '16:30', duracao: 30, prioridade: 'URGENTE', categoriaId: 1, atividadeId: 1 },
  { titulo: 'Pagar a conta de luz', dias: 0, prioridade: 'ALTA', categoriaId: 3 },
  { titulo: 'Enviar o relatório semanal', dias: -2, inicio: '17:00', duracao: 60, prioridade: 'ALTA', categoriaId: 2 },
  { titulo: 'Marcar consulta no dentista', dias: -3, prioridade: 'BAIXA', categoriaId: 4 },
  { titulo: 'Prova de Banco de Dados', dias: 1, inicio: '09:00', duracao: 120, prioridade: 'URGENTE', categoriaId: 1, atividadeId: 1 },
  { titulo: 'Code review do módulo de tarefas', dias: 1, inicio: '15:00', duracao: 45, prioridade: 'MEDIA', categoriaId: 2, criadaHaDias: 0 },
  { titulo: 'Academia', dias: 2, inicio: '07:00', duracao: 60, prioridade: 'BAIXA', categoriaId: 4 },
  { titulo: 'Planejar a próxima semana', dias: 3, prioridade: 'MEDIA', categoriaId: 3 },
  { titulo: 'Apresentação do TCC', dias: 5, inicio: '19:30', duracao: 40, prioridade: 'ALTA', categoriaId: 1 },
  { titulo: 'Renovar a matrícula', dias: 9, prioridade: 'MEDIA', categoriaId: 1 },
];

const titulosHistorico = [
  'Resolver lista de exercícios de SQL',
  'Ler capítulo de Arquitetura Limpa',
  'Implementar o endpoint de tarefas',
  'Revisar pull request',
  'Estudar normalização',
  'Fazer compras do mês',
  'Atualizar o currículo',
  'Corrigir bug no formulário',
  'Assistir aula de Spring Security',
  'Escrever testes do serviço de sessões',
  'Organizar os arquivos da faculdade',
  'Responder e-mails pendentes',
];

const semTitulo: ModeloTarefa[] = [
  { titulo: 'Ler Código Limpo', dias: 0, prioridade: 'BAIXA', categoriaId: 3 },
  { titulo: 'Organizar a mesa de estudos', dias: 0, prioridade: 'BAIXA', categoriaId: 3 },
];

export const VERSAO_BANCO = 2;

export function gerarSementes(agora: Date): BancoSimulado {
  const aleatorio = criarAleatorio(20260922);
  const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
  const tarefas: TarefaArmazenada[] = [];
  const sessoes: SessaoArmazenada[] = [];
  let proximoId = 100;

  const escolher = <T,>(lista: readonly T[]): T => lista[Math.floor(aleatorio() * lista.length)] as T;

  const criarTarefa = (
    modelo: ModeloTarefa,
    extras: Partial<TarefaArmazenada> & { semData?: boolean } = {},
  ): TarefaArmazenada => {
    const dia = adicionarDias(hoje, modelo.dias);
    const criadaEm = adicionarDias(dia, -(modelo.criadaHaDias ?? 3));
    const situacao = modelo.situacao ?? 'PENDENTE';
    const categoria = categorias.find((item) => item.id === modelo.categoriaId) ?? null;
    const atividade = atividades.find((item) => item.id === modelo.atividadeId);
    const conclusao =
      situacao === 'CONCLUIDA'
        ? new Date(Math.max(agora.getTime() - (modelo.concluidaHaMinutos ?? 60) * 60000, hoje.getTime() + 60000))
        : null;
    const momentoCriacao =
      modelo.criadaHaDias !== undefined
        ? new Date(agora.getTime() - (modelo.criadaHaDias * 24 + 1 + aleatorio() * 5) * 3600000)
        : new Date(Math.min(instante(criadaEm, '09:15').getTime(), agora.getTime() - (3 + aleatorio() * 4) * 86400000));
    proximoId += 1;

    return {
      id: proximoId,
      titulo: modelo.titulo,
      descricao: null,
      data: extras.semData ? null : dataIsoLocal(dia),
      diaInteiro: !modelo.inicio,
      horarioInicio: modelo.inicio ?? null,
      horarioFim: modelo.inicio ? somarMinutos(modelo.inicio, modelo.duracao ?? 60) : null,
      prioridade: modelo.prioridade,
      situacao,
      categoria: categoria ? { ...categoria } : null,
      atividade: atividade ? { id: atividade.id, nome: atividade.nome, cor: atividade.cor } : null,
      lembreteMinutosAntes: null,
      serieId: null,
      recorrencia: null,
      dataConclusao: conclusao ? conclusao.toISOString() : null,
      criadoEm: momentoCriacao.toISOString(),
      atualizadoEm: (conclusao ?? momentoCriacao).toISOString(),
      ...extras,
    };
  };

  modelosFixos.forEach((modelo) => tarefas.push(criarTarefa(modelo)));
  semTitulo.forEach((modelo) => tarefas.push(criarTarefa(modelo, { semData: true })));

  const recorrencia: RecorrenciaDTO = { frequencia: 'DIARIA', diasSemana: null, dataFim: null };
  for (let dias = -6; dias <= 6; dias += 1) {
    const naoFeita = dias === -1 || dias === -4;
    const concluida = dias < 0 && !naoFeita;
    const dia = adicionarDias(hoje, dias);
    const tarefa = criarTarefa(
      { titulo: 'Revisar flashcards de inglês', dias, inicio: '21:00', duracao: 20, prioridade: 'MEDIA', categoriaId: 3, atividadeId: 3 },
      { serieId: 1, recorrencia },
    );
    if (concluida) {
      tarefa.situacao = 'CONCLUIDA';
      tarefa.dataConclusao = instante(dia, dias === -2 ? '22:10' : '21:15').toISOString();
      tarefa.atualizadoEm = tarefa.dataConclusao;
    }
    tarefas.push(tarefa);
  }

  const prioridades: Prioridade[] = ['BAIXA', 'MEDIA', 'MEDIA', 'ALTA', 'ALTA', 'URGENTE'];
  for (let dias = -45; dias <= -1; dias += 1) {
    const dia = adicionarDias(hoje, dias);
    const fimDeSemana = dia.getDay() === 0 || dia.getDay() === 6;
    const quantidade = Math.floor(aleatorio() * (fimDeSemana ? 2 : 5));
    for (let indice = 0; indice < quantidade; indice += 1) {
      const inicio = `${String(8 + Math.floor(aleatorio() * 10)).padStart(2, '0')}:${aleatorio() > 0.5 ? '30' : '00'}`;
      const tarefa = criarTarefa({
        titulo: escolher(titulosHistorico),
        dias,
        inicio,
        duracao: 60,
        prioridade: escolher(prioridades),
        categoriaId: 1 + Math.floor(aleatorio() * 4),
      });
      const cancelada = aleatorio() < 0.06;
      const atraso = aleatorio() < 0.18 ? 60 * 24 : 0;
      tarefa.situacao = cancelada ? 'CANCELADA' : 'CONCLUIDA';
      tarefa.dataConclusao = cancelada ? null : new Date(instante(dia, inicio).getTime() + (40 + atraso) * 60000).toISOString();
      tarefa.atualizadoEm = tarefa.dataConclusao ?? tarefa.criadoEm;
      tarefas.push(tarefa);
    }
  }

  const pesosAtividades = [1, 1, 1, 2, 2, 2, 3, 4];
  for (let dias = -200; dias <= -1; dias += 1) {
    const dia = adicionarDias(hoje, dias);
    const fimDeSemana = dia.getDay() === 0 || dia.getDay() === 6;
    const recente = dias >= -8;
    const lacuna = dias === -9;
    const chance = recente ? 1 : fimDeSemana ? 0.35 : 0.72;
    if (lacuna || aleatorio() > chance) continue;

    const quantidade = 1 + Math.floor(aleatorio() * 3);
    let horario = fimDeSemana ? '10:00' : '19:00';
    for (let indice = 0; indice < quantidade; indice += 1) {
      const minutos = 20 + Math.floor(aleatorio() * 8) * 10;
      const inicio = instante(dia, horario);
      const fim = new Date(inicio.getTime() + minutos * 60000);
      proximoId += 1;
      sessoes.push({
        id: proximoId,
        atividadeId: escolher(pesosAtividades),
        tarefaId: null,
        modo: aleatorio() > 0.5 ? 'POMODORO' : 'LIVRE',
        origem: aleatorio() > 0.85 ? 'MANUAL' : 'CRONOMETRO',
        inicio: inicio.toISOString(),
        fim: fim.toISOString(),
        duracaoSegundos: minutos * 60,
      });
      horario = somarMinutos(horario, minutos + 15);
    }
  }

  const limiteEventos = agora.getTime() - 4 * 86400000;
  const eventos: EventoRecenteDTO[] = [];
  for (const tarefa of tarefas) {
    if (tarefa.dataConclusao && new Date(tarefa.dataConclusao).getTime() >= limiteEventos) {
      eventos.push({ tipo: 'TAREFA_CONCLUIDA', descricao: tarefa.titulo, ocorridoEm: tarefa.dataConclusao, referenciaId: tarefa.id });
    }
    if (new Date(tarefa.criadoEm).getTime() >= agora.getTime() - 86400000 * 1.5) {
      eventos.push({ tipo: 'TAREFA_CRIADA', descricao: tarefa.titulo, ocorridoEm: tarefa.criadoEm, referenciaId: tarefa.id });
    }
  }
  for (const sessao of sessoes) {
    if (new Date(sessao.fim).getTime() < limiteEventos) continue;
    const atividade = atividades.find((item) => item.id === sessao.atividadeId);
    eventos.push({ tipo: 'SESSAO_SALVA', descricao: atividade?.nome ?? 'Estudo', ocorridoEm: sessao.fim, referenciaId: sessao.id });
  }
  const cancelada = tarefas.find((tarefa) => tarefa.situacao === 'CANCELADA');
  if (cancelada) {
    eventos.push({
      tipo: 'TAREFA_CANCELADA',
      descricao: cancelada.titulo,
      ocorridoEm: new Date(agora.getTime() - 26 * 3600000).toISOString(),
      referenciaId: cancelada.id,
    });
  }

  return {
    versao: VERSAO_BANCO,
    proximoId,
    categorias: categorias.map((categoria) => ({ ...categoria })),
    atividades: atividades.map((atividade) => ({ ...atividade })),
    tarefas,
    sessoes,
    eventos,
  };
}
