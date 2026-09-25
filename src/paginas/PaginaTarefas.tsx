import { useCallback, useMemo, useRef, useState } from 'react';
import { CalendarCheck2, CalendarOff, ListChecks, PartyPopper, Plus, SearchX } from 'lucide-react';
import { descreverFalha } from '@/api/tratamentoErros';
import { CabecalhoPagina } from '@/componentes/layout/CabecalhoPagina';
import { BarraFiltrosTarefas } from '@/componentes/tarefas/BarraFiltrosTarefas';
import type { FiltroSituacao, FiltrosListaTarefas } from '@/componentes/tarefas/BarraFiltrosTarefas';
import { ListaTarefas } from '@/componentes/tarefas/ListaTarefas';
import { Botao, Esqueleto, EsqueletoLista, EstadoErro, EstadoVazio, GrupoOpcoes, Paginacao, Painel } from '@/componentes/ui';
import { useDadosAssincronos } from '@/ganchos/useDadosAssincronos';
import { useParametrosPagina } from '@/ganchos/useParametrosPagina';
import { useHojeIso } from '@/ganchos/useHojeIso';
import { useTituloDocumento } from '@/ganchos/useTituloDocumento';
import type { OrdenacaoTarefas, Prioridade, Situacao } from '@/modelos/enumeracoes';
import { PRIORIDADES, SITUACOES } from '@/modelos/enumeracoes';
import type { FiltrosTarefas } from '@/modelos/tarefas';
import { useAcoesTarefa } from '@/provedores/ProvedorAcoesTarefa';
import { useAlteracoes } from '@/provedores/ProvedorAlteracoes';
import { useNotificacoes } from '@/provedores/ProvedorNotificacoes';
import { servicoCategorias, servicoTarefas } from '@/servicos';
import { adicionarDiasIso } from '@/utilitarios/datas';
import { pluralizar } from '@/utilitarios/formatacao';
import estilos from './PaginaTarefas.module.css';

type Visao = 'todas' | 'sem-data' | 'atrasadas';

const TAMANHO_PAGINA = 20;
const LIMITE_REAGENDAMENTO = 100;

const FILTROS_PADRAO: FiltrosListaTarefas = {
  situacao: 'EM_ABERTO',
  prioridade: null,
  categoriaId: null,
  busca: '',
  ordenacao: 'DATA',
};

const ORDENACOES: OrdenacaoTarefas[] = ['DATA', 'PRIORIDADE', 'ATUALIZACAO'];

function lerVisao(valor: string | null): Visao {
  return valor === 'sem-data' || valor === 'atrasadas' ? valor : 'todas';
}

function lerFiltros(parametros: URLSearchParams): FiltrosListaTarefas {
  const situacao = parametros.get('situacao');
  const prioridade = parametros.get('prioridade');
  const categoria = Number(parametros.get('categoria'));
  const ordenacao = parametros.get('ordenacao');
  return {
    situacao:
      situacao === 'TODAS' || SITUACOES.includes(situacao as Situacao) ? (situacao as FiltroSituacao) : FILTROS_PADRAO.situacao,
    prioridade: PRIORIDADES.includes(prioridade as Prioridade) ? (prioridade as Prioridade) : null,
    categoriaId: Number.isInteger(categoria) && categoria > 0 ? categoria : null,
    busca: parametros.get('busca') ?? '',
    ordenacao: ORDENACOES.includes(ordenacao as OrdenacaoTarefas) ? (ordenacao as OrdenacaoTarefas) : 'DATA',
  };
}

function situacoesDoFiltro(situacao: FiltroSituacao): Situacao[] | undefined {
  if (situacao === 'TODAS') return undefined;
  if (situacao === 'EM_ABERTO') return ['PENDENTE', 'EM_ANDAMENTO'];
  return [situacao];
}

function montarConsulta(visao: Visao, filtros: FiltrosListaTarefas, pagina: number): FiltrosTarefas {
  return {
    semData: visao === 'sem-data' ? true : undefined,
    prazo: visao === 'atrasadas' ? 'ATRASADA' : undefined,
    situacao: visao === 'atrasadas' ? undefined : situacoesDoFiltro(filtros.situacao),
    prioridade: filtros.prioridade ? [filtros.prioridade] : undefined,
    categoriaId: filtros.categoriaId ?? undefined,
    busca: filtros.busca.trim() || undefined,
    ordenacao: filtros.ordenacao,
    pagina,
    tamanho: TAMANHO_PAGINA,
  };
}

export default function PaginaTarefas() {
  useTituloDocumento('Tarefas');
  const [parametros, setParametros] = useParametrosPagina();
  const { versoes } = useAlteracoes();
  const acoes = useAcoesTarefa();
  const notificacoes = useNotificacoes();
  const hoje = useHojeIso();
  const topoListaRef = useRef<HTMLDivElement>(null);
  const [buscandoAtrasadas, setBuscandoAtrasadas] = useState(false);

  const visao = lerVisao(parametros.get('visao'));
  const filtros = useMemo(() => lerFiltros(parametros), [parametros]);
  const pagina = Math.max(0, (Number(parametros.get('pagina')) || 1) - 1);
  const consulta = montarConsulta(visao, filtros, pagina);
  const chave = JSON.stringify(consulta);

  const atualizarParametros = useCallback(
    (alterar: (novos: URLSearchParams) => void, empilhar = false) => {
      setParametros(
        (atuais) => {
          const novos = new URLSearchParams(atuais);
          alterar(novos);
          return novos;
        },
        { replace: !empilhar },
      );
    },
    [setParametros],
  );

  const mudarFiltros = useCallback(
    (parcial: Partial<FiltrosListaTarefas>) => {
      atualizarParametros((novos) => {
        const proximos = { ...lerFiltros(novos), ...parcial };
        const definir = (nome: string, valor: string | null, padrao: string | null) => {
          if (valor === null || valor === '' || valor === padrao) novos.delete(nome);
          else novos.set(nome, valor);
        };
        definir('situacao', proximos.situacao, FILTROS_PADRAO.situacao);
        definir('prioridade', proximos.prioridade, null);
        definir('categoria', proximos.categoriaId === null ? null : String(proximos.categoriaId), null);
        definir('busca', proximos.busca.trim(), '');
        definir('ordenacao', proximos.ordenacao, FILTROS_PADRAO.ordenacao);
        novos.delete('pagina');
      });
    },
    [atualizarParametros],
  );

  const limparFiltros = useCallback(() => {
    atualizarParametros((novos) => {
      ['situacao', 'prioridade', 'categoria', 'busca', 'ordenacao', 'pagina'].forEach((nome) => novos.delete(nome));
    });
  }, [atualizarParametros]);

  const mudarVisao = (proxima: Visao) => {
    atualizarParametros((novos) => {
      if (proxima === 'todas') novos.delete('visao');
      else novos.set('visao', proxima);
      novos.delete('pagina');
    }, true);
  };

  const mudarPagina = (proxima: number) => {
    atualizarParametros((novos) => {
      if (proxima <= 0) novos.delete('pagina');
      else novos.set('pagina', String(proxima + 1));
    }, true);
    topoListaRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  };

  const resultado = useDadosAssincronos(
    async (signal) => ({ chave, pagina: await servicoTarefas.buscarTarefas(consulta, signal) }),
    [chave, versoes.tarefas],
  );

  const contagens = useDadosAssincronos(
    async (signal) => {
      const [semData, atrasadas, paraMover] = await Promise.all([
        servicoTarefas.buscarTarefas({ semData: true, situacao: ['PENDENTE', 'EM_ANDAMENTO'], tamanho: 1 }, signal),
        servicoTarefas.buscarTarefas({ prazo: 'ATRASADA', tamanho: 1 }, signal),
        servicoTarefas.buscarTarefas({ prazo: 'ATRASADA', dataFinal: adicionarDiasIso(hoje, -1), tamanho: 1 }, signal),
      ]);
      return { semData: semData.totalItens, atrasadas: atrasadas.totalItens, paraMover: paraMover.totalItens };
    },
    [hoje, versoes.tarefas],
  );

  const categorias = useDadosAssincronos((signal) => servicoCategorias.buscarCategorias(signal), [versoes.categorias]);

  const { aplicarConfirmadas } = acoes;
  const tarefas = useMemo(
    () => (resultado.dados ? aplicarConfirmadas(resultado.dados.pagina.itens) : null),
    [resultado.dados, aplicarConfirmadas],
  );
  const desatualizada = resultado.dados !== null && resultado.dados.chave !== chave;
  const paginaAtual = resultado.dados?.pagina ?? null;
  const temFiltros =
    filtros.prioridade !== null ||
    filtros.categoriaId !== null ||
    filtros.busca.trim() !== '' ||
    filtros.ordenacao !== FILTROS_PADRAO.ordenacao ||
    (visao !== 'atrasadas' && filtros.situacao !== FILTROS_PADRAO.situacao);

  const moverAtrasadas = async () => {
    setBuscandoAtrasadas(true);
    try {
      const todas = await servicoTarefas.buscarTarefas({
        prazo: 'ATRASADA',
        dataFinal: adicionarDiasIso(hoje, -1),
        ordenacao: 'DATA',
        tamanho: LIMITE_REAGENDAMENTO,
      });
      if (todas.itens.length > 0) acoes.pedirMoverParaHoje(todas.itens);
    } catch (erro) {
      notificacoes.erro('Não foi possível buscar as tarefas atrasadas.', descreverFalha(erro));
    } finally {
      setBuscandoAtrasadas(false);
    }
  };

  const rotuloContagem = (rotulo: string, quantidade: number | undefined) =>
    quantidade ? `${rotulo} (${quantidade})` : rotulo;

  const vazio = () => {
    if (temFiltros) {
      return (
        <EstadoVazio
          icone={SearchX}
          titulo="Nenhuma tarefa encontrada com esses filtros."
          descricao="Tente outra busca ou limpe os filtros para ver mais tarefas."
          acao={
            <Botao variante="secundario" tamanho="sm" onClick={limparFiltros}>
              Limpar filtros
            </Botao>
          }
        />
      );
    }
    if (visao === 'atrasadas') {
      return <EstadoVazio icone={PartyPopper} titulo="Nenhuma tarefa atrasada." descricao="Tudo em dia. Bom trabalho!" />;
    }
    if (visao === 'sem-data') {
      return (
        <EstadoVazio
          icone={CalendarOff}
          titulo="Nenhuma tarefa sem data."
          descricao="Tarefas criadas sem data aparecem aqui, fora do calendário, até você escolher um dia para elas."
          acao={
            <Botao variante="secundario" tamanho="sm" icone={Plus} onClick={() => acoes.abrirNovaTarefa({ data: null })}>
              Nova tarefa
            </Botao>
          }
        />
      );
    }
    return (
      <EstadoVazio
        icone={ListChecks}
        titulo="Nenhuma tarefa em aberto."
        descricao="Crie uma tarefa para começar a organizar o seu dia."
        acao={
          <Botao variante="secundario" tamanho="sm" icone={Plus} onClick={() => acoes.abrirNovaTarefa()}>
            Nova tarefa
          </Botao>
        }
      />
    );
  };

  return (
    <>
      <CabecalhoPagina titulo="Tarefas" descricao="Encontre, filtre e organize todas as suas tarefas." />

      <Painel className={estilos.painel}>
        <div className={estilos.topo}>
          <GrupoOpcoes
            rotulo="Visão"
            opcoes={[
              { valor: 'todas', rotulo: 'Todas' },
              { valor: 'sem-data', rotulo: rotuloContagem('Sem data', contagens.dados?.semData) },
              { valor: 'atrasadas', rotulo: rotuloContagem('Atrasadas', contagens.dados?.atrasadas) },
            ]}
            valor={visao}
            aoMudar={mudarVisao}
          />
          {visao === 'atrasadas' && (contagens.dados?.paraMover ?? 0) > 0 ? (
            <Botao
              variante="secundario"
              tamanho="sm"
              icone={CalendarCheck2}
              carregando={buscandoAtrasadas || acoes.movendoAtrasadas}
              onClick={() => void moverAtrasadas()}
            >
              Mover todas para hoje
            </Botao>
          ) : null}
        </div>

        <BarraFiltrosTarefas
          filtros={filtros}
          categorias={categorias.erro ? [] : categorias.dados}
          mostrarSituacao={visao !== 'atrasadas'}
          temFiltros={temFiltros}
          aoMudar={mudarFiltros}
          aoLimpar={limparFiltros}
        />

        <div ref={topoListaRef} className={estilos.resultado} aria-busy={resultado.carregando || undefined}>
          {paginaAtual && !desatualizada ? (
            <p className={estilos.total} aria-live="polite">
              {pluralizar(paginaAtual.totalItens, 'tarefa encontrada', 'tarefas encontradas')}
            </p>
          ) : resultado.erro && !resultado.carregando ? null : (
            <Esqueleto largura="9rem" altura={13} className={estilos.totalCarregando} />
          )}

          {resultado.erro && !resultado.carregando ? (
            <EstadoErro
              titulo="Não foi possível carregar as tarefas"
              erro={resultado.erro}
              aoTentarNovamente={resultado.recarregar}
            />
          ) : !tarefas || desatualizada ? (
            <EsqueletoLista linhas={6} rotulo="Carregando as tarefas…" imediato={desatualizada} />
          ) : tarefas.length === 0 ? (
            vazio()
          ) : (
            <ListaTarefas
              tarefas={tarefas}
              hojeIso={hoje}
              agruparPorDia={filtros.ordenacao === 'DATA' && visao !== 'sem-data'}
              idsEnviando={acoes.idsEnviando}
              aoAlternarConclusao={(tarefa) => void acoes.alternarConclusao(tarefa)}
              aoAbrir={acoes.abrirDetalhes}
            />
          )}

          {paginaAtual && !desatualizada ? (
            <Paginacao pagina={paginaAtual.pagina} totalPaginas={paginaAtual.totalPaginas} aoMudar={mudarPagina} />
          ) : null}
        </div>
      </Painel>
    </>
  );
}
