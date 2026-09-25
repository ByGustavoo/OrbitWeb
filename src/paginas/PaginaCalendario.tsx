import { useCallback, useMemo } from 'react';
import { CloudOff, RotateCw } from 'lucide-react';
import { AgendaDia } from '@/componentes/calendario/AgendaDia';
import { GradeMes } from '@/componentes/calendario/GradeMes';
import { NavegacaoCalendario } from '@/componentes/calendario/NavegacaoCalendario';
import { CabecalhoPagina } from '@/componentes/layout/CabecalhoPagina';
import { Botao, Painel } from '@/componentes/ui';
import { useDadosAssincronos } from '@/ganchos/useDadosAssincronos';
import { useParametrosPagina } from '@/ganchos/useParametrosPagina';
import { useHojeIso } from '@/ganchos/useHojeIso';
import { useTituloDocumento } from '@/ganchos/useTituloDocumento';
import type { DiaCalendarioDTO, TarefaDTO } from '@/modelos/tarefas';
import { useAcoesTarefa } from '@/provedores/ProvedorAcoesTarefa';
import { useAlteracoes } from '@/provedores/ProvedorAlteracoes';
import { servicoSessoes, servicoTarefas } from '@/servicos';
import { comMesEAno, dataIsoLocal, deDataIso, deMesIso, ehDataIsoValida, gradeDoMes, mesIso } from '@/utilitarios/datas';
import estilos from './PaginaCalendario.module.css';

interface ResumoMes {
  inicio: string;
  dias: ReadonlyMap<string, DiaCalendarioDTO>;
}

interface AgendaCarregada {
  dia: string;
  tarefas: TarefaDTO[];
}

export default function PaginaCalendario() {
  useTituloDocumento('Calendário');
  const [parametros, setParametros] = useParametrosPagina();
  const { versoes } = useAlteracoes();
  const acoes = useAcoesTarefa();
  const hoje = useHojeIso();

  const parametroDia = parametros.get('dia');
  const dia = parametroDia && ehDataIsoValida(parametroDia) ? parametroDia : hoje;
  const mes = deMesIso(parametros.get('mes') ?? '') ?? deMesIso(dia.slice(0, 7)) ?? new Date();
  const grade = gradeDoMes(mes.getFullYear(), mes.getMonth());
  const inicioGrade = dataIsoLocal(grade[0] ?? mes);
  const fimGrade = dataIsoLocal(grade[grade.length - 1] ?? mes);

  const irPara = useCallback(
    (proximoMes: Date, proximoDia: string, empilhar: boolean) => {
      setParametros(
        () => {
          const novos = new URLSearchParams();
          const mesmoQueHoje = proximoDia === hoje && mesIso(proximoMes) === hoje.slice(0, 7);
          if (!mesmoQueHoje) {
            novos.set('mes', mesIso(proximoMes));
            novos.set('dia', proximoDia);
          }
          return novos;
        },
        { replace: !empilhar },
      );
    },
    [hoje, setParametros],
  );

  const selecionarDia = useCallback(
    (iso: string) => {
      const data = deDataIso(iso);
      const mudouMes = data.getFullYear() !== mes.getFullYear() || data.getMonth() !== mes.getMonth();
      irPara(new Date(data.getFullYear(), data.getMonth(), 1), iso, mudouMes);
    },
    [irPara, mes],
  );

  const mudarMes = useCallback(
    (proximo: Date) => {
      const ehMesAtual = mesIso(proximo) === hoje.slice(0, 7);
      const diaNoMes = ehMesAtual ? hoje : dataIsoLocal(comMesEAno(deDataIso(dia), proximo.getFullYear(), proximo.getMonth()));
      irPara(proximo, diaNoMes, true);
    },
    [dia, hoje, irPara],
  );

  const irParaHoje = useCallback(() => {
    const data = deDataIso(hoje);
    irPara(new Date(data.getFullYear(), data.getMonth(), 1), hoje, true);
  }, [hoje, irPara]);

  const resumo = useDadosAssincronos(
    async (signal): Promise<ResumoMes> => {
      const dias = await servicoTarefas.buscarResumoCalendario({ dataInicial: inicioGrade, dataFinal: fimGrade }, signal);
      return { inicio: inicioGrade, dias: new Map(dias.map((item) => [item.data, item])) };
    },
    [inicioGrade, fimGrade, versoes.tarefas],
  );

  const agenda = useDadosAssincronos(
    async (signal): Promise<AgendaCarregada> => ({ dia, tarefas: await servicoTarefas.buscarTarefasPorData(dia, signal) }),
    [dia, versoes.tarefas],
  );

  const estudos = useDadosAssincronos(
    async (signal) => ({
      dia,
      sessoes: (await servicoSessoes.buscarSessoes({ dataInicial: dia, dataFinal: dia, tamanho: 100 }, signal)).itens,
    }),
    [dia, versoes.sessoes],
  );
  const sessoesDoDia = estudos.dados?.dia === dia ? estudos.dados.sessoes : null;

  const resumoDoMes = resumo.dados?.inicio === inicioGrade ? resumo.dados.dias : new Map<string, DiaCalendarioDTO>();
  const { aplicarConfirmadas } = acoes;
  const tarefasDoDia = useMemo(() => (agenda.dados ? aplicarConfirmadas(agenda.dados.tarefas) : null), [agenda.dados, aplicarConfirmadas]);
  const agendaDesatualizada = agenda.dados !== null && agenda.dados.dia !== dia;

  return (
    <>
      <CabecalhoPagina titulo="Calendário" descricao="Planeje e consulte sua agenda mês a mês." />

      <div className={estilos.pagina}>
        <div className={estilos.layout}>
          <Painel espacamento="nenhum" className={estilos.calendario} aria-label="Calendário do mês">
            <NavegacaoCalendario
              mes={mes}
              hoje={deDataIso(hoje)}
              carregando={resumo.carregando && resumo.dados?.inicio !== inicioGrade}
              noDiaDeHoje={dia === hoje && mesIso(mes) === hoje.slice(0, 7)}
              aoMudarMes={mudarMes}
              aoIrParaHoje={irParaHoje}
            />
            {resumo.erro ? (
              <div className={estilos.avisoResumo} role="alert">
                <CloudOff size={16} strokeWidth={2} aria-hidden="true" />
                <span>Não foi possível carregar os marcadores do mês. Os dias continuam disponíveis.</span>
                <Botao variante="terciario" tamanho="sm" icone={RotateCw} carregando={resumo.carregando} onClick={resumo.recarregar}>
                  Tentar novamente
                </Botao>
              </div>
            ) : null}
            <GradeMes
              mes={mes}
              hojeIso={hoje}
              selecionado={dia}
              resumo={resumoDoMes}
              carregando={resumo.carregando && resumo.dados?.inicio !== inicioGrade}
              aoSelecionar={selecionarDia}
            />
            <ul className={estilos.legenda} aria-label="Legenda">
              <li>
                <span className={`${estilos.amostra} ${estilos.amostraAFazer}`} aria-hidden="true" />A fazer
              </li>
              <li>
                <span className={`${estilos.amostra} ${estilos.amostraAtrasada}`} aria-hidden="true" />
                Atrasada
              </li>
              <li>
                <span className={`${estilos.amostra} ${estilos.amostraConcluida}`} aria-hidden="true" />
                Concluída
              </li>
              <li>
                <span className={`${estilos.amostra} ${estilos.amostraNaoRealizada}`} aria-hidden="true" />
                Não realizada
              </li>
            </ul>
          </Painel>

          <AgendaDia
            className={estilos.agenda}
            dia={dia}
            hojeIso={hoje}
            tarefas={tarefasDoDia}
            desatualizada={agendaDesatualizada}
            erro={agenda.erro}
            tentando={agenda.carregando}
            idsEnviando={acoes.idsEnviando}
            aoTentarNovamente={agenda.recarregar}
            aoAlternarConclusao={(tarefa) => void acoes.alternarConclusao(tarefa)}
            aoAbrir={acoes.abrirDetalhes}
            aoNovaTarefa={() => acoes.abrirNovaTarefa({ data: dia })}
            sessoes={sessoesDoDia}
          />
        </div>
      </div>
    </>
  );
}
