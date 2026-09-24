import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ErroApi } from '@/api/ErroApi';
import { Cronometro } from '@/componentes/estudos/Cronometro';
import { FormularioAtividade } from '@/componentes/estudos/FormularioAtividade';
import { FormularioSessao } from '@/componentes/estudos/FormularioSessao';
import { ListaAtividades } from '@/componentes/estudos/ListaAtividades';
import { ListaSessoes } from '@/componentes/estudos/ListaSessoes';
import { MetricasEstudo } from '@/componentes/estudos/MetricasEstudo';
import { ResumoSessao } from '@/componentes/estudos/ResumoSessao';
import { CabecalhoPagina } from '@/componentes/layout/CabecalhoPagina';
import { DialogoConfirmacao } from '@/componentes/ui';
import { useDadosAssincronos } from '@/ganchos/useDadosAssincronos';
import { useHojeIso } from '@/ganchos/useHojeIso';
import { estadoComParametros } from '@/ganchos/useParametrosPagina';
import { useTituloDocumento } from '@/ganchos/useTituloDocumento';
import type { AtividadeEnvioDTO, AtividadeEstudoDTO, EstudoPorAtividadeDTO, SessaoEnvioDTO, SessaoEstudoDTO } from '@/modelos/estudos';
import { useAlteracoes } from '@/provedores/ProvedorAlteracoes';
import { useCronometro } from '@/provedores/ProvedorCronometro';
import { useNotificacoes } from '@/provedores/ProvedorNotificacoes';
import { DURACAO_MINIMA_SESSAO_SEGUNDOS, lerCronometro } from '@/regras/cronometro';
import { caminhos } from '@/rotas/caminhos';
import { servicoAtividades, servicoSessoes } from '@/servicos';
import { adicionarDiasIso, dataIsoLocal, deDataIso, inicioDaSemana } from '@/utilitarios/datas';
import { formatarDuracaoSegundos } from '@/utilitarios/formatacao';
import estilos from './PaginaEstudos.module.css';

const DIAS_HISTORICO = 7;
const LIMITE_HISTORICO = 100;

interface EstadoModal<T> {
  chave: number;
  aberto: boolean;
  item: T | null;
}

function porAtividade(lista: EstudoPorAtividadeDTO[] | undefined): Map<number, EstudoPorAtividadeDTO> | null {
  return lista ? new Map(lista.map((item) => [item.atividade.id, item])) : null;
}

function mensagemDeErro(erro: unknown, padrao: string): string {
  if (erro instanceof ErroApi && (erro.tipo === 'CONFLITO' || erro.tipo === 'NAO_ENCONTRADO')) return erro.message;
  return padrao;
}

export default function PaginaEstudos() {
  useTituloDocumento('Estudos');
  const navegar = useNavigate();
  const hojeIso = useHojeIso();
  const { versoes, notificarAlteracao } = useAlteracoes();
  const notificacoes = useNotificacoes();
  const cronometro = useCronometro();
  const { sessao } = cronometro;

  const inicioSemana = dataIsoLocal(inicioDaSemana(deDataIso(hojeIso)));
  const inicioHistorico = adicionarDiasIso(hojeIso, 1 - DIAS_HISTORICO);

  const atividades = useDadosAssincronos((signal) => servicoAtividades.buscarAtividades(signal), [versoes.atividades]);
  const semana = useDadosAssincronos(
    (signal) => servicoSessoes.buscarResumoEstudos({ dataInicial: inicioSemana, dataFinal: adicionarDiasIso(inicioSemana, 6) }, signal),
    [inicioSemana, versoes.sessoes, versoes.atividades],
  );
  const total = useDadosAssincronos((signal) => servicoSessoes.buscarResumoEstudos({}, signal), [versoes.sessoes, versoes.atividades]);
  const recentes = useDadosAssincronos(
    (signal) => servicoSessoes.buscarSessoes({ dataInicial: inicioHistorico, dataFinal: hojeIso, tamanho: LIMITE_HISTORICO }, signal),
    [inicioHistorico, hojeIso, versoes.sessoes, versoes.atividades],
  );

  const [formularioAtividade, setFormularioAtividade] = useState<EstadoModal<AtividadeEstudoDTO>>({ chave: 0, aberto: false, item: null });
  const [formularioSessao, setFormularioSessao] = useState<EstadoModal<SessaoEstudoDTO>>({ chave: 0, aberto: false, item: null });
  const [idAtividadeNova, setIdAtividadeNova] = useState<number | null>(null);
  const [idSessaoDestacada, setIdSessaoDestacada] = useState<number | null>(null);
  const [idsDesarquivando, setIdsDesarquivando] = useState<ReadonlySet<number>>(new Set());
  const [confirmandoDescarte, setConfirmandoDescarte] = useState(false);

  const semanaPorAtividade = useMemo(() => porAtividade(semana.dados?.porAtividade), [semana.dados]);
  const totalPorAtividade = useMemo(() => porAtividade(total.dados?.porAtividade), [total.dados]);

  const abrirNovaAtividade = useCallback(() => {
    setFormularioAtividade((atual) => ({ chave: atual.chave + 1, aberto: true, item: null }));
  }, []);

  const abrirEdicaoAtividade = useCallback((atividade: AtividadeEstudoDTO) => {
    setFormularioAtividade((atual) => ({ chave: atual.chave + 1, aberto: true, item: atividade }));
  }, []);

  const fecharFormularioAtividade = useCallback(() => setFormularioAtividade((atual) => ({ ...atual, aberto: false })), []);

  const salvarAtividade = async (dados: AtividadeEnvioDTO) => {
    const atual = formularioAtividade.item;
    const salva = atual ? await servicoAtividades.atualizarAtividade(atual.id, dados) : await servicoAtividades.criarAtividade(dados);
    notificarAlteracao('atividades');
    fecharFormularioAtividade();
    if (atual) {
      notificacoes.sucesso('Atividade atualizada.', `“${salva.nome}” foi salva.`);
      return;
    }
    setIdAtividadeNova(salva.id);
    if (!sessao) cronometro.selecionarAtividade(salva.id);
    notificacoes.sucesso('Atividade criada.', sessao ? `“${salva.nome}” já pode ser usada na próxima sessão.` : `“${salva.nome}” já está selecionada no cronômetro.`);
  };

  const desarquivar = async (atividade: AtividadeEstudoDTO) => {
    setIdsDesarquivando((atuais) => new Set(atuais).add(atividade.id));
    try {
      await servicoAtividades.desarquivarAtividade(atividade.id);
      notificarAlteracao('atividades');
      notificacoes.sucesso('Atividade desarquivada.', `“${atividade.nome}” voltou para o cronômetro e para as metas.`);
    } catch (erro) {
      notificacoes.erro('Não foi possível desarquivar a atividade.', mensagemDeErro(erro, 'Verifique a conexão e tente de novo.'));
    } finally {
      setIdsDesarquivando((atuais) => {
        const proximos = new Set(atuais);
        proximos.delete(atividade.id);
        return proximos;
      });
    }
  };

  const arquivar = async (atividade: AtividadeEstudoDTO) => {
    try {
      await servicoAtividades.arquivarAtividade(atividade.id);
      notificarAlteracao('atividades');
      fecharFormularioAtividade();
      notificacoes.notificar({
        titulo: 'Atividade arquivada.',
        descricao: `“${atividade.nome}” saiu do cronômetro. As sessões continuam no histórico.`,
        variante: 'sucesso',
        acao: { rotulo: 'Desfazer', aoExecutar: () => void desarquivar(atividade) },
      });
    } catch (erro) {
      notificacoes.erro('Não foi possível arquivar a atividade.', mensagemDeErro(erro, 'Verifique a conexão e tente de novo.'));
    }
  };

  const excluirAtividade = async (atividade: AtividadeEstudoDTO) => {
    try {
      await servicoAtividades.excluirAtividade(atividade.id);
      notificarAlteracao('atividades', 'tarefas');
      fecharFormularioAtividade();
      notificacoes.sucesso('Atividade excluída.', `“${atividade.nome}” não aparece mais no cronômetro.`);
    } catch (erro) {
      notificacoes.erro('Não foi possível excluir a atividade.', mensagemDeErro(erro, 'Verifique a conexão e tente de novo.'));
    }
  };

  const abrirLancamento = useCallback(() => {
    setFormularioSessao((atual) => ({ chave: atual.chave + 1, aberto: true, item: null }));
  }, []);

  const abrirSessao = useCallback((item: SessaoEstudoDTO) => {
    setFormularioSessao((atual) => ({ chave: atual.chave + 1, aberto: true, item }));
  }, []);

  const fecharFormularioSessao = useCallback(() => setFormularioSessao((atual) => ({ ...atual, aberto: false })), []);

  const salvarSessao = async (dados: SessaoEnvioDTO) => {
    const atual = formularioSessao.item;
    const salva = atual ? await servicoSessoes.atualizarSessao(atual.id, dados) : await servicoSessoes.criarSessao(dados);
    notificarAlteracao('sessoes');
    fecharFormularioSessao();
    setIdSessaoDestacada(salva.id);
    notificacoes.sucesso(
      atual ? 'Sessão atualizada.' : 'Sessão lançada.',
      `${salva.atividade.nome} · ${formatarDuracaoSegundos(salva.duracaoSegundos)} de estudo.`,
    );
  };

  const excluirSessao = async (item: SessaoEstudoDTO) => {
    try {
      await servicoSessoes.excluirSessao(item.id);
      notificarAlteracao('sessoes');
      fecharFormularioSessao();
      notificacoes.sucesso('Sessão excluída.', `${formatarDuracaoSegundos(item.duracaoSegundos)} de ${item.atividade.nome} saíram do histórico.`);
    } catch (erro) {
      if (erro instanceof ErroApi && erro.tipo === 'NAO_ENCONTRADO') {
        notificarAlteracao('sessoes');
        fecharFormularioSessao();
      }
      notificacoes.erro('Não foi possível excluir a sessão.', mensagemDeErro(erro, 'Verifique a conexão e tente de novo.'));
    }
  };

  const pedirDescarte = () => {
    if (!sessao) return;
    if (lerCronometro(sessao, new Date()).segundosEstudo < DURACAO_MINIMA_SESSAO_SEGUNDOS) {
      cronometro.descartar();
      notificacoes.informacao('Sessão descartada.', 'Ela tinha menos de 1 minuto e não foi registrada.');
      return;
    }
    setConfirmandoDescarte(true);
  };

  const confirmarDescarte = () => {
    setConfirmandoDescarte(false);
    cronometro.descartar();
    notificacoes.informacao('Sessão descartada.', 'O tempo dela não foi registrado.');
  };

  const salvarResumo: typeof cronometro.salvar = async (opcoes) => {
    const salva = await cronometro.salvar(opcoes);
    if (salva) setIdSessaoDestacada(salva.id);
    return salva;
  };

  const segundosSessao = sessao ? lerCronometro(sessao, new Date()).segundosEstudo : 0;
  const atividadeEditada = formularioAtividade.item;

  return (
    <>
      <CabecalhoPagina titulo="Estudos" descricao="Cronometre o seu estudo e acompanhe quanto tempo você dedica a cada atividade." />

      <div className={estilos.painel}>
        <div className={estilos.grade}>
          <div className={estilos.colunaPrincipal}>
            <Cronometro
              atividades={atividades}
              idAtividadeNova={idAtividadeNova}
              aoCriarAtividade={abrirNovaAtividade}
              aoPedirDescarte={pedirDescarte}
            />
            <ListaAtividades
              className={estilos.atividades}
              atividades={atividades.dados}
              semana={semanaPorAtividade}
              total={totalPorAtividade}
              erro={Boolean(atividades.erro || semana.erro || total.erro)}
              tentando={atividades.carregando || semana.carregando || total.carregando}
              idEmAndamento={sessao?.atividade.id ?? null}
              sessaoPausada={sessao?.estado === 'PAUSADA'}
              idsDesarquivando={idsDesarquivando}
              aoTentarNovamente={() => {
                atividades.recarregar();
                semana.recarregar();
                total.recarregar();
              }}
              aoCriar={abrirNovaAtividade}
              aoEditar={abrirEdicaoAtividade}
              aoDesarquivar={(atividade) => void desarquivar(atividade)}
            />
          </div>

          <div className={estilos.colunaLateral}>
            <div className={estilos.metricas}>
              <MetricasEstudo semana={semana} hojeIso={hojeIso} />
            </div>
            <ListaSessoes
              className={estilos.historico}
              sessoes={recentes.dados?.itens ?? null}
              hojeIso={hojeIso}
              dias={DIAS_HISTORICO}
              erro={recentes.erro !== null}
              tentando={recentes.carregando}
              idDestacada={idSessaoDestacada}
              aoTentarNovamente={recentes.recarregar}
              aoVerHistorico={() => navegar(caminhos.historico, { state: estadoComParametros({ area: 'estudos' }) })}
              aoLancar={abrirLancamento}
              aoAbrir={abrirSessao}
            />
          </div>
        </div>
      </div>

      <ResumoSessao
        key={sessao?.iniciadaEm ?? 'sem-sessao'}
        aberto={Boolean(sessao?.encerradaEm)}
        sessao={sessao}
        aoSalvar={salvarResumo}
        aoPedirDescarte={pedirDescarte}
      />

      <DialogoConfirmacao
        aberto={confirmandoDescarte}
        titulo="Descartar esta sessão?"
        descricao={
          sessao
            ? `A sessão de ${sessao.atividade.nome} (${formatarDuracaoSegundos(segundosSessao)}) não será registrada. Esta ação não poderá ser desfeita.`
            : ''
        }
        textoConfirmar="Descartar"
        textoCancelar="Voltar para a sessão"
        destrutivo
        aoConfirmar={confirmarDescarte}
        aoCancelar={() => setConfirmandoDescarte(false)}
      />

      <FormularioAtividade
        key={`atividade-${formularioAtividade.chave}`}
        aberto={formularioAtividade.aberto}
        atividade={atividadeEditada}
        existentes={atividades.dados ?? []}
        sessoesDaAtividade={atividadeEditada ? totalPorAtividade?.get(atividadeEditada.id)?.sessoes ?? (totalPorAtividade ? 0 : null) : null}
        emUsoNoCronometro={atividadeEditada !== null && sessao?.atividade.id === atividadeEditada.id}
        aoFechar={fecharFormularioAtividade}
        aoEnviar={salvarAtividade}
        aoArquivar={arquivar}
        aoExcluir={excluirAtividade}
      />

      <FormularioSessao
        key={`sessao-${formularioSessao.chave}`}
        aberto={formularioSessao.aberto}
        sessao={formularioSessao.item}
        atividades={atividades.dados}
        atividadePadraoId={
          atividades.dados?.some((atividade) => atividade.id === cronometro.atividadeSelecionadaId && !atividade.arquivada)
            ? cronometro.atividadeSelecionadaId
            : null
        }
        aoFechar={fecharFormularioSessao}
        aoEnviar={salvarSessao}
        aoExcluir={excluirSessao}
      />
    </>
  );
}
