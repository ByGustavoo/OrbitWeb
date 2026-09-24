import { useCallback, useMemo, useState } from 'react';
import { ChevronDown, History, SearchX } from 'lucide-react';
import { ErroApi } from '@/api/ErroApi';
import { FormularioSessao } from '@/componentes/estudos/FormularioSessao';
import { BarraFiltrosHistorico } from '@/componentes/historico/BarraFiltrosHistorico';
import type { FiltrosTelaHistorico } from '@/componentes/historico/BarraFiltrosHistorico';
import { DetalhesRegistroHistorico } from '@/componentes/historico/DetalhesRegistroHistorico';
import { LinhaDoTempoHistorico } from '@/componentes/historico/LinhaDoTempoHistorico';
import { CabecalhoPagina } from '@/componentes/layout/CabecalhoPagina';
import { Botao, Esqueleto, EsqueletoLista, EstadoErro, EstadoVazio, Painel } from '@/componentes/ui';
import { useDadosAssincronos } from '@/ganchos/useDadosAssincronos';
import { useHojeIso } from '@/ganchos/useHojeIso';
import { useParametrosPagina } from '@/ganchos/useParametrosPagina';
import { useTituloDocumento } from '@/ganchos/useTituloDocumento';
import type { PaginaDTO } from '@/modelos/comum';
import type { AreaHistorico } from '@/modelos/enumeracoes';
import type { SessaoEnvioDTO, SessaoEstudoDTO } from '@/modelos/estudos';
import type { FiltrosHistorico, PeriodoHistorico, RegistroHistoricoDTO } from '@/modelos/historico';
import type { TarefaDTO } from '@/modelos/tarefas';
import { useAcoesTarefa } from '@/provedores/ProvedorAcoesTarefa';
import { useAlteracoes } from '@/provedores/ProvedorAlteracoes';
import { useNotificacoes } from '@/provedores/ProvedorNotificacoes';
import { PERIODO_PADRAO_HISTORICO, ajustarIntervalo, intervaloDoPeriodo } from '@/regras/periodoHistorico';
import type { IntervaloDatas } from '@/regras/periodoHistorico';
import { servicoAtividades, servicoHistorico, servicoSessoes } from '@/servicos';
import { ehDataIsoValida } from '@/utilitarios/datas';
import { formatarDiaMesCurto, formatarDuracaoSegundos, pluralizar } from '@/utilitarios/formatacao';
import estilos from './PaginaHistorico.module.css';

const TAMANHO_PAGINA = 30;
const DURACAO_SAIDA_MODAL_MS = 220;

const PERIODO_NA_TELA: Record<PeriodoHistorico, string> = {
  HOJE: 'hoje',
  ONTEM: 'ontem',
  ULTIMOS_7_DIAS: '7-dias',
  ULTIMOS_30_DIAS: '30-dias',
  ESTE_MES: 'este-mes',
  PERSONALIZADO: 'personalizado',
};

const AREA_NA_TELA: Record<AreaHistorico, string> = { TAREFAS: 'tarefas', ESTUDOS: 'estudos' };

function lerPeriodo(valor: string | null): PeriodoHistorico {
  const encontrado = (Object.keys(PERIODO_NA_TELA) as PeriodoHistorico[]).find((periodo) => PERIODO_NA_TELA[periodo] === valor);
  return encontrado ?? PERIODO_PADRAO_HISTORICO;
}

function lerArea(valor: string | null): AreaHistorico | null {
  return (Object.keys(AREA_NA_TELA) as AreaHistorico[]).find((area) => AREA_NA_TELA[area] === valor) ?? null;
}

function dataValida(valor: string | null): string | undefined {
  return valor && ehDataIsoValida(valor) ? valor : undefined;
}

function lerFiltros(parametros: URLSearchParams, hojeIso: string): FiltrosTelaHistorico {
  const periodo = lerPeriodo(parametros.get('periodo'));
  return {
    area: lerArea(parametros.get('area')),
    periodo,
    intervalo: intervaloDoPeriodo(periodo, hojeIso, {
      dataInicial: dataValida(parametros.get('de')),
      dataFinal: dataValida(parametros.get('ate')),
    }),
    busca: parametros.get('busca') ?? '',
  };
}

function descreverIntervalo({ dataInicial, dataFinal }: IntervaloDatas): string {
  if (dataInicial === dataFinal) return `em ${formatarDiaMesCurto(dataInicial)}`;
  return `de ${formatarDiaMesCurto(dataInicial)} a ${formatarDiaMesCurto(dataFinal)}`;
}

interface PaginasExtras {
  base: PaginaDTO<RegistroHistoricoDTO>;
  itens: RegistroHistoricoDTO[];
  pagina: number;
}

interface EstadoModal<T> {
  chave: number;
  aberto: boolean;
  item: T | null;
}

export default function PaginaHistorico() {
  useTituloDocumento('Histórico');
  const hojeIso = useHojeIso();
  const [parametros, setParametros] = useParametrosPagina();
  const { versoes, notificarAlteracao } = useAlteracoes();
  const acoes = useAcoesTarefa();
  const notificacoes = useNotificacoes();

  const filtros = useMemo(() => lerFiltros(parametros, hojeIso), [parametros, hojeIso]);
  const consulta: FiltrosHistorico = {
    dataInicial: filtros.intervalo.dataInicial,
    dataFinal: filtros.intervalo.dataFinal,
    area: filtros.area ?? undefined,
    busca: filtros.busca.trim() || undefined,
    tamanho: TAMANHO_PAGINA,
  };
  const chave = JSON.stringify(consulta);

  const resultado = useDadosAssincronos(
    async (signal) => ({ chave, pagina: await servicoHistorico.buscarHistorico({ ...consulta, pagina: 0 }, signal) }),
    [chave, versoes.tarefas, versoes.sessoes, versoes.atividades, versoes.categorias],
  );

  const [extras, setExtras] = useState<PaginasExtras | null>(null);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [detalhes, setDetalhes] = useState<{ aberto: boolean; registro: RegistroHistoricoDTO | null }>({ aberto: false, registro: null });
  const [formularioSessao, setFormularioSessao] = useState<EstadoModal<SessaoEstudoDTO>>({ chave: 0, aberto: false, item: null });

  const atividades = useDadosAssincronos(
    (signal) => (formularioSessao.item ? servicoAtividades.buscarAtividades(signal) : Promise.resolve(null)),
    [formularioSessao.item !== null, versoes.atividades],
  );

  const primeiraPagina = resultado.dados?.pagina ?? null;
  const desatualizada = resultado.dados !== null && resultado.dados.chave !== chave;
  const extrasValidos = extras && primeiraPagina && extras.base === primeiraPagina ? extras : null;
  const registros = useMemo(
    () => (primeiraPagina ? [...primeiraPagina.itens, ...(extrasValidos?.itens ?? [])] : null),
    [primeiraPagina, extrasValidos],
  );
  const totalItens = primeiraPagina?.totalItens ?? 0;
  const restantes = registros ? totalItens - registros.length : 0;

  const temFiltros = filtros.area !== null || filtros.busca.trim() !== '' || filtros.periodo !== PERIODO_PADRAO_HISTORICO;

  const atualizarParametros = useCallback(
    (alterar: (novos: URLSearchParams) => void) => {
      setParametros(
        (atuais) => {
          const novos = new URLSearchParams(atuais);
          alterar(novos);
          return novos;
        },
        { replace: true },
      );
    },
    [setParametros],
  );

  const mudarArea = (area: AreaHistorico | null) =>
    atualizarParametros((novos) => {
      if (area) novos.set('area', AREA_NA_TELA[area]);
      else novos.delete('area');
    });

  const mudarPeriodo = (periodo: PeriodoHistorico) =>
    atualizarParametros((novos) => {
      if (periodo === 'PERSONALIZADO') {
        novos.set('de', filtros.intervalo.dataInicial);
        novos.set('ate', filtros.intervalo.dataFinal);
      } else {
        novos.delete('de');
        novos.delete('ate');
      }
      if (periodo === PERIODO_PADRAO_HISTORICO) novos.delete('periodo');
      else novos.set('periodo', PERIODO_NA_TELA[periodo]);
    });

  const mudarIntervalo = (campo: keyof IntervaloDatas, data: string) =>
    atualizarParametros((novos) => {
      const ajustado = ajustarIntervalo({ ...filtros.intervalo, [campo]: data }, campo);
      novos.set('periodo', PERIODO_NA_TELA.PERSONALIZADO);
      novos.set('de', ajustado.dataInicial);
      novos.set('ate', ajustado.dataFinal);
    });

  const mudarBusca = useCallback(
    (busca: string) =>
      atualizarParametros((novos) => {
        if (busca.trim()) novos.set('busca', busca.trim());
        else novos.delete('busca');
      }),
    [atualizarParametros],
  );

  const limparFiltros = () => atualizarParametros((novos) => ['area', 'periodo', 'de', 'ate', 'busca'].forEach((nome) => novos.delete(nome)));

  const carregarMais = async () => {
    if (!primeiraPagina) return;
    const proxima = (extrasValidos?.pagina ?? 0) + 1;
    setCarregandoMais(true);
    try {
      const pagina = await servicoHistorico.buscarHistorico({ ...consulta, pagina: proxima });
      setExtras({ base: primeiraPagina, itens: [...(extrasValidos?.itens ?? []), ...pagina.itens], pagina: proxima });
    } catch {
      notificacoes.erro('Não foi possível carregar mais registros.', 'Verifique a conexão e tente de novo.');
    } finally {
      setCarregandoMais(false);
    }
  };

  const abrirDetalhes = useCallback((registro: RegistroHistoricoDTO) => setDetalhes({ aberto: true, registro }), []);
  const fecharDetalhes = useCallback(() => setDetalhes((atual) => ({ ...atual, aberto: false })), []);

  const depoisDeFecharDetalhes = (acao: () => void) => {
    fecharDetalhes();
    window.setTimeout(acao, DURACAO_SAIDA_MODAL_MS);
  };

  const abrirTarefa = (tarefa: TarefaDTO) => depoisDeFecharDetalhes(() => acoes.abrirDetalhes(tarefa));

  const editarSessao = (sessao: SessaoEstudoDTO) =>
    depoisDeFecharDetalhes(() => setFormularioSessao((atual) => ({ chave: atual.chave + 1, aberto: true, item: sessao })));

  const fecharFormularioSessao = useCallback(() => setFormularioSessao((atual) => ({ ...atual, aberto: false })), []);

  const salvarSessao = async (dados: SessaoEnvioDTO) => {
    const atual = formularioSessao.item;
    if (!atual) return;
    const salva = await servicoSessoes.atualizarSessao(atual.id, dados);
    notificarAlteracao('sessoes');
    fecharFormularioSessao();
    notificacoes.sucesso('Sessão atualizada.', `${salva.atividade.nome} · ${formatarDuracaoSegundos(salva.duracaoSegundos)} de estudo.`);
  };

  const excluirSessao = async (sessao: SessaoEstudoDTO) => {
    try {
      await servicoSessoes.excluirSessao(sessao.id);
      notificarAlteracao('sessoes');
      fecharFormularioSessao();
      notificacoes.sucesso('Sessão excluída.', `${formatarDuracaoSegundos(sessao.duracaoSegundos)} de ${sessao.atividade.nome} saíram do histórico.`);
    } catch (erro) {
      const ausente = erro instanceof ErroApi && erro.tipo === 'NAO_ENCONTRADO';
      if (ausente) {
        notificarAlteracao('sessoes');
        fecharFormularioSessao();
      }
      notificacoes.erro('Não foi possível excluir a sessão.', ausente ? erro.message : 'Verifique a conexão e tente de novo.');
    }
  };

  const vazio = () =>
    temFiltros ? (
      <EstadoVazio
        icone={SearchX}
        titulo="Nenhum resultado encontrado."
        descricao="Tente alterar os filtros ou o período selecionado."
        acao={
          <Botao variante="secundario" tamanho="sm" onClick={limparFiltros}>
            Limpar filtros
          </Botao>
        }
      />
    ) : (
      <EstadoVazio
        icone={History}
        titulo="Nenhuma atividade registrada."
        descricao="Suas tarefas concluídas e sessões de estudo aparecerão aqui."
      />
    );

  return (
    <>
      <CabecalhoPagina titulo="Histórico" descricao="O que você concluiu, mudou e estudou, dia a dia." />

      <Painel className={estilos.painel}>
        <BarraFiltrosHistorico
          filtros={filtros}
          temFiltros={temFiltros}
          aoMudarArea={mudarArea}
          aoMudarPeriodo={mudarPeriodo}
          aoMudarIntervalo={mudarIntervalo}
          aoMudarBusca={mudarBusca}
          aoLimpar={limparFiltros}
        />

        <div className={estilos.resultado} aria-busy={resultado.carregando || undefined}>
          {resultado.erro && !resultado.carregando ? null : primeiraPagina && !desatualizada ? (
            <p className={estilos.total} aria-live="polite">
              {totalItens === 0 ? 'Nenhum registro' : pluralizar(totalItens, 'registro', 'registros')} {descreverIntervalo(filtros.intervalo)}
            </p>
          ) : (
            <Esqueleto largura="12rem" altura={13} className={estilos.totalCarregando} />
          )}

          {resultado.erro && !resultado.carregando ? (
            <EstadoErro
              titulo="Não foi possível carregar o histórico"
              descricao="Verifique a conexão e tente de novo."
              aoTentarNovamente={resultado.recarregar}
            />
          ) : !registros || desatualizada ? (
            <EsqueletoLista linhas={7} rotulo="Carregando o histórico…" imediato={desatualizada} />
          ) : registros.length === 0 ? (
            vazio()
          ) : (
            <>
              <LinhaDoTempoHistorico registros={registros} hojeIso={hojeIso} aoAbrir={abrirDetalhes} />
              {restantes > 0 ? (
                <div className={estilos.mais}>
                  <Botao variante="secundario" icone={ChevronDown} carregando={carregandoMais} onClick={() => void carregarMais()}>
                    Mostrar mais registros
                  </Botao>
                  <span className={estilos.contagemMais}>
                    Mostrando {registros.length} de {totalItens}
                  </span>
                </div>
              ) : null}
            </>
          )}
        </div>
      </Painel>

      <DetalhesRegistroHistorico
        aberto={detalhes.aberto}
        registro={detalhes.registro}
        aoFechar={fecharDetalhes}
        aoAbrirTarefa={abrirTarefa}
        aoEditarSessao={editarSessao}
      />

      <FormularioSessao
        key={`sessao-${formularioSessao.chave}`}
        aberto={formularioSessao.aberto}
        sessao={formularioSessao.item}
        atividades={atividades.dados}
        atividadePadraoId={null}
        aoFechar={fecharFormularioSessao}
        aoEnviar={salvarSessao}
        aoExcluir={excluirSessao}
      />
    </>
  );
}
