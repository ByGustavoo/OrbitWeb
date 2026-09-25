import { useId, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { BookOpen, CircleCheck } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { GraficoBarras } from '@/componentes/graficos/GraficoBarras';
import type { PontoGraficoBarras } from '@/componentes/graficos/GraficoBarras';
import { CabecalhoPainel, ConteudoAssincrono, Esqueleto, EstadoVazio, GrupoOpcoes, Painel } from '@/componentes/ui';
import { PONTOS_QUEBRA } from '@/configuracoes/aplicacao';
import { useConsultaMidia } from '@/ganchos/useConsultaMidia';
import type { ResultadoAssincrono } from '@/ganchos/useDadosAssincronos';
import type { ResumoDashboardDTO } from '@/modelos/painel';
import { deDataIso } from '@/utilitarios/datas';
import {
  formatarDecimal,
  formatarDiaCompleto,
  formatarDiaMesCurto,
  formatarDuracao,
  formatarDuracaoPorExtenso,
  pluralizar,
} from '@/utilitarios/formatacao';
import { juntarClasses } from '@/utilitarios/juntarClasses';
import estilos from './PainelProdutividade.module.css';

export type PeriodoProdutividade = '7' | '30';
type Metrica = 'tarefas' | 'estudo';

const OPCOES_PERIODO = [
  { valor: '7' as const, rotulo: '7 dias' },
  { valor: '30' as const, rotulo: '30 dias' },
];

const DIAS_SEMANA_CURTOS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] as const;

export interface PainelProdutividadeProps {
  resultado: ResultadoAssincrono<ResumoDashboardDTO>;
  periodo: PeriodoProdutividade;
  aoMudarPeriodo: (periodo: PeriodoProdutividade) => void;
  className?: string;
}

interface DefinicaoMetrica {
  chave: Metrica;
  icone: LucideIcon;
  rotulo: string;
  total: string;
  media: string;
  pontos: PontoGraficoBarras[];
  formatarValor: (valor: number) => string;
  formatarEixo: (valor: number) => string;
  marcasEixo?: number[];
  vazio: string;
}

function marcasDeMinutos(maximo: number): number[] {
  const passo = maximo <= 90 ? 30 : maximo <= 240 ? 60 : maximo <= 480 ? 120 : 240;
  const topo = Math.max(passo, Math.ceil(maximo / passo) * passo);
  return Array.from({ length: topo / passo + 1 }, (_, indice) => indice * passo);
}

function formatarMinutosEixo(valor: number): string {
  if (valor === 0) return '0';
  if (valor < 60) return `${valor}min`;
  return valor % 60 === 0 ? `${valor / 60}h` : `${Math.floor(valor / 60)}h${valor % 60}`;
}

function rotuloEixo(data: string, periodoLongo: boolean, estreito: boolean): string {
  const dia = deDataIso(data);
  if (periodoLongo) return `${dia.getDate()}/${dia.getMonth() + 1}`;
  const semana = DIAS_SEMANA_CURTOS[dia.getDay()] ?? '';
  return estreito ? semana : `${semana} ${dia.getDate()}`;
}

function montarMetricas(resumo: ResumoDashboardDTO, periodo: PeriodoProdutividade, estreito: boolean): DefinicaoMetrica[] {
  const dias = Number(periodo);
  const periodoLongo = dias > 7;
  const rotulo = (data: string) => rotuloEixo(data, periodoLongo, estreito);
  const totalTarefas = resumo.concluidasPorDia.reduce((soma, dia) => soma + dia.quantidade, 0);
  const totalMinutos = resumo.minutosEstudoPorDia.reduce((soma, dia) => soma + dia.minutos, 0);

  return [
    {
      chave: 'tarefas',
      icone: CircleCheck,
      rotulo: 'Tarefas concluídas',
      total: String(totalTarefas),
      media: `média de ${formatarDecimal(totalTarefas / dias)} por dia`,
      pontos: resumo.concluidasPorDia.map((dia) => ({
        chave: dia.data,
        rotulo: rotulo(dia.data),
        rotuloCompleto: formatarDiaCompleto(dia.data),
        valor: dia.quantidade,
      })),
      formatarValor: (valor) => pluralizar(valor, 'tarefa concluída', 'tarefas concluídas'),
      formatarEixo: String,
      vazio: 'Nenhuma tarefa concluída neste período.',
    },
    {
      chave: 'estudo',
      icone: BookOpen,
      rotulo: 'Tempo de estudo',
      total: formatarDuracao(totalMinutos),
      media: `média de ${formatarDuracao(totalMinutos / dias)} por dia`,
      pontos: resumo.minutosEstudoPorDia.map((dia) => ({
        chave: dia.data,
        rotulo: rotulo(dia.data),
        rotuloCompleto: formatarDiaCompleto(dia.data),
        valor: dia.minutos,
      })),
      formatarValor: formatarDuracaoPorExtenso,
      formatarEixo: formatarMinutosEixo,
      marcasEixo: marcasDeMinutos(Math.max(0, ...resumo.minutosEstudoPorDia.map((dia) => dia.minutos))),
      vazio: 'Nenhum estudo registrado neste período.',
    },
  ];
}

function EsqueletoProdutividade() {
  return (
    <div className={estilos.esqueleto} role="status" aria-label="Carregando a produtividade…">
      <div className={estilos.abas}>
        <Esqueleto altura={72} raio="var(--raio-md)" />
        <Esqueleto altura={72} raio="var(--raio-md)" />
      </div>
      <Esqueleto altura={220} raio="var(--raio-md)" />
    </div>
  );
}

export function PainelProdutividade({ resultado, periodo, aoMudarPeriodo, className }: PainelProdutividadeProps) {
  const [metrica, setMetrica] = useState<Metrica>('tarefas');
  const idBase = useId();
  const atualizando = resultado.carregando && resultado.dados !== null;
  const estreito = useConsultaMidia(`(max-width: ${PONTOS_QUEBRA.estreito}px)`);

  const aoTeclar = (evento: KeyboardEvent<HTMLDivElement>) => {
    if (evento.key !== 'ArrowLeft' && evento.key !== 'ArrowRight' && evento.key !== 'Home' && evento.key !== 'End') return;
    evento.preventDefault();
    const proxima: Metrica = evento.key === 'Home' ? 'tarefas' : evento.key === 'End' ? 'estudo' : metrica === 'tarefas' ? 'estudo' : 'tarefas';
    setMetrica(proxima);
    document.getElementById(`${idBase}-aba-${proxima}`)?.focus();
  };

  return (
    <Painel className={className} aria-labelledby="titulo-produtividade">
      <CabecalhoPainel
        titulo={<span id="titulo-produtividade">Produtividade</span>}
        descricao={`Nos últimos ${periodo} dias, até hoje`}
        acao={
          <GrupoOpcoes
            rotulo="Período da produtividade"
            tamanho="sm"
            opcoes={OPCOES_PERIODO}
            valor={periodo}
            aoMudar={aoMudarPeriodo}
          />
        }
      />

      <ConteudoAssincrono
        resultado={resultado}
        tituloErro="Não foi possível carregar a produtividade"
        esqueleto={<EsqueletoProdutividade />}
      >
        {(resumo) => {
          const metricas = montarMetricas(resumo, periodo, estreito);
          const ativa = metricas.find((item) => item.chave === metrica) ?? metricas[0];
          if (!ativa) return null;
          const vazio = ativa.pontos.every((ponto) => ponto.valor === 0);
          const inicio = resumo.dataInicial;
          const fim = resumo.dataFinal;

          return (
            <div className={juntarClasses(estilos.conteudo, atualizando && estilos.atualizando)} aria-busy={atualizando || undefined}>
              <div className={estilos.abas} role="tablist" aria-label="Métrica do gráfico" onKeyDown={aoTeclar}>
                {metricas.map((item) => {
                  const selecionada = item.chave === ativa.chave;
                  const Icone = item.icone;
                  return (
                    <button
                      key={item.chave}
                      id={`${idBase}-aba-${item.chave}`}
                      type="button"
                      role="tab"
                      aria-selected={selecionada}
                      aria-controls={`${idBase}-painel`}
                      tabIndex={selecionada ? 0 : -1}
                      className={juntarClasses(estilos.aba, selecionada && estilos.abaSelecionada)}
                      onClick={() => setMetrica(item.chave)}
                    >
                      <span className={estilos.abaRotulo}>
                        <Icone size={14} strokeWidth={2.25} aria-hidden="true" />
                        {item.rotulo}
                      </span>
                      <span className={estilos.abaTotal}>{item.total}</span>
                      <span className={estilos.abaMedia}>{item.media}</span>
                    </button>
                  );
                })}
              </div>

              <div id={`${idBase}-painel`} role="tabpanel" aria-labelledby={`${idBase}-aba-${ativa.chave}`} className={estilos.painelGrafico}>
                {vazio ? (
                  <EstadoVazio compacto icone={ativa.icone} titulo={ativa.vazio} descricao="Quando houver registros, eles aparecem aqui por dia." />
                ) : (
                  <GraficoBarras
                    key={`${ativa.chave}-${periodo}`}
                    dados={ativa.pontos}
                    titulo={`${ativa.rotulo} por dia, de ${formatarDiaMesCurto(inicio)} a ${formatarDiaMesCurto(fim)}`}
                    resumo={`Total de ${ativa.total}, ${ativa.media}.`}
                    rotuloValor={ativa.rotulo}
                    formatarValor={ativa.formatarValor}
                    formatarEixo={ativa.formatarEixo}
                    marcasEixo={ativa.marcasEixo}
                    passoEixo={periodo === '30' ? (estreito ? 9 : 4) : 0}
                    preencher
                  />
                )}
              </div>
            </div>
          );
        }}
      </ConteudoAssincrono>
    </Painel>
  );
}
