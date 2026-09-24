import { useCallback, useMemo } from 'react';
import { CircleCheck, History, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CabecalhoPagina } from '@/componentes/layout/CabecalhoPagina';
import { ProgressoMetas } from '@/componentes/estudos/ProgressoMetas';
import { BarrasDaSemana } from '@/componentes/revisao/BarrasDaSemana';
import { EstudosDaSemana } from '@/componentes/revisao/EstudosDaSemana';
import { FatosSemana } from '@/componentes/revisao/FatosSemana';
import { NavegacaoSemana } from '@/componentes/revisao/NavegacaoSemana';
import { NotaDaSemana } from '@/componentes/revisao/NotaDaSemana';
import { AtalhoSemanaSeguinte, ProximaSemana } from '@/componentes/revisao/ProximaSemana';
import { ResumoSemana } from '@/componentes/revisao/ResumoSemana';
import { TarefasDaSemana } from '@/componentes/revisao/TarefasDaSemana';
import { Botao, CabecalhoPainel, Esqueleto, EstadoErro, EstadoVazio, Painel } from '@/componentes/ui';
import { useDadosAssincronos } from '@/ganchos/useDadosAssincronos';
import { useHojeIso } from '@/ganchos/useHojeIso';
import { estadoComParametros, useParametrosPagina } from '@/ganchos/useParametrosPagina';
import { useTituloDocumento } from '@/ganchos/useTituloDocumento';
import { useAcoesTarefa } from '@/provedores/ProvedorAcoesTarefa';
import { useAlteracoes } from '@/provedores/ProvedorAlteracoes';
import {
  inicioDaSemanaIso,
  lerSemana,
  montarDestaques,
  montarPontosDeAtencao,
  semanaAnterior,
  semanaSeguinte,
  semanaSemRegistros,
} from '@/regras/revisaoSemanal';
import { caminhos } from '@/rotas/caminhos';
import { servicoRevisaoSemanal } from '@/servicos';
import { adicionarDiasIso, deDataIso, formatarDiaSemana } from '@/utilitarios/datas';
import { formatarDuracao, formatarDuracaoPorExtenso, pluralizar } from '@/utilitarios/formatacao';
import estilos from './PaginaRevisaoSemanal.module.css';

function descreverSituacao(ehSemanaAtual: boolean, hojeIso: string): string {
  if (!ehSemanaAtual) return 'Semana encerrada';
  return `Semana em andamento · dados até hoje, ${formatarDiaSemana(deDataIso(hojeIso)).toLocaleLowerCase('pt-BR')}`;
}

function EsqueletoRevisao() {
  return (
    <div className={estilos.grade} role="status" aria-label="Carregando a revisão da semana…">
      <Esqueleto className={estilos.inteiro} altura={236} raio="var(--raio-lg)" />
      <Esqueleto className={estilos.metade} altura={180} raio="var(--raio-lg)" />
      <Esqueleto className={estilos.metade} altura={180} raio="var(--raio-lg)" />
      <Esqueleto className={estilos.inteiro} altura={340} raio="var(--raio-lg)" />
    </div>
  );
}

export default function PaginaRevisaoSemanal() {
  useTituloDocumento('Revisão semanal');
  const navegar = useNavigate();
  const hojeIso = useHojeIso();
  const [parametros, setParametros] = useParametrosPagina();
  const { versoes } = useAlteracoes();
  const acoes = useAcoesTarefa();

  const semanaAtual = inicioDaSemanaIso(hojeIso);
  const semana = lerSemana(parametros.get('semana'), hojeIso);
  const ehSemanaAtual = semana === semanaAtual;

  const resultado = useDadosAssincronos(
    (signal) => servicoRevisaoSemanal.buscarRevisaoSemanal(semana, signal),
    [semana, versoes.tarefas, versoes.sessoes, versoes.atividades, versoes.categorias],
  );

  const revisao = resultado.dados?.inicioSemana === semana ? resultado.dados : null;

  const irParaSemana = useCallback(
    (inicio: string) =>
      setParametros((atuais) => {
        const novos = new URLSearchParams(atuais);
        if (inicio === semanaAtual) novos.delete('semana');
        else novos.set('semana', inicio);
        return novos;
      }),
    [setParametros, semanaAtual],
  );

  const { aplicarConfirmadas } = acoes;
  const pendentes = useMemo(() => (revisao ? aplicarConfirmadas(revisao.tarefas.pendentes) : []), [revisao, aplicarConfirmadas]);
  const tarefasProximas = useMemo(
    () => (revisao ? aplicarConfirmadas(revisao.proximaSemana.tarefas) : []),
    [revisao, aplicarConfirmadas],
  );

  const fimSemana = adicionarDiasIso(semana, 6);
  const verHistorico = () =>
    navegar(caminhos.historico, {
      state: estadoComParametros({ periodo: 'personalizado', de: semana, ate: fimSemana < hojeIso ? fimSemana : hojeIso }),
    });
  const verCalendario = (dia: string) =>
    navegar(caminhos.calendario, { state: estadoComParametros({ mes: dia.slice(0, 7), dia }) });

  const conteudo = () => {
    if (resultado.erro && !resultado.carregando && !revisao) {
      return (
        <EstadoErro
          titulo="Não foi possível carregar a revisão da semana"
          descricao="Verifique a conexão e tente de novo."
          aoTentarNovamente={resultado.recarregar}
        />
      );
    }
    if (!revisao) return <EsqueletoRevisao />;

    const proxima = ehSemanaAtual ? (
      <ProximaSemana
        className={estilos.maior}
        proxima={revisao.proximaSemana}
        tarefas={tarefasProximas}
        hojeIso={hojeIso}
        idsEnviando={acoes.idsEnviando}
        aoAlternarConclusao={(tarefa) => void acoes.alternarConclusao(tarefa)}
        aoAbrir={acoes.abrirDetalhes}
        aoNovaTarefa={() => acoes.abrirNovaTarefa({ data: revisao.proximaSemana.inicioSemana })}
        aoVerCalendario={() => verCalendario(revisao.proximaSemana.inicioSemana)}
      />
    ) : (
      <AtalhoSemanaSeguinte
        className={`${estilos.maior} ${estilos.topo}`}
        inicioSemana={semanaSeguinte(semana)}
        fimSemana={adicionarDiasIso(semanaSeguinte(semana), 6)}
        aoIr={() => irParaSemana(semanaSeguinte(semana))}
      />
    );
    const nota = (
      <NotaDaSemana
        key={semana}
        className={`${estilos.menor} ${estilos.topo}`}
        nota={revisao.nota}
        aoSalvar={(texto) => servicoRevisaoSemanal.salvarNotaSemana(semana, texto)}
      />
    );

    if (semanaSemRegistros(revisao)) {
      return (
        <div className={estilos.grade}>
          <Painel className={estilos.inteiro}>
            <EstadoVazio
              icone={History}
              titulo="Nenhuma atividade registrada nesta semana."
              descricao="Tarefas com data nestes dias, tarefas concluídas e sessões de estudo aparecem aqui assim que forem registradas."
              acao={
                <Botao variante="secundario" tamanho="sm" onClick={() => irParaSemana(semanaAnterior(semana))}>
                  Ver a semana anterior
                </Botao>
              }
            />
          </Painel>
          {proxima}
          {nota}
        </div>
      );
    }

    const destaques = montarDestaques(revisao);
    const pontos = montarPontosDeAtencao(revisao);
    const totalTarefas = revisao.porDia.reduce((soma, dia) => soma + dia.tarefasConcluidas, 0);
    const totalMinutos = revisao.porDia.reduce((soma, dia) => soma + dia.minutosEstudo, 0);
    const metas = { dados: revisao.estudos.metas, carregando: false, erro: null, recarregar: resultado.recarregar };

    return (
      <div className={estilos.grade}>
        <div className={estilos.inteiro}>
          <ResumoSemana revisao={revisao} />
        </div>

        <FatosSemana
          className={estilos.metade}
          id="titulo-destaques"
          titulo="Destaques da semana"
          descricao="O que foi feito, em números"
          icone={CircleCheck}
          tom="sucesso"
          fatos={destaques}
          textoVazio="Nenhuma tarefa concluída nem sessão de estudo nesta semana até agora."
        />
        <FatosSemana
          className={estilos.metade}
          id="titulo-pontos-atencao"
          titulo="Pontos de atenção"
          descricao="O que ficou em aberto ou fora do previsto"
          icone={Info}
          tom="neutro"
          fatos={pontos}
          textoVazio="Nada ficou atrasado ou pendente nesta semana."
        />

        <Painel className={estilos.inteiro} aria-labelledby="titulo-atividades-semana">
          <CabecalhoPainel
            titulo={<span id="titulo-atividades-semana">Atividades da semana</span>}
            descricao="Como as tarefas concluídas e o estudo se distribuíram pelos dias"
          />
          <div className={estilos.graficos}>
            <BarrasDaSemana
              id="titulo-barras-tarefas"
              titulo="Tarefas concluídas por dia"
              total={`${totalTarefas} no total`}
              hojeIso={hojeIso}
              dias={revisao.porDia.map((dia) => ({ data: dia.data, valor: dia.tarefasConcluidas }))}
              formatarValor={String}
              descreverValor={(valor) => pluralizar(valor, 'tarefa concluída', 'tarefas concluídas')}
            />
            <BarrasDaSemana
              id="titulo-barras-estudo"
              titulo="Tempo de estudo por dia"
              total={`${formatarDuracao(totalMinutos)} no total`}
              hojeIso={hojeIso}
              dias={revisao.porDia.map((dia) => ({ data: dia.data, valor: dia.minutosEstudo }))}
              formatarValor={(valor) => (valor === 0 ? '0' : formatarDuracao(valor))}
              descreverValor={(valor) => (valor === 0 ? 'sem estudo' : formatarDuracaoPorExtenso(valor))}
            />
          </div>
        </Painel>

        <EstudosDaSemana className={estilos.maior} estudos={revisao.estudos} aoVerEstudos={() => navegar(caminhos.estudos)} />
        <ProgressoMetas className={estilos.menor} resultado={metas} semanaEncerrada={!revisao.emAndamento} />

        <TarefasDaSemana
          className={estilos.inteiro}
          tarefas={revisao.tarefas}
          pendentes={pendentes}
          hojeIso={hojeIso}
          idsEnviando={acoes.idsEnviando}
          movendoAtrasadas={acoes.movendoAtrasadas}
          aoAlternarConclusao={(tarefa) => void acoes.alternarConclusao(tarefa)}
          aoAbrir={acoes.abrirDetalhes}
          aoMoverAtrasadas={acoes.pedirMoverParaHoje}
          aoVerCalendario={() => verCalendario(semana)}
        />

        {proxima}
        {nota}
      </div>
    );
  };

  return (
    <>
      <CabecalhoPagina
        titulo="Revisão semanal"
        descricao="O que foi feito, o que ficou em aberto e o que vem pela frente, semana a semana."
        acoes={
          <Botao variante="secundario" icone={History} onClick={verHistorico}>
            Ver histórico da semana
          </Botao>
        }
      />

      <div className={estilos.pagina}>
        <NavegacaoSemana
          inicioSemana={semana}
          fimSemana={fimSemana}
          ehSemanaAtual={ehSemanaAtual}
          situacao={descreverSituacao(ehSemanaAtual, hojeIso)}
          carregando={resultado.carregando}
          aoIrParaAnterior={() => irParaSemana(semanaAnterior(semana))}
          aoIrParaSeguinte={() => irParaSemana(semanaSeguinte(semana))}
          aoIrParaAtual={() => irParaSemana(semanaAtual)}
        />
        {conteudo()}
      </div>
    </>
  );
}
