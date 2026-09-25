import { useEffect, useId, useRef } from 'react';
import type { CSSProperties } from 'react';
import type { LucideIcon } from 'lucide-react';
import { BellRing, BookOpen, Coffee, Pause, Play, SkipForward, Square, Target, Trash2 } from 'lucide-react';
import { Botao, BarraProgresso, Esqueleto, EstadoErro, EstadoVazio, GrupoOpcoes, Painel, Selo } from '@/componentes/ui';
import type { VarianteBotao } from '@/componentes/ui';
import { useAgora } from '@/ganchos/useAgora';
import type { ResultadoAssincrono } from '@/ganchos/useDadosAssincronos';
import { coresDaPaleta } from '@/modelos/cores';
import type { ModoCronometro } from '@/modelos/enumeracoes';
import type { AtividadeEstudoDTO } from '@/modelos/estudos';
import { rotuloFase, useCronometro } from '@/provedores/ProvedorCronometro';
import { lerCronometro } from '@/regras/cronometro';
import type { LeituraCronometro, SessaoEmAndamento } from '@/regras/cronometro';
import type { PreferenciasPomodoro } from '@/regras/preferenciasPomodoro';
import { dataIsoLocal } from '@/utilitarios/datas';
import {
  formatarContagemRegressiva,
  formatarDuracao,
  formatarDuracaoSegundosPorExtenso,
  formatarHorario,
  formatarRelogio,
} from '@/utilitarios/formatacao';
import { juntarClasses } from '@/utilitarios/juntarClasses';
import { SeletorAtividade } from './SeletorAtividade';
import estilos from './Cronometro.module.css';

type EstadoVisual = 'parado' | 'rodando' | 'pausada' | 'faseConcluida' | 'intervalo' | 'encerrando';

export interface CronometroProps {
  atividades: ResultadoAssincrono<AtividadeEstudoDTO[]>;
  idAtividadeNova: number | null;
  aoCriarAtividade: () => void;
  aoPedirDescarte: () => void;
}

const opcoesModo: { valor: ModoCronometro; rotulo: string }[] = [
  { valor: 'LIVRE', rotulo: 'Livre' },
  { valor: 'POMODORO', rotulo: 'Pomodoro' },
];

function estadoVisual(sessao: SessaoEmAndamento | null, leitura: LeituraCronometro | null): EstadoVisual {
  if (!sessao || !leitura) return 'parado';
  if (sessao.encerradaEm) return 'encerrando';
  if (leitura.faseConcluida) return 'faseConcluida';
  if (sessao.estado === 'PAUSADA') return 'pausada';
  if (leitura.fase && leitura.fase !== 'FOCO') return 'intervalo';
  return 'rodando';
}

function legenda(estado: EstadoVisual, leitura: LeituraCronometro | null, modo: ModoCronometro): string {
  if (estado === 'parado') return 'Pronto para estudar';
  if (estado === 'pausada') return 'Sessão pausada';
  if (estado === 'encerrando') return 'Finalizando a sessão';
  if (estado === 'faseConcluida') return leitura?.fase === 'FOCO' ? 'Foco concluído' : 'Pausa concluída';
  if (estado === 'intervalo' && leitura?.fase) return `${rotuloFase[leitura.fase]} · descanse um pouco`;
  return modo === 'POMODORO' ? 'Em foco' : 'Estudando';
}

function descreverInicio(iniciadaEm: string, agora: Date): string {
  const horario = formatarHorario(iniciadaEm);
  return dataIsoLocal(new Date(iniciadaEm)) === dataIsoLocal(agora) ? horario : `Ontem, ${horario}`;
}

function descreverPomodoro(preferencias: PreferenciasPomodoro): string {
  const { focoMinutos, pausaCurtaMinutos, pausaLongaMinutos, ciclosAtePausaLonga } = preferencias;
  return `${formatarDuracao(focoMinutos)} de foco e ${formatarDuracao(pausaCurtaMinutos)} de pausa, com uma pausa de ${formatarDuracao(pausaLongaMinutos)} a cada ${ciclosAtePausaLonga} ciclos. Só o foco conta como estudo.`;
}

interface AcaoControle {
  rotulo: string;
  icone: LucideIcon;
  variante: VarianteBotao;
  aoExecutar: () => void;
}

function EsqueletoSeletor() {
  return (
    <div className={estilos.esqueletoSeletor} role="status" aria-label="Carregando as atividades…">
      {[112, 92, 128].map((largura) => (
        <Esqueleto key={largura} largura={largura} altura={38} raio="var(--raio-pilula)" />
      ))}
    </div>
  );
}

function PontosCiclo({ concluidos, total }: { concluidos: number; total: number }) {
  return (
    <span className={estilos.pontosCiclo} aria-hidden="true">
      {Array.from({ length: total }, (_, indice) => (
        <span key={indice} className={juntarClasses(estilos.pontoCiclo, indice < concluidos && estilos.pontoCicloFeito)} />
      ))}
    </span>
  );
}

export function Cronometro({ atividades, idAtividadeNova, aoCriarAtividade, aoPedirDescarte }: CronometroProps) {
  const idRotuloAtividade = useId();
  const idTitulo = useId();
  const cronometro = useCronometro();
  const { sessao, modoPreferido, atividadeSelecionadaId, preferenciasPomodoro } = cronometro;
  const agora = useAgora(sessao !== null && sessao.estado === 'RODANDO');
  const leitura = sessao ? lerCronometro(sessao, agora) : null;
  const estado = estadoVisual(sessao, leitura);
  const controlesRef = useRef<HTMLDivElement>(null);
  const devolverFocoAosControles = useRef(false);

  useEffect(() => {
    if (!devolverFocoAosControles.current) return;
    const botao = controlesRef.current?.querySelector<HTMLButtonElement>('button:not(:disabled)');
    if (!botao) return;
    devolverFocoAosControles.current = false;
    botao.focus();
  }, [estado]);

  const executarNosControles = (acao: () => void) => {
    devolverFocoAosControles.current = Boolean(controlesRef.current?.contains(document.activeElement));
    acao();
  };

  const ativas = (atividades.dados ?? []).filter((atividade) => !atividade.arquivada);
  const selecionada = ativas.find((atividade) => atividade.id === atividadeSelecionadaId) ?? null;
  const atividadeExibida = sessao?.atividade ?? selecionada;
  const modo = sessao?.modo ?? modoPreferido;
  const semAtividades = !sessao && atividades.dados !== null && ativas.length === 0;
  const cor = atividadeExibida ? coresDaPaleta(atividadeExibida.cor).texto : undefined;

  const ciclosPorConjunto = sessao?.pomodoro?.duracoes.ciclosAtePausaLonga ?? preferenciasPomodoro.ciclosAtePausaLonga;
  const emFoco = leitura?.fase === 'FOCO' && !leitura.faseConcluida;
  const ciclos = leitura?.ciclosConcluidos ?? 0;
  const ciclosNoConjunto = emFoco ? ciclos % ciclosPorConjunto : ciclos === 0 ? 0 : ((ciclos - 1) % ciclosPorConjunto) + 1;

  const tempo = !leitura
    ? modo === 'POMODORO'
      ? formatarContagemRegressiva(preferenciasPomodoro.focoMinutos * 60)
      : formatarRelogio(0)
    : leitura.fase
      ? formatarContagemRegressiva(leitura.segundosRestantesFase)
      : formatarRelogio(leitura.segundosEstudo);
  const descricaoTempo = !leitura
    ? 'Nenhuma sessão em andamento.'
    : leitura.fase
      ? `Faltam ${formatarDuracaoSegundosPorExtenso(leitura.segundosRestantesFase)} de ${rotuloFase[leitura.fase].toLowerCase()}.`
      : `${formatarDuracaoSegundosPorExtenso(leitura.segundosEstudo)} de estudo.`;

  const acoes: AcaoControle[] = (() => {
    const finalizar: AcaoControle = { rotulo: 'Finalizar', icone: Square, variante: 'secundario', aoExecutar: cronometro.encerrar };
    switch (estado) {
      case 'rodando':
        return [{ rotulo: 'Pausar', icone: Pause, variante: 'primario', aoExecutar: cronometro.pausar }, finalizar];
      case 'pausada':
        return [{ rotulo: 'Retomar', icone: Play, variante: 'primario', aoExecutar: cronometro.retomar }, finalizar];
      case 'intervalo':
        return [{ rotulo: 'Pular pausa', icone: SkipForward, variante: 'primario', aoExecutar: cronometro.pularPausa }, finalizar];
      case 'faseConcluida':
        return leitura?.fase === 'FOCO'
          ? [
              {
                rotulo: leitura.proximaFase === 'PAUSA_LONGA' ? 'Iniciar pausa longa' : 'Iniciar pausa',
                icone: Coffee,
                variante: 'primario',
                aoExecutar: cronometro.iniciarProximaFase,
              },
              { rotulo: 'Pular pausa', icone: SkipForward, variante: 'secundario', aoExecutar: cronometro.pularPausa },
              finalizar,
            ]
          : [{ rotulo: 'Voltar ao foco', icone: Target, variante: 'primario', aoExecutar: cronometro.iniciarProximaFase }, finalizar];
      default:
        return [];
    }
  })();

  const iniciar = () => {
    if (!selecionada) return;
    cronometro.iniciar({ atividade: { id: selecionada.id, nome: selecionada.nome, cor: selecionada.cor } });
  };

  const seloEstado = (() => {
    if (estado === 'rodando' || estado === 'intervalo') {
      return (
        <Selo tom="sucesso" className={estilos.seloAoVivo}>
          <span className={estilos.pulso} aria-hidden="true" />
          Em andamento
        </Selo>
      );
    }
    if (estado === 'pausada') {
      return (
        <Selo tom="aviso" icone={Pause}>
          Pausada
        </Selo>
      );
    }
    if (estado === 'faseConcluida') {
      return (
        <Selo tom="info" icone={BellRing}>
          Aguardando você
        </Selo>
      );
    }
    if (estado === 'encerrando') return <Selo tom="neutro">Finalizando</Selo>;
    return null;
  })();

  return (
    <Painel
      className={juntarClasses(estilos.cronometro, sessao && estilos.ativo)}
      data-estado={estado}
      style={cor ? ({ '--cor-atividade': cor } as CSSProperties) : undefined}
      aria-labelledby={idTitulo}
    >
      <h2 id={idTitulo} className="visualmente-oculto">
        Cronômetro
      </h2>

      {sessao ? (
        <div className={estilos.barraSessao}>
          <div className={estilos.selos}>
            {seloEstado}
            {leitura?.fase ? (
              <span className={estilos.ciclo}>
                <PontosCiclo concluidos={ciclosNoConjunto} total={ciclosPorConjunto} />
                {emFoco ? `Ciclo ${ciclosNoConjunto + 1} de ${ciclosPorConjunto}` : `${ciclosNoConjunto} de ${ciclosPorConjunto} ciclos concluídos`}
              </span>
            ) : null}
          </div>
          <span className={estilos.modoAtual}>{sessao.modo === 'POMODORO' ? 'Pomodoro' : 'Modo livre'}</span>
        </div>
      ) : (
        <div className={estilos.preparacao}>
          <div className={estilos.linhaPreparacao}>
            <span className={estilos.rotuloSecao} id={idRotuloAtividade}>
              O que você vai estudar?
            </span>
            <GrupoOpcoes
              rotulo="Modo do cronômetro"
              tamanho="sm"
              opcoes={opcoesModo}
              valor={modoPreferido}
              aoMudar={cronometro.definirModoPreferido}
            />
          </div>
          {atividades.dados === null ? (
            atividades.erro ? (
              <EstadoErro
                compacto
                titulo="Não foi possível carregar as atividades"
                erro={atividades.erro}
                aoTentarNovamente={atividades.recarregar}
                tentando={atividades.carregando}
              />
            ) : (
              <EsqueletoSeletor />
            )
          ) : semAtividades ? null : (
            <SeletorAtividade
              atividades={ativas}
              selecionadaId={selecionada?.id ?? null}
              idDestacada={idAtividadeNova}
              idRotulo={idRotuloAtividade}
              aoSelecionar={cronometro.selecionarAtividade}
              aoCriar={aoCriarAtividade}
            />
          )}
        </div>
      )}

      {semAtividades ? (
        <EstadoVazio
          icone={BookOpen}
          titulo="Você ainda não tem atividades de estudo."
          descricao="Crie uma atividade, como Leitura ou Violão, para começar a cronometrar o seu tempo."
          acao={
            <Botao icone={BookOpen} onClick={aoCriarAtividade}>
              Criar atividade
            </Botao>
          }
          className={estilos.vazio}
        />
      ) : (
        <>
          <div className={estilos.palco}>
            <p className={estilos.legenda}>{legenda(estado, leitura, modo)}</p>
            <p className={juntarClasses(estilos.atividadeAtual, !atividadeExibida && estilos.semAtividade)}>
              {atividadeExibida ? (
                <>
                  <span className={estilos.corAtividade} aria-hidden="true" />
                  {atividadeExibida.nome}
                </>
              ) : (
                'Escolha uma atividade'
              )}
            </p>
            {sessao?.tarefa ? <p className={estilos.tarefa}>Da tarefa “{sessao.tarefa.titulo}”</p> : null}

            <div className={estilos.tempo} role="timer" aria-atomic="true">
              <span aria-hidden="true">{tempo}</span>
              <span className="visualmente-oculto">{descricaoTempo}</span>
            </div>

            {leitura?.fase ? (
              <BarraProgresso
                className={estilos.progressoFase}
                valor={leitura.segundosFase}
                maximo={leitura.duracaoFaseSegundos}
                rotulo={`Andamento de ${rotuloFase[leitura.fase].toLowerCase()}`}
                textoValor={`${formatarDuracaoSegundosPorExtenso(leitura.segundosFase)} de ${formatarDuracaoSegundosPorExtenso(leitura.duracaoFaseSegundos)}`}
                tom={leitura.fase === 'FOCO' ? 'destaque' : 'sucesso'}
              />
            ) : null}
          </div>

          <div className={estilos.controles} key={estado} ref={controlesRef}>
            {estado === 'parado' ? (
              <Botao
                tamanho="lg"
                icone={Play}
                onClick={() => executarNosControles(iniciar)}
                disabled={!selecionada}
                className={estilos.botaoPrincipal}
                aria-describedby={selecionada ? undefined : `${idTitulo}-dica`}
              >
                {modo === 'POMODORO' ? 'Iniciar foco' : 'Iniciar'}
              </Botao>
            ) : (
              acoes.map((acao) => (
                <Botao
                  key={acao.rotulo}
                  tamanho="lg"
                  variante={acao.variante}
                  icone={acao.icone}
                  onClick={() => executarNosControles(acao.aoExecutar)}
                  className={acao.variante === 'primario' ? estilos.botaoPrincipal : estilos.botaoSecundario}
                >
                  {acao.rotulo}
                </Botao>
              ))
            )}
          </div>

          {sessao && leitura ? (
            <div className={estilos.rodape}>
              <dl className={estilos.informacoes}>
                <div>
                  <dt>Início</dt>
                  <dd>{descreverInicio(sessao.iniciadaEm, agora)}</dd>
                </div>
                {leitura.fase ? (
                  <div>
                    <dt>Tempo de estudo</dt>
                    <dd className="numeros">{formatarRelogio(leitura.segundosEstudo)}</dd>
                  </div>
                ) : (
                  <div>
                    <dt>Pausas</dt>
                    <dd>{sessao.pausas}</dd>
                  </div>
                )}
              </dl>
              {estado !== 'encerrando' ? (
                <Botao variante="terciario" tamanho="sm" icone={Trash2} className={estilos.descartar} onClick={aoPedirDescarte}>
                  Descartar sessão
                </Botao>
              ) : null}
            </div>
          ) : (
            <p className={estilos.dica} id={`${idTitulo}-dica`}>
              {!selecionada && atividades.dados !== null
                ? 'Escolha uma atividade acima para começar.'
                : modo === 'POMODORO'
                  ? descreverPomodoro(preferenciasPomodoro)
                  : 'O tempo continua contando se você mudar de tela, trocar de aba ou recarregar a página.'}
            </p>
          )}
        </>
      )}
    </Painel>
  );
}
