import type { RequisicaoTransporte, RespostaTransporte } from '@/api/transporte';
import type { CategoriaDTO, CategoriaEnvioDTO, ErroCampoDTO } from '@/modelos/comum';
import type { AtividadeEnvioDTO, AtividadeEstudoDTO } from '@/modelos/estudos';
import { buscarNomeRepetido, normalizarAtividade, validarAtividade } from '@/regras/validacaoAtividade';
import { buscarCategoriaComMesmoNome, normalizarCategoria, validarCategoria } from '@/regras/validacaoCategoria';
import { gerarId, salvarBanco } from '../bancoSimulado';
import type { AtividadeArmazenada, BancoSimulado, CategoriaArmazenada } from '../bancoSimulado';
import { conflito, criado, dadosInvalidos, naoEncontrado, ok, requisicaoInvalida, semConteudo } from '../resposta';

function categoriaParaDTO(banco: BancoSimulado, categoria: CategoriaArmazenada): CategoriaDTO {
  const quantidadeTarefas = banco.tarefas.filter((tarefa) => tarefa.categoria?.id === categoria.id).length;
  return { id: categoria.id, nome: categoria.nome, cor: categoria.cor, quantidadeTarefas };
}

export function listarCategorias(banco: BancoSimulado): RespostaTransporte {
  const categorias = [...banco.categorias]
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
    .map((categoria) => categoriaParaDTO(banco, categoria));
  return ok(categorias);
}

function lerEnvioCategoria(banco: BancoSimulado, corpo: unknown, idAtual: number | null): CategoriaEnvioDTO | RespostaTransporte {
  if (!corpo || typeof corpo !== 'object' || typeof (corpo as CategoriaEnvioDTO).nome !== 'string') {
    return requisicaoInvalida('Envie os dados da categoria.');
  }
  const dados = normalizarCategoria({ nome: (corpo as CategoriaEnvioDTO).nome, cor: (corpo as CategoriaEnvioDTO).cor });
  const erros = validarCategoria(dados, banco.categorias, idAtual);
  const errosCampos: ErroCampoDTO[] = Object.entries(erros).map(([campo, mensagem]) => ({ campo, mensagem: mensagem ?? '' }));

  if (erros.nome && buscarCategoriaComMesmoNome(dados.nome, banco.categorias, idAtual)) {
    return conflito(erros.nome, errosCampos);
  }
  if (errosCampos.length > 0) return dadosInvalidos(errosCampos);
  return dados;
}

function ehRespostaCategoria(valor: CategoriaEnvioDTO | RespostaTransporte): valor is RespostaTransporte {
  return 'status' in valor;
}

export function criarCategoria(banco: BancoSimulado, requisicao: RequisicaoTransporte): RespostaTransporte {
  const dados = lerEnvioCategoria(banco, requisicao.corpo, null);
  if (ehRespostaCategoria(dados)) return dados;

  const categoria: CategoriaArmazenada = { id: gerarId(), ...dados };
  banco.categorias.push(categoria);
  salvarBanco();
  return criado(categoriaParaDTO(banco, categoria));
}

export function atualizarCategoria(banco: BancoSimulado, requisicao: RequisicaoTransporte, _agora: Date, id: number): RespostaTransporte {
  const categoria = banco.categorias.find((item) => item.id === id);
  if (!categoria) return naoEncontrado('Esta categoria não existe mais.');

  const dados = lerEnvioCategoria(banco, requisicao.corpo, id);
  if (ehRespostaCategoria(dados)) return dados;

  Object.assign(categoria, dados);
  banco.tarefas.forEach((tarefa) => {
    if (tarefa.categoria?.id === id) tarefa.categoria = { id, nome: categoria.nome, cor: categoria.cor };
  });
  salvarBanco();
  return ok(categoriaParaDTO(banco, categoria));
}

export function excluirCategoria(banco: BancoSimulado, _requisicao: RequisicaoTransporte, _agora: Date, id: number): RespostaTransporte {
  if (!banco.categorias.some((item) => item.id === id)) return naoEncontrado('Esta categoria não existe mais.');

  banco.categorias = banco.categorias.filter((item) => item.id !== id);
  banco.tarefas.forEach((tarefa) => {
    if (tarefa.categoria?.id === id) tarefa.categoria = null;
  });
  salvarBanco();
  return semConteudo();
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
