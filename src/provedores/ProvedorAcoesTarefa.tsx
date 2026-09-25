import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { descreverFalha, ehErroApi } from '@/api/tratamentoErros';
import { DetalhesTarefa } from '@/componentes/tarefas/DetalhesTarefa';
import { EscolhaEscopoAlteracao } from '@/componentes/tarefas/EscolhaEscopoAlteracao';
import { FormularioTarefa } from '@/componentes/tarefas/FormularioTarefa';
import { DialogoConfirmacao } from '@/componentes/ui';
import { estadoComParametros } from '@/ganchos/useParametrosPagina';
import type { EscopoAlteracao, Situacao } from '@/modelos/enumeracoes';
import { rotuloSituacao } from '@/modelos/rotulos';
import type { TarefaDTO, TarefaEnvioDTO } from '@/modelos/tarefas';
import { precisaDeNovaData } from '@/regras/prazo';
import { caminhos } from '@/rotas/caminhos';
import { servicoTarefas } from '@/servicos';
import { hojeIso } from '@/utilitarios/datas';
import { formatarDataLonga, formatarDiaRelativo, pluralizar } from '@/utilitarios/formatacao';
import { useAlteracoes } from './ProvedorAlteracoes';
import { useCronometro } from './ProvedorCronometro';
import { useNotificacoes } from './ProvedorNotificacoes';

interface EstadoFormulario {
  chave: number;
  aberto: boolean;
  tarefa: TarefaDTO | null;
  dataPadrao: string | null;
}

interface ValorContextoAcoesTarefa {
  abrirNovaTarefa: (opcoes?: { data?: string | null }) => void;
  abrirEdicao: (tarefa: TarefaDTO) => void;
  abrirDetalhes: (tarefa: TarefaDTO) => void;
  alternarConclusao: (tarefa: TarefaDTO) => Promise<void>;
  mudarSituacao: (tarefa: TarefaDTO, situacao: Situacao) => Promise<void>;
  pedirExclusao: (tarefa: TarefaDTO) => void;
  pedirMoverParaHoje: (tarefas: TarefaDTO[]) => void;
  aplicarConfirmadas: (tarefas: TarefaDTO[]) => TarefaDTO[];
  idsEnviando: ReadonlySet<number>;
  movendoAtrasadas: boolean;
}

const ContextoAcoesTarefa = createContext<ValorContextoAcoesTarefa | null>(null);

function mensagemDeErro(erro: unknown): string {
  if (ehErroApi(erro, 'NAO_ENCONTRADO')) return 'Esta tarefa não existe mais. A lista foi atualizada.';
  return descreverFalha(erro);
}

function descreverQuando(tarefa: TarefaDTO): string {
  if (!tarefa.data) return 'Ela está em Tarefas › Sem data.';
  const dia = formatarDiaRelativo(tarefa.data, hojeIso());
  const horario = !tarefa.diaInteiro && tarefa.horarioInicio ? `, às ${tarefa.horarioInicio}` : '';
  return `${dia.startsWith('Hoje') || dia.startsWith('Amanhã') || dia.startsWith('Ontem') ? dia : `Em ${dia.toLowerCase()}`}${horario}.`;
}

export function ProvedorAcoesTarefa({ children }: { children: ReactNode }) {
  const navegar = useNavigate();
  const { notificarAlteracao } = useAlteracoes();
  const notificacoes = useNotificacoes();
  const cronometro = useCronometro();

  const [formulario, setFormulario] = useState<EstadoFormulario>({ chave: 0, aberto: false, tarefa: null, dataPadrao: null });
  const [detalhes, setDetalhes] = useState<{ aberto: boolean; tarefa: TarefaDTO | null }>({ aberto: false, tarefa: null });
  const [exclusao, setExclusao] = useState<{ aberto: boolean; tarefa: TarefaDTO | null }>({ aberto: false, tarefa: null });
  const [excluindo, setExcluindo] = useState(false);
  const [atrasadasParaMover, setAtrasadasParaMover] = useState<TarefaDTO[] | null>(null);
  const [movendoAtrasadas, setMovendoAtrasadas] = useState(false);
  const [idsEnviando, setIdsEnviando] = useState<ReadonlySet<number>>(new Set());
  const [confirmadas, setConfirmadas] = useState<ReadonlyMap<number, TarefaDTO>>(new Map());
  const detalhesRef = useRef(detalhes);
  detalhesRef.current = detalhes;

  const registrarConfirmada = useCallback((tarefa: TarefaDTO) => {
    setConfirmadas((atuais) => new Map(atuais).set(tarefa.id, tarefa));
    setDetalhes((atual) => (atual.tarefa?.id === tarefa.id ? { ...atual, tarefa } : atual));
  }, []);

  const aplicarConfirmadas = useCallback(
    (tarefas: TarefaDTO[]) =>
      confirmadas.size === 0
        ? tarefas
        : tarefas.map((tarefa) => {
            const confirmada = confirmadas.get(tarefa.id);
            return confirmada && confirmada.atualizadoEm >= tarefa.atualizadoEm ? confirmada : tarefa;
          }),
    [confirmadas],
  );

  const marcarEnvio = useCallback((id: number, enviando: boolean) => {
    setIdsEnviando((atuais) => {
      const proximos = new Set(atuais);
      if (enviando) proximos.add(id);
      else proximos.delete(id);
      return proximos;
    });
  }, []);

  const tratarAusente = useCallback(
    (erro: unknown, id: number) => {
      if (!ehErroApi(erro, 'NAO_ENCONTRADO')) return;
      notificarAlteracao('tarefas');
      if (detalhesRef.current.tarefa?.id === id) setDetalhes((atual) => ({ ...atual, aberto: false }));
    },
    [notificarAlteracao],
  );

  const enviarSituacao = useCallback(
    async (tarefa: TarefaDTO, situacao: Situacao) => {
      marcarEnvio(tarefa.id, true);
      try {
        const atualizada = await servicoTarefas.alterarSituacao(tarefa.id, situacao);
        registrarConfirmada(atualizada);
        notificarAlteracao('tarefas');
        return atualizada;
      } finally {
        marcarEnvio(tarefa.id, false);
      }
    },
    [marcarEnvio, notificarAlteracao, registrarConfirmada],
  );

  const alternarConclusao = useCallback(
    async (tarefa: TarefaDTO) => {
      const anterior = tarefa.situacao;
      const concluir = anterior !== 'CONCLUIDA';
      try {
        const atualizada = await enviarSituacao(tarefa, concluir ? 'CONCLUIDA' : 'PENDENTE');
        if (!concluir) {
          notificacoes.sucesso('Tarefa reaberta.', `“${tarefa.titulo}” voltou para pendente.`);
          return;
        }
        notificacoes.notificar({
          titulo: 'Tarefa concluída.',
          descricao: `“${tarefa.titulo}”`,
          variante: 'sucesso',
          acao: {
            rotulo: 'Desfazer',
            aoExecutar: () => {
              enviarSituacao(atualizada, anterior)
                .then(() => notificacoes.informacao('Conclusão desfeita.', `“${tarefa.titulo}” voltou para a lista.`))
                .catch((erro: unknown) => notificacoes.erro('Não foi possível desfazer a conclusão.', mensagemDeErro(erro)));
            },
          },
        });
      } catch (erro) {
        tratarAusente(erro, tarefa.id);
        notificacoes.erro(concluir ? 'Não foi possível concluir a tarefa.' : 'Não foi possível reabrir a tarefa.', mensagemDeErro(erro));
      }
    },
    [enviarSituacao, notificacoes, tratarAusente],
  );

  const mudarSituacao = useCallback(
    async (tarefa: TarefaDTO, situacao: Situacao) => {
      if (situacao === 'CONCLUIDA' || (tarefa.situacao === 'CONCLUIDA' && situacao === 'PENDENTE')) {
        await alternarConclusao(tarefa);
        return;
      }
      try {
        await enviarSituacao(tarefa, situacao);
        const descricoes: Record<Situacao, string> = {
          PENDENTE: `“${tarefa.titulo}” voltou para pendente.`,
          EM_ANDAMENTO: `“${tarefa.titulo}” está em andamento.`,
          CONCLUIDA: `“${tarefa.titulo}” foi concluída.`,
          CANCELADA: `“${tarefa.titulo}” saiu das pendentes e continua no histórico.`,
        };
        notificacoes.sucesso(`Situação alterada para ${rotuloSituacao[situacao].toLowerCase()}.`, descricoes[situacao]);
      } catch (erro) {
        tratarAusente(erro, tarefa.id);
        notificacoes.erro('Não foi possível alterar a situação.', mensagemDeErro(erro));
      }
    },
    [alternarConclusao, enviarSituacao, notificacoes, tratarAusente],
  );

  const iniciarEstudo = useCallback(
    async (tarefa: TarefaDTO) => {
      if (!tarefa.atividade) return;
      const iniciou = cronometro.iniciar({ atividade: tarefa.atividade, tarefa: { id: tarefa.id, titulo: tarefa.titulo } });
      setDetalhes((atual) => ({ ...atual, aberto: false }));
      navegar(caminhos.estudos);
      if (!iniciou || tarefa.situacao !== 'PENDENTE') return;
      try {
        await enviarSituacao(tarefa, 'EM_ANDAMENTO');
      } catch (erro) {
        tratarAusente(erro, tarefa.id);
        notificacoes.aviso('O cronômetro começou, mas a tarefa continua pendente.', 'Não foi possível mudar a situação agora. Tente de novo nos detalhes da tarefa.');
      }
    },
    [cronometro, enviarSituacao, navegar, notificacoes, tratarAusente],
  );

  const abrirNovaTarefa = useCallback((opcoes?: { data?: string | null }) => {
    const dataPadrao = opcoes?.data === undefined ? hojeIso() : opcoes.data;
    setFormulario((atual) => ({ chave: atual.chave + 1, aberto: true, tarefa: null, dataPadrao }));
  }, []);

  const abrirEdicao = useCallback((tarefa: TarefaDTO) => {
    setDetalhes((atual) => ({ ...atual, aberto: false }));
    setFormulario((atual) => ({ chave: atual.chave + 1, aberto: true, tarefa, dataPadrao: null }));
  }, []);

  const abrirDetalhes = useCallback((tarefa: TarefaDTO) => {
    setDetalhes({ aberto: true, tarefa });
  }, []);

  const fecharFormulario = useCallback(() => setFormulario((atual) => ({ ...atual, aberto: false })), []);

  const salvarFormulario = useCallback(
    async (dados: TarefaEnvioDTO, escopo: EscopoAlteracao) => {
      const tarefa = formulario.tarefa;
      const salva = tarefa
        ? await servicoTarefas.atualizarTarefa(tarefa.id, dados, escopo)
        : await servicoTarefas.criarTarefa(dados);

      registrarConfirmada(salva);
      notificarAlteracao('tarefas');
      fecharFormulario();

      const semData = !salva.data;
      const irParaSemData = semData
        ? { rotulo: 'Ver', aoExecutar: () => navegar(caminhos.tarefas, { state: estadoComParametros({ visao: 'sem-data' }) }) }
        : undefined;
      if (!tarefa) {
        notificacoes.notificar({
          titulo: dados.recorrencia ? 'Tarefa recorrente criada.' : 'Tarefa criada.',
          descricao: `“${salva.titulo}”. ${descreverQuando(salva)}`,
          variante: 'sucesso',
          acao: irParaSemData,
        });
        return;
      }
      notificacoes.notificar({
        titulo: 'Alterações salvas.',
        descricao:
          tarefa.serieId !== null && escopo === 'ESTA_E_PROXIMAS'
            ? `“${salva.titulo}” e as próximas ocorrências foram atualizadas.`
            : `“${salva.titulo}” foi atualizada.`,
        variante: 'sucesso',
        acao: irParaSemData,
      });
    },
    [fecharFormulario, formulario.tarefa, navegar, notificacoes, notificarAlteracao, registrarConfirmada],
  );

  const pedirExclusao = useCallback((tarefa: TarefaDTO) => {
    setExclusao({ aberto: true, tarefa });
  }, []);

  const excluir = useCallback(
    async (escopo: EscopoAlteracao) => {
      const tarefa = exclusao.tarefa;
      if (!tarefa) return;
      setExcluindo(true);
      try {
        await servicoTarefas.excluirTarefa(tarefa.id, escopo);
        setExclusao((atual) => ({ ...atual, aberto: false }));
        setDetalhes((atual) => (atual.tarefa?.id === tarefa.id ? { ...atual, aberto: false } : atual));
        notificarAlteracao('tarefas');
        notificacoes.sucesso(
          escopo === 'ESTA_E_PROXIMAS' ? 'Tarefa e próximas ocorrências excluídas.' : 'Tarefa excluída.',
          `“${tarefa.titulo}” não aparece mais nas listas.`,
        );
      } catch (erro) {
        setExclusao((atual) => ({ ...atual, aberto: false }));
        tratarAusente(erro, tarefa.id);
        notificacoes.erro('Não foi possível excluir a tarefa.', mensagemDeErro(erro));
      } finally {
        setExcluindo(false);
      }
    },
    [exclusao.tarefa, notificacoes, notificarAlteracao, tratarAusente],
  );

  const pedirMoverParaHoje = useCallback(
    (tarefas: TarefaDTO[]) => {
      const hoje = hojeIso();
      const paraMover = tarefas.filter((tarefa) => precisaDeNovaData(tarefa, hoje));
      if (paraMover.length > 0) {
        setAtrasadasParaMover(paraMover);
        return;
      }
      notificacoes.informacao(
        'Nenhuma tarefa precisa mudar de data.',
        'As atrasadas já são de hoje. Para reorganizar o dia, ajuste o horário nos detalhes de cada uma.',
      );
    },
    [notificacoes],
  );

  const moverAtrasadas = useCallback(async () => {
    if (!atrasadasParaMover) return;
    const hoje = hojeIso();
    const originais = atrasadasParaMover
      .filter((tarefa) => tarefa.data !== null)
      .map((tarefa) => ({ id: tarefa.id, data: tarefa.data as string }));
    setMovendoAtrasadas(true);
    try {
      await servicoTarefas.reagendarTarefas({ itens: originais.map((item) => ({ id: item.id, data: hoje })) });
      notificarAlteracao('tarefas');
      setAtrasadasParaMover(null);
      notificacoes.notificar({
        titulo: `${pluralizar(originais.length, 'tarefa movida', 'tarefas movidas')} para hoje.`,
        descricao: 'Só a data mudou. Horário, prioridade e situação continuam iguais.',
        variante: 'sucesso',
        acao: {
          rotulo: 'Desfazer',
          aoExecutar: () => {
            servicoTarefas
              .reagendarTarefas({ itens: originais })
              .then(() => {
                notificarAlteracao('tarefas');
                notificacoes.informacao('As datas originais foram restauradas.');
              })
              .catch((erro: unknown) => notificacoes.erro('Não foi possível desfazer.', mensagemDeErro(erro)));
          },
        },
      });
    } catch (erro) {
      notificacoes.erro('Não foi possível mover as tarefas.', mensagemDeErro(erro));
    } finally {
      setMovendoAtrasadas(false);
    }
  }, [atrasadasParaMover, notificacoes, notificarAlteracao]);

  useEffect(() => {
    const tarefa = detalhes.tarefa;
    if (!detalhes.aberto || !tarefa) return;
    const controlador = new AbortController();
    servicoTarefas
      .buscarTarefa(tarefa.id, controlador.signal)
      .then((atual) => setDetalhes((estado) => (estado.tarefa?.id === atual.id ? { ...estado, tarefa: atual } : estado)))
      .catch((erro: unknown) => {
        if (controlador.signal.aborted) return;
        if (ehErroApi(erro, 'NAO_ENCONTRADO')) {
          setDetalhes((estado) => ({ ...estado, aberto: false }));
          notificacoes.aviso('Esta tarefa não existe mais.', 'Ela pode ter sido excluída em outra tela.');
          notificarAlteracao('tarefas');
        }
      });
    return () => controlador.abort();
  }, [detalhes.aberto, detalhes.tarefa?.id, notificacoes, notificarAlteracao]);

  const valor = useMemo<ValorContextoAcoesTarefa>(
    () => ({
      abrirNovaTarefa,
      abrirEdicao,
      abrirDetalhes,
      alternarConclusao,
      mudarSituacao,
      pedirExclusao,
      pedirMoverParaHoje,
      aplicarConfirmadas,
      idsEnviando,
      movendoAtrasadas,
    }),
    [
      abrirNovaTarefa,
      abrirEdicao,
      abrirDetalhes,
      alternarConclusao,
      mudarSituacao,
      pedirExclusao,
      pedirMoverParaHoje,
      aplicarConfirmadas,
      idsEnviando,
      movendoAtrasadas,
    ],
  );

  const tarefaExcluida = exclusao.tarefa;
  const quantidadeParaMover = atrasadasParaMover?.length ?? 0;
  const tarefaDetalhes = detalhes.tarefa;

  return (
    <ContextoAcoesTarefa.Provider value={valor}>
      {children}

      <FormularioTarefa
        key={formulario.chave}
        aberto={formulario.aberto}
        tarefa={formulario.tarefa}
        dataPadrao={formulario.dataPadrao}
        aoFechar={fecharFormulario}
        aoEnviar={salvarFormulario}
      />

      <DetalhesTarefa
        aberto={detalhes.aberto}
        tarefa={tarefaDetalhes}
        enviando={tarefaDetalhes ? idsEnviando.has(tarefaDetalhes.id) : false}
        aoFechar={() => setDetalhes((atual) => ({ ...atual, aberto: false }))}
        aoEditar={abrirEdicao}
        aoExcluir={pedirExclusao}
        aoAlternarConclusao={(tarefa) => void alternarConclusao(tarefa)}
        aoMudarSituacao={(tarefa, situacao) => void mudarSituacao(tarefa, situacao)}
        estudoEmAndamento={cronometro.sessao ? { atividade: cronometro.sessao.atividade.nome, tarefaId: cronometro.sessao.tarefa?.id ?? null } : null}
        aoIniciarEstudo={(tarefa) => void iniciarEstudo(tarefa)}
        aoVerCronometro={() => {
          setDetalhes((atual) => ({ ...atual, aberto: false }));
          navegar(caminhos.estudos);
        }}
      />

      {tarefaExcluida?.serieId != null ? (
        <EscolhaEscopoAlteracao
          aberto={exclusao.aberto}
          titulo="Excluir tarefa recorrente?"
          descricao="Esta ação não poderá ser desfeita. Para manter a tarefa no histórico, cancele em vez de excluir."
          textoConfirmar="Excluir"
          destrutivo
          descricaoSomenteEsta={`Exclui só a ocorrência de ${tarefaExcluida.data ? formatarDataLonga(tarefaExcluida.data) : 'hoje'}.`}
          descricaoEstaEProximas="Exclui esta e as próximas ainda não feitas, e encerra a repetição. As anteriores continuam."
          carregando={excluindo}
          aoConfirmar={(escopo) => void excluir(escopo)}
          aoCancelar={() => setExclusao((atual) => ({ ...atual, aberto: false }))}
        />
      ) : (
        <DialogoConfirmacao
          aberto={exclusao.aberto}
          titulo="Excluir tarefa?"
          descricao={`“${tarefaExcluida?.titulo ?? ''}” será excluída. Esta ação não poderá ser desfeita. Para manter a tarefa no histórico, cancele em vez de excluir.`}
          textoConfirmar="Excluir"
          destrutivo
          carregando={excluindo}
          aoConfirmar={() => void excluir('SOMENTE_ESTA')}
          aoCancelar={() => setExclusao((atual) => ({ ...atual, aberto: false }))}
        />
      )}

      <DialogoConfirmacao
        aberto={atrasadasParaMover !== null}
        titulo={`Mover ${pluralizar(quantidadeParaMover, 'tarefa atrasada', 'tarefas atrasadas')} para hoje?`}
        descricao="Só a data muda. Horário, prioridade e situação continuam iguais, e você pode desfazer logo em seguida."
        textoConfirmar="Mover para hoje"
        carregando={movendoAtrasadas}
        aoConfirmar={() => void moverAtrasadas()}
        aoCancelar={() => setAtrasadasParaMover(null)}
      />
    </ContextoAcoesTarefa.Provider>
  );
}

export function useAcoesTarefa(): ValorContextoAcoesTarefa {
  const contexto = useContext(ContextoAcoesTarefa);
  if (!contexto) throw new Error('useAcoesTarefa precisa estar dentro de <ProvedorAcoesTarefa>.');
  return contexto;
}
