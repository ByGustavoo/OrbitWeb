import { useCallback, useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Pencil, Plus, Tags } from 'lucide-react';
import { descreverFalha, ehErroApi } from '@/api/tratamentoErros';
import { Botao, BotaoIcone, CabecalhoPainel, EsqueletoLista, EstadoErro, EstadoVazio, Painel } from '@/componentes/ui';
import { useDadosAssincronos } from '@/ganchos/useDadosAssincronos';
import { coresDaPaleta } from '@/modelos/cores';
import type { CategoriaDTO, CategoriaEnvioDTO } from '@/modelos/comum';
import { useAlteracoes } from '@/provedores/ProvedorAlteracoes';
import { useNotificacoes } from '@/provedores/ProvedorNotificacoes';
import { caminhos } from '@/rotas/caminhos';
import { servicoCategorias } from '@/servicos';
import { pluralizar } from '@/utilitarios/formatacao';
import { juntarClasses } from '@/utilitarios/juntarClasses';
import { FormularioCategoria } from './FormularioCategoria';
import type { SecaoConfiguracaoProps } from './SecaoAparencia';
import estilos from './SecaoConfiguracao.module.css';
import estilosCategorias from './SecaoCategorias.module.css';

const DURACAO_DESTAQUE_MS = 2500;

interface EstadoFormulario {
  chave: number;
  aberto: boolean;
  categoria: CategoriaDTO | null;
}

function descreverUso(quantidade: number): string {
  return quantidade === 0 ? 'Nenhuma tarefa' : pluralizar(quantidade, 'tarefa', 'tarefas');
}

export function SecaoCategorias({ id, idTitulo }: SecaoConfiguracaoProps) {
  const { versoes, notificarAlteracao } = useAlteracoes();
  const notificacoes = useNotificacoes();
  const categorias = useDadosAssincronos((signal) => servicoCategorias.buscarCategorias(signal), [versoes.categorias, versoes.tarefas]);
  const [formulario, setFormulario] = useState<EstadoFormulario>({ chave: 0, aberto: false, categoria: null });
  const [idDestacada, setIdDestacada] = useState<number | null>(null);

  useEffect(() => {
    if (idDestacada === null) return;
    const temporizador = window.setTimeout(() => setIdDestacada(null), DURACAO_DESTAQUE_MS);
    return () => window.clearTimeout(temporizador);
  }, [idDestacada]);

  const abrirNova = useCallback(() => setFormulario((atual) => ({ chave: atual.chave + 1, aberto: true, categoria: null })), []);
  const abrirEdicao = useCallback(
    (categoria: CategoriaDTO) => setFormulario((atual) => ({ chave: atual.chave + 1, aberto: true, categoria })),
    [],
  );
  const fechar = useCallback(() => setFormulario((atual) => ({ ...atual, aberto: false })), []);

  const salvar = async (dados: CategoriaEnvioDTO) => {
    const atual = formulario.categoria;
    const salva = atual ? await servicoCategorias.atualizarCategoria(atual.id, dados) : await servicoCategorias.criarCategoria(dados);
    if (atual) notificarAlteracao('categorias', 'tarefas');
    else notificarAlteracao('categorias');
    fechar();
    setIdDestacada(salva.id);
    if (atual) {
      notificacoes.sucesso('Categoria atualizada.', `“${salva.nome}” foi salva.`);
      return;
    }
    notificacoes.sucesso('Categoria criada.', `“${salva.nome}” já aparece no formulário de tarefa e nos filtros.`);
  };

  const excluir = async (categoria: CategoriaDTO) => {
    try {
      await servicoCategorias.excluirCategoria(categoria.id);
      notificarAlteracao('categorias', 'tarefas');
      fechar();
      notificacoes.sucesso(
        'Categoria excluída.',
        categoria.quantidadeTarefas === 0
          ? `“${categoria.nome}” não aparece mais nas opções.`
          : `${pluralizar(categoria.quantidadeTarefas, 'tarefa ficou', 'tarefas ficaram')} sem categoria.`,
      );
    } catch (erro) {
      if (ehErroApi(erro, 'NAO_ENCONTRADO')) {
        notificarAlteracao('categorias', 'tarefas');
        fechar();
      }
      notificacoes.erro('Não foi possível excluir a categoria.', descreverFalha(erro));
    }
  };

  const lista = categorias.dados;

  return (
    <Painel id={id} aria-labelledby={idTitulo} className={juntarClasses(estilos.secao, estilosCategorias.secao)}>
      <CabecalhoPainel
        titulo={
          <span id={idTitulo} tabIndex={-1} className={estilos.ancora}>
            Categorias
          </span>
        }
        descricao="Separam as suas tarefas por assunto e aparecem no formulário de tarefa, no calendário e nos filtros."
        acao={
          lista && lista.length > 0 ? (
            <Botao variante="secundario" tamanho="sm" icone={Plus} onClick={abrirNova}>
              Nova categoria
            </Botao>
          ) : null
        }
      />

      {categorias.erro && !lista ? (
        <EstadoErro
          compacto
          titulo="Não foi possível carregar as categorias"
          erro={categorias.erro}
          aoTentarNovamente={categorias.recarregar}
          tentando={categorias.carregando}
        />
      ) : !lista ? (
        <EsqueletoLista linhas={4} rotulo="Carregando as categorias…" />
      ) : lista.length === 0 ? (
        <EstadoVazio
          compacto
          icone={Tags}
          titulo="Nenhuma categoria ainda."
          descricao="Crie categorias como Casa, Trabalho ou Saúde para encontrar e filtrar as tarefas mais rápido."
          acao={
            <Botao variante="secundario" tamanho="sm" icone={Plus} onClick={abrirNova}>
              Criar categoria
            </Botao>
          }
        />
      ) : (
        <ul className={estilosCategorias.lista}>
          {lista.map((categoria) => (
            <li
              key={categoria.id}
              className={juntarClasses(estilosCategorias.item, categoria.id === idDestacada && estilosCategorias.destacada)}
              style={{ '--cor-categoria': coresDaPaleta(categoria.cor).texto } as CSSProperties}
            >
              <span className={estilosCategorias.cor} aria-hidden="true" />
              <span className={estilosCategorias.nome}>{categoria.nome}</span>
              <span className={estilosCategorias.uso}>{descreverUso(categoria.quantidadeTarefas)}</span>
              <BotaoIcone icone={Pencil} rotulo={`Editar ${categoria.nome}`} tamanho="sm" onClick={() => abrirEdicao(categoria)} />
            </li>
          ))}
        </ul>
      )}

      <p className={estilosCategorias.nota}>
        As atividades de estudo ficam em Estudos, junto do cronômetro e das metas.
        <Link to={caminhos.estudos} className={estilosCategorias.link}>
          Ir para Estudos
          <ArrowRight size={14} strokeWidth={2} aria-hidden="true" />
        </Link>
      </p>

      <FormularioCategoria
        key={`categoria-${formulario.chave}`}
        aberto={formulario.aberto}
        categoria={formulario.categoria}
        existentes={lista ?? []}
        aoFechar={fechar}
        aoEnviar={salvar}
        aoExcluir={excluir}
      />
    </Painel>
  );
}
