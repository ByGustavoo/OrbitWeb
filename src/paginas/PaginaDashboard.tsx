import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardCheck } from 'lucide-react';
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
import { Botao } from '@/componentes/ui';
import { useDadosAssincronos } from '@/ganchos/useDadosAssincronos';
import { useParametrosPagina } from '@/ganchos/useParametrosPagina';
import { useTituloDocumento } from '@/ganchos/useTituloDocumento';
import { useAcoesTarefa } from '@/provedores/ProvedorAcoesTarefa';
import { useAlteracoes } from '@/provedores/ProvedorAlteracoes';
import { precisaDeNovaData } from '@/regras/prazo';
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

function descreverDia(agora: Date, hojeIso: string, dados: DadosTarefasDeHoje | null): string {
  if (!dados) return 'Acompanhe sua produtividade e organize o que precisa ser feito.';
  const validas = dados.hoje.filter((tarefa) => tarefa.situacao !== 'CANCELADA');
  const restantes = validas.filter((tarefa) => tarefa.situacao !== 'CONCLUIDA').length;
  const atrasadas = dados.atrasadas.filter((tarefa) => precisaDeNovaData(tarefa, hojeIso)).length;
  const complementoAtraso = atrasadas > 0 ? ` e ${pluralizar(atrasadas, 'atrasada', 'atrasadas')} de dias anteriores` : '';

  let frase: string;
  if (validas.length === 0) frase = atrasadas > 0 ? `Nada agendado para hoje, mas ${pluralizar(atrasadas, 'tarefa está atrasada', 'tarefas estão atrasadas')}.` : 'Nada agendado para hoje.';
  else if (restantes === 0) frase = `Tudo o que era para hoje está feito${atrasadas > 0 ? `, mas ainda há ${pluralizar(atrasadas, 'tarefa atrasada', 'tarefas atrasadas')} de dias anteriores` : ''}.`;
  else frase = `${restantes === 1 ? 'Falta' : 'Faltam'} ${pluralizar(restantes, 'tarefa', 'tarefas')} para hoje${complementoAtraso}.`;

  return `${saudacao(agora)}! ${frase}`;
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
  const [parametros, setParametros] = useParametrosPagina();
  const { versoes } = useAlteracoes();
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

  const acoes = useAcoesTarefa();
  const { aplicarConfirmadas } = acoes;

  const tarefasExibidas = useMemo(() => {
    if (!tarefasHoje.dados) return tarefasHoje;
    return {
      ...tarefasHoje,
      dados: { hoje: aplicarConfirmadas(tarefasHoje.dados.hoje), atrasadas: aplicarConfirmadas(tarefasHoje.dados.atrasadas) },
    };
  }, [tarefasHoje, aplicarConfirmadas]);

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

  return (
    <>
      <CabecalhoPagina
        titulo="Dashboard"
        descricao={descreverDia(agora, hojeIso, tarefasExibidas.dados)}
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
            idsEnviando={acoes.idsEnviando}
            movendoAtrasadas={acoes.movendoAtrasadas}
            aoAlternarConclusao={(tarefa) => void acoes.alternarConclusao(tarefa)}
            aoAbrirTarefa={acoes.abrirDetalhes}
            aoMoverAtrasadas={acoes.pedirMoverParaHoje}
            aoAbrirCalendario={() => navegar(caminhos.calendario)}
          />

          <div className={estilos.lateral}>
            <ProximasAtividades
              className={estilos.proximas}
              resultado={proximas}
              hojeIso={hojeIso}
              inicioSemana={inicioSemana}
              diasAdiante={DIAS_PROXIMAS}
            />

            <PrioridadesEmAberto className={estilos.prioridades} resultado={resumo} />

            <ListaEventosRecentes
              className={estilos.recentes}
              resultado={resumo}
              agora={agora}
              aoVerHistorico={() => navegar(caminhos.historico)}
            />
          </div>

          <PainelProdutividade className={estilos.produtividade} resultado={resumo} periodo={periodo} aoMudarPeriodo={mudarPeriodo} />

          <MapaCalorEstudo className={estilos.mapa} resultado={mapa} hojeIso={hojeIso} meses={MESES_MAPA} />

          <ProgressoMetas className={estilos.metas} resultado={metas} />
        </div>
      </div>

    </>
  );
}
