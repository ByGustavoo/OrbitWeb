import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ClipboardCheck } from 'lucide-react';
import { ErroApi } from '@/api/ErroApi';
import { ListaEventosRecentes } from '@/componentes/dashboard/ListaEventosRecentes';
import { MapaCalorEstudo } from '@/componentes/dashboard/MapaCalorEstudo';
import { PainelProdutividade } from '@/componentes/dashboard/PainelProdutividade';
import type { PeriodoProdutividade } from '@/componentes/dashboard/PainelProdutividade';
import { PrioridadesEmAberto } from '@/componentes/dashboard/PrioridadesEmAberto';
import { ProximasAtividades } from '@/componentes/dashboard/ProximasAtividades';
import { ResumoIndicadores } from '@/componentes/dashboard/ResumoIndicadores';
import { TarefasDeHoje } from '@/componentes/dashboard/TarefasDeHoje';
import type { DadosTarefasDeHoje } from '@/componentes/dashboard/TarefasDeHoje';
import { ProgressoMetas } from '@/componentes/estudos/ProgressoMetas';
import { CabecalhoPagina } from '@/componentes/layout/CabecalhoPagina';
import { Botao, DialogoConfirmacao } from '@/componentes/ui';
import { useDadosAssincronos } from '@/ganchos/useDadosAssincronos';
import { useTituloDocumento } from '@/ganchos/useTituloDocumento';
import type { TarefaDTO } from '@/modelos/tarefas';
import { useAlteracoes } from '@/provedores/ProvedorAlteracoes';
import { useNotificacoes } from '@/provedores/ProvedorNotificacoes';
import { caminhos } from '@/rotas/caminhos';
import { servicoDashboard, servicoSessoes, servicoTarefas } from '@/servicos';
import { adicionarDiasIso, dataIsoLocal, diasNoMes, inicioDaSemana } from '@/utilitarios/datas';
import { pluralizar } from '@/utilitarios/formatacao';
import estilos from './PaginaDashboard.module.css';

const DIAS_PROXIMAS = 7;
const MESES_MAPA = 6;
const LIMITE_LISTA = 50;
const INTERVALO_RELOGIO_MS = 60000;

function saudacao(agora: Date): string {
  const hora = agora.getHours();
  if (hora >= 5 && hora < 12) return 'Bom dia';
  if (hora >= 12 && hora < 18) return 'Boa tarde';
  return 'Boa noite';
}

function descreverDia(agora: Date, dados: DadosTarefasDeHoje | null): string {
  if (!dados) return 'Acompanhe sua produtividade e organize o que precisa ser feito.';
  const validas = dados.hoje.filter((tarefa) => tarefa.situacao !== 'CANCELADA');
  const restantes = validas.filter((tarefa) => tarefa.situacao !== 'CONCLUIDA').length;
  const atrasadas = dados.atrasadas.length;
  const complementoAtraso = atrasadas > 0 ? ` e ${pluralizar(atrasadas, 'atrasada', 'atrasadas')}` : '';

  let frase: string;
  if (validas.length === 0) frase = atrasadas > 0 ? `Nada agendado para hoje, mas ${pluralizar(atrasadas, 'tarefa está atrasada', 'tarefas estão atrasadas')}.` : 'Nada agendado para hoje.';
  else if (restantes === 0) frase = `Tudo o que era para hoje está feito${complementoAtraso ? `, mas ainda há ${pluralizar(atrasadas, 'tarefa atrasada', 'tarefas atrasadas')}` : ''}.`;
  else frase = `${restantes === 1 ? 'Falta' : 'Faltam'} ${pluralizar(restantes, 'tarefa', 'tarefas')} para hoje${complementoAtraso}.`;

  return `${saudacao(agora)}! ${frase}`;
}

function mensagemDeErro(erro: unknown): string {
  if (erro instanceof ErroApi && erro.tipo === 'NAO_ENCONTRADO') return 'Esta tarefa não existe mais. A lista foi atualizada.';
  return 'Verifique a conexão e tente de novo.';
}

function useRelogio(): Date {
  const [agora, setAgora] = useState(() => new Date());
  useEffect(() => {
    const intervalo = window.setInterval(() => setAgora(new Date()), INTERVALO_RELOGIO_MS);
    return () => window.clearInterval(intervalo);
  }, []);
  return agora;
}

export default function PaginaDashboard() {
  useTituloDocumento('');
  const navegar = useNavigate();
  const [parametros, setParametros] = useSearchParams();
  const { versoes, notificarAlteracao } = useAlteracoes();
  const notificacoes = useNotificacoes();
  const agora = useRelogio();

  const periodo: PeriodoProdutividade = parametros.get('periodo') === '30' ? '30' : '7';
  const hojeIso = dataIsoLocal(agora);
  const inicioSemana = dataIsoLocal(inicioDaSemana(agora));
  const inicioMapa = dataIsoLocal(new Date(agora.getFullYear(), agora.getMonth() - (MESES_MAPA - 1), 1));
  const fimMapa = dataIsoLocal(new Date(agora.getFullYear(), agora.getMonth(), diasNoMes(agora.getFullYear(), agora.getMonth())));

  const resumo = useDadosAssincronos(
    (signal) =>
      servicoDashboard.buscarResumoDashboard({ dataInicial: adicionarDiasIso(hojeIso, 1 - Number(periodo)), dataFinal: hojeIso }, signal),
    [periodo, hojeIso, versoes.tarefas, versoes.sessoes],
  );

  const sequencia = useDadosAssincronos(
    (signal) => servicoDashboard.buscarSequencia(hojeIso, signal),
    [hojeIso, versoes.tarefas, versoes.sessoes],
  );

  const tarefasHoje = useDadosAssincronos(async (signal): Promise<DadosTarefasDeHoje> => {
    const [hoje, atrasadas] = await Promise.all([
      servicoTarefas.buscarTarefas({ data: hojeIso, ordenacao: 'DATA', tamanho: LIMITE_LISTA }, signal),
      servicoTarefas.buscarTarefas({ prazo: 'ATRASADA', ordenacao: 'DATA', tamanho: LIMITE_LISTA }, signal),
    ]);
    return { hoje: hoje.itens, atrasadas: atrasadas.itens };
  }, [hojeIso, versoes.tarefas]);

  const proximas = useDadosAssincronos(async (signal) => {
    const [lista, semana] = await Promise.all([
      servicoTarefas.buscarTarefas(
        {
          dataInicial: adicionarDiasIso(hojeIso, 1),
          dataFinal: adicionarDiasIso(hojeIso, DIAS_PROXIMAS),
          situacao: ['PENDENTE', 'EM_ANDAMENTO'],
          ordenacao: 'DATA',
          tamanho: 6,
        },
        signal,
      ),
      servicoTarefas.buscarResumoCalendario({ dataInicial: inicioSemana, dataFinal: adicionarDiasIso(inicioSemana, 6) }, signal),
    ]);
    return { proximas: lista.itens, semana };
  }, [hojeIso, inicioSemana, versoes.tarefas]);

  const mapa = useDadosAssincronos(
    (signal) => servicoSessoes.buscarMapaCalor({ dataInicial: inicioMapa, dataFinal: fimMapa }, signal),
    [inicioMapa, fimMapa, versoes.sessoes],
  );

  const metas = useDadosAssincronos(
    (signal) => servicoSessoes.buscarProgressoSemanal(inicioSemana, signal),
    [inicioSemana, versoes.sessoes, versoes.atividades],
  );

  const [idsEnviando, setIdsEnviando] = useState<ReadonlySet<number>>(new Set());
  const [confirmadas, setConfirmadas] = useState<ReadonlyMap<number, TarefaDTO>>(new Map());
  const [atrasadasParaMover, setAtrasadasParaMover] = useState<TarefaDTO[] | null>(null);
  const [movendo, setMovendo] = useState(false);

  useEffect(() => {
    setConfirmadas(new Map());
  }, [tarefasHoje.dados]);

  const tarefasExibidas = useMemo(() => {
    if (!tarefasHoje.dados || confirmadas.size === 0) return tarefasHoje;
    const aplicar = (lista: TarefaDTO[]) => lista.map((tarefa) => confirmadas.get(tarefa.id) ?? tarefa);
    return { ...tarefasHoje, dados: { hoje: aplicar(tarefasHoje.dados.hoje), atrasadas: aplicar(tarefasHoje.dados.atrasadas) } };
  }, [tarefasHoje, confirmadas]);

  const marcarEnvio = useCallback((id: number, enviando: boolean) => {
    setIdsEnviando((atuais) => {
      const proximos = new Set(atuais);
      if (enviando) proximos.add(id);
      else proximos.delete(id);
      return proximos;
    });
  }, []);

  const alterarSituacao = useCallback(
    async (tarefa: TarefaDTO, situacao: TarefaDTO['situacao']) => {
      marcarEnvio(tarefa.id, true);
      try {
        const atualizada = await servicoTarefas.alterarSituacao(tarefa.id, situacao);
        setConfirmadas((atuais) => new Map(atuais).set(atualizada.id, atualizada));
        notificarAlteracao('tarefas');
        return atualizada;
      } finally {
        marcarEnvio(tarefa.id, false);
      }
    },
    [marcarEnvio, notificarAlteracao],
  );

  const alternarConclusao = useCallback(
    async (tarefa: TarefaDTO) => {
      const anterior = tarefa.situacao;
      const concluir = anterior !== 'CONCLUIDA';
      try {
        const atualizada = await alterarSituacao(tarefa, concluir ? 'CONCLUIDA' : 'PENDENTE');
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
              alterarSituacao(atualizada, anterior)
                .then(() => notificacoes.informacao('Conclusão desfeita.', `“${tarefa.titulo}” voltou para a lista.`))
                .catch((erro: unknown) => notificacoes.erro('Não foi possível desfazer a conclusão.', mensagemDeErro(erro)));
            },
          },
        });
      } catch (erro) {
        if (erro instanceof ErroApi && erro.tipo === 'NAO_ENCONTRADO') notificarAlteracao('tarefas');
        notificacoes.erro(concluir ? 'Não foi possível concluir a tarefa.' : 'Não foi possível reabrir a tarefa.', mensagemDeErro(erro));
      }
    },
    [alterarSituacao, notificacoes, notificarAlteracao],
  );

  const moverAtrasadas = useCallback(async () => {
    if (!atrasadasParaMover) return;
    const originais = atrasadasParaMover.filter((tarefa) => tarefa.data !== null).map((tarefa) => ({ id: tarefa.id, data: tarefa.data as string }));
    setMovendo(true);
    try {
      await servicoTarefas.reagendarTarefas({ itens: originais.map((item) => ({ id: item.id, data: hojeIso })) });
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
      setMovendo(false);
    }
  }, [atrasadasParaMover, hojeIso, notificacoes, notificarAlteracao]);

  const mudarPeriodo = useCallback(
    (proximo: PeriodoProdutividade) => {
      setParametros(
        (atuais) => {
          const novos = new URLSearchParams(atuais);
          if (proximo === '7') novos.delete('periodo');
          else novos.set('periodo', proximo);
          return novos;
        },
        { replace: true },
      );
    },
    [setParametros],
  );

  const quantidadeParaMover = atrasadasParaMover?.length ?? 0;

  return (
    <>
      <CabecalhoPagina
        titulo="Dashboard"
        descricao={descreverDia(agora, tarefasExibidas.dados)}
        acoes={
          <Botao variante="secundario" icone={ClipboardCheck} onClick={() => navegar(caminhos.revisao)}>
            Revisão semanal
          </Botao>
        }
      />

      <div className={estilos.painel}>
        <div className={estilos.grade}>
          <div className={estilos.resumo}>
            <ResumoIndicadores resumo={resumo} sequencia={sequencia} />
          </div>

          <TarefasDeHoje
            className={estilos.hoje}
            resultado={tarefasExibidas}
            hojeIso={hojeIso}
            idsEnviando={idsEnviando}
            movendoAtrasadas={movendo}
            aoAlternarConclusao={alternarConclusao}
            aoMoverAtrasadas={setAtrasadasParaMover}
            aoAbrirCalendario={() => navegar(caminhos.calendario)}
          />

          <ProximasAtividades
            className={estilos.proximas}
            resultado={proximas}
            hojeIso={hojeIso}
            inicioSemana={inicioSemana}
            diasAdiante={DIAS_PROXIMAS}
          />

          <PrioridadesEmAberto className={estilos.prioridades} resultado={resumo} />

          <PainelProdutividade className={estilos.produtividade} resultado={resumo} periodo={periodo} aoMudarPeriodo={mudarPeriodo} />

          <ListaEventosRecentes className={estilos.recentes} resultado={resumo} agora={agora} />

          <MapaCalorEstudo className={estilos.mapa} resultado={mapa} hojeIso={hojeIso} meses={MESES_MAPA} />

          <ProgressoMetas className={estilos.metas} resultado={metas} />
        </div>
      </div>

      <DialogoConfirmacao
        aberto={atrasadasParaMover !== null}
        titulo={`Mover ${pluralizar(quantidadeParaMover, 'tarefa atrasada', 'tarefas atrasadas')} para hoje?`}
        descricao="Só a data muda. Horário, prioridade e situação continuam iguais, e você pode desfazer logo em seguida."
        textoConfirmar="Mover para hoje"
        carregando={movendo}
        aoConfirmar={moverAtrasadas}
        aoCancelar={() => setAtrasadasParaMover(null)}
      />
    </>
  );
}
