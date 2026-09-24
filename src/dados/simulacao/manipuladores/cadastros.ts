import type { RequisicaoTransporte, RespostaTransporte } from '@/api/transporte';
import type { ErroCampoDTO } from '@/modelos/comum';
import type { AtividadeEnvioDTO, AtividadeEstudoDTO } from '@/modelos/estudos';
import { buscarNomeRepetido, normalizarAtividade, validarAtividade } from '@/regras/validacaoAtividade';
import { gerarId, salvarBanco } from '../bancoSimulado';
import type { AtividadeArmazenada, BancoSimulado } from '../bancoSimulado';
import { conflito, criado, dadosInvalidos, naoEncontrado, ok, requisicaoInvalida, semConteudo } from '../resposta';

export function listarCategorias(banco: BancoSimulado): RespostaTransporte {
  return ok([...banco.categorias].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')));
}

export function listarAtividades(banco: BancoSimulado): RespostaTransporte {
  const atividades: AtividadeEstudoDTO[] = [...banco.atividades]
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
    .map((atividade) => ({ ...atividade }));
  return ok(atividades);
}

function lerEnvioAtividade(banco: BancoSimulado, corpo: unknown, idAtual: number | null): AtividadeEnvioDTO | RespostaTransporte {
  if (!corpo || typeof corpo !== 'object' || typeof (corpo as AtividadeEnvioDTO).nome !== 'string') {
    return requisicaoInvalida('Envie os dados da atividade.');
  }
  const dados = normalizarAtividade(corpo as AtividadeEnvioDTO);
  const erros = validarAtividade(dados, banco.atividades, idAtual);
  const { nome: erroNome, ...outros } = erros;
  const errosCampos: ErroCampoDTO[] = Object.entries(outros).map(([campo, mensagem]) => ({ campo, mensagem: mensagem ?? '' }));

  if (erroNome && buscarNomeRepetido(dados.nome, banco.atividades, idAtual)) {
    return conflito(erroNome, [{ campo: 'nome', mensagem: erroNome }, ...errosCampos]);
  }
  if (erroNome) errosCampos.unshift({ campo: 'nome', mensagem: erroNome });
  if (errosCampos.length > 0) return dadosInvalidos(errosCampos);
  return dados;
}

function ehResposta(valor: AtividadeEnvioDTO | RespostaTransporte): valor is RespostaTransporte {
  return 'status' in valor;
}

function propagarResumo(banco: BancoSimulado, atividade: AtividadeArmazenada): void {
  const resumo = { id: atividade.id, nome: atividade.nome, cor: atividade.cor };
  banco.tarefas.forEach((tarefa) => {
    if (tarefa.atividade?.id === atividade.id) tarefa.atividade = { ...resumo };
  });
}

export function criarAtividade(banco: BancoSimulado, requisicao: RequisicaoTransporte): RespostaTransporte {
  const dados = lerEnvioAtividade(banco, requisicao.corpo, null);
  if (ehResposta(dados)) return dados;

  const atividade: AtividadeArmazenada = { id: gerarId(), ...dados, arquivada: false };
  banco.atividades.push(atividade);
  salvarBanco();
  return criado({ ...atividade });
}

export function atualizarAtividade(banco: BancoSimulado, requisicao: RequisicaoTransporte, _agora: Date, id: number): RespostaTransporte {
  const atividade = banco.atividades.find((item) => item.id === id);
  if (!atividade) return naoEncontrado('Esta atividade não existe mais.');

  const dados = lerEnvioAtividade(banco, requisicao.corpo, id);
  if (ehResposta(dados)) return dados;

  Object.assign(atividade, dados);
  propagarResumo(banco, atividade);
  salvarBanco();
  return ok({ ...atividade });
}

export function alterarArquivamento(banco: BancoSimulado, requisicao: RequisicaoTransporte, _agora: Date, id: number): RespostaTransporte {
  const atividade = banco.atividades.find((item) => item.id === id);
  if (!atividade) return naoEncontrado('Esta atividade não existe mais.');

  const arquivada = (requisicao.corpo as { arquivada?: unknown } | undefined)?.arquivada;
  if (typeof arquivada !== 'boolean') return requisicaoInvalida('Informe se a atividade fica arquivada.');

  if (!arquivada && buscarNomeRepetido(atividade.nome, banco.atividades, id)) {
    return conflito(`Já existe uma atividade ativa chamada “${atividade.nome}”. Renomeie uma delas antes de desarquivar.`);
  }

  atividade.arquivada = arquivada;
  salvarBanco();
  return ok({ ...atividade });
}

export function excluirAtividade(banco: BancoSimulado, _requisicao: RequisicaoTransporte, _agora: Date, id: number): RespostaTransporte {
  const atividade = banco.atividades.find((item) => item.id === id);
  if (!atividade) return naoEncontrado('Esta atividade não existe mais.');

  if (banco.sessoes.some((sessao) => sessao.atividadeId === id)) {
    return conflito('Esta atividade tem sessões registradas. Arquive-a para manter o histórico.');
  }

  banco.atividades = banco.atividades.filter((item) => item.id !== id);
  banco.tarefas.forEach((tarefa) => {
    if (tarefa.atividade?.id === id) tarefa.atividade = null;
  });
  salvarBanco();
  return semConteudo();
}
