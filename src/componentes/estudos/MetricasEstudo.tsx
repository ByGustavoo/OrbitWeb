import { CalendarRange, Clock, Gauge, Layers } from 'lucide-react';
import { IndicadorNumerico } from '@/componentes/dashboard/IndicadorNumerico';
import { Esqueleto, EstadoErro } from '@/componentes/ui';
import type { ResultadoAssincrono } from '@/ganchos/useDadosAssincronos';
import type { ResumoEstudosDTO } from '@/modelos/estudos';
import { formatarDuracao, pluralizar } from '@/utilitarios/formatacao';
import estilos from './MetricasEstudo.module.css';

export interface MetricasEstudoProps {
  semana: ResultadoAssincrono<ResumoEstudosDTO>;
  hojeIso: string;
}

const paraMinutos = (segundos: number) => Math.round(segundos / 60);

function EsqueletoMetrica() {
  return (
    <div className={estilos.esqueleto} aria-hidden="true">
      <Esqueleto largura="55%" altura={16} />
      <Esqueleto largura={72} altura={28} raio="var(--raio-sm)" />
      <Esqueleto largura="70%" altura={11} />
    </div>
  );
}

export function MetricasEstudo({ semana, hojeIso }: MetricasEstudoProps) {
  const dados = semana.dados;

  if (!dados && semana.erro) {
    return (
      <EstadoErro
        compacto
        titulo="Não foi possível carregar as métricas"
        descricao="Verifique a conexão e tente de novo."
        aoTentarNovamente={semana.recarregar}
        tentando={semana.carregando}
        className={estilos.erro}
      />
    );
  }

  const hoje = dados?.porDia.find((dia) => dia.data === hojeIso);
  const diasComEstudo = dados?.porDia.filter((dia) => dia.segundos > 0).length ?? 0;
  const maisEstudada = dados?.porAtividade[0] ?? null;

  return (
    <section className={estilos.secao} aria-labelledby="titulo-metricas">
      <h2 id="titulo-metricas" className="visualmente-oculto">
        Métricas de estudo
      </h2>
      <dl className={estilos.grade} aria-busy={!dados || undefined}>
        {!dados ? (
          <>
            <EsqueletoMetrica />
            <EsqueletoMetrica />
            <EsqueletoMetrica />
            <EsqueletoMetrica />
          </>
        ) : (
          <>
            <IndicadorNumerico
              icone={Clock}
              rotulo="Hoje"
              valor={paraMinutos(hoje?.segundos ?? 0)}
              formatar={formatarDuracao}
              tom="destaque"
              contexto={hoje && hoje.sessoes > 0 ? `em ${pluralizar(hoje.sessoes, 'sessão', 'sessões')}` : 'Nenhuma sessão ainda'}
            />
            <IndicadorNumerico
              icone={CalendarRange}
              rotulo="Esta semana"
              valor={paraMinutos(dados.totalSegundos)}
              formatar={formatarDuracao}
              contexto={diasComEstudo > 0 ? `${pluralizar(diasComEstudo, 'dia', 'dias')} com estudo` : 'De domingo a sábado'}
            />
            <IndicadorNumerico
              icone={Layers}
              rotulo="Sessões na semana"
              valor={dados.totalSessoes}
              contexto={maisEstudada ? `Mais estudada: ${maisEstudada.atividade.nome}` : 'Nenhuma sessão nesta semana'}
            />
            <IndicadorNumerico
              icone={Gauge}
              rotulo="Média por sessão"
              valor={paraMinutos(dados.mediaSegundosPorSessao)}
              formatar={formatarDuracao}
              contexto="nesta semana"
            />
          </>
        )}
      </dl>
    </section>
  );
}
