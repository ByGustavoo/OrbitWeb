import { AlertTriangle, CircleCheck, CircleDashed, Clock, Flame } from 'lucide-react';
import { EstadoErro, Esqueleto } from '@/componentes/ui';
import type { ResultadoAssincrono } from '@/ganchos/useDadosAssincronos';
import type { ResumoDashboardDTO, SequenciaDTO } from '@/modelos/painel';
import { pluralizar } from '@/utilitarios/formatacao';
import { IndicadorNumerico } from './IndicadorNumerico';
import estilos from './ResumoIndicadores.module.css';

export interface ResumoIndicadoresProps {
  resumo: ResultadoAssincrono<ResumoDashboardDTO>;
  sequencia: ResultadoAssincrono<SequenciaDTO>;
}

function EsqueletoIndicador() {
  return (
    <div className={estilos.esqueleto} aria-hidden="true">
      <Esqueleto largura="55%" altura={16} />
      <Esqueleto largura={52} altura={28} raio="var(--raio-sm)" />
      <Esqueleto largura="70%" altura={11} />
    </div>
  );
}

function IndicadorSequencia({ sequencia }: { sequencia: ResultadoAssincrono<SequenciaDTO> }) {
  if (sequencia.dados === null) {
    if (!sequencia.erro) return <EsqueletoIndicador />;
    return (
      <IndicadorNumerico
        className={estilos.celulaSequencia}
        icone={Flame}
        rotulo="Sequência"
        valor={0}
        tom="neutro"
        contexto={
          <button type="button" className={estilos.tentar} onClick={sequencia.recarregar}>
            Não carregou. Tentar de novo
          </button>
        }
      />
    );
  }

  const { atual, recorde, contaHoje } = sequencia.dados;
  const contexto =
    atual === 0
      ? 'Conclua uma tarefa ou estude hoje para começar'
      : !contaHoje
        ? 'Conclua uma tarefa ou estude hoje para manter'
        : atual >= recorde
          ? 'Seu melhor resultado até agora'
          : `Recorde de ${pluralizar(recorde, 'dia', 'dias')}`;

  return (
    <IndicadorNumerico
      className={estilos.celulaSequencia}
      icone={Flame}
      rotulo="Sequência"
      valor={atual}
      unidade={(valor) => (valor === 1 ? 'dia' : 'dias')}
      contexto={contexto}
      tom={atual > 0 ? 'sequencia' : 'neutro'}
    />
  );
}

export function ResumoIndicadores({ resumo, sequencia }: ResumoIndicadoresProps) {
  return (
    <section className={estilos.secao} aria-labelledby="titulo-resumo">
      <h2 id="titulo-resumo" className="visualmente-oculto">
        Resumo
      </h2>

      {resumo.dados === null && resumo.erro ? (
        <EstadoErro
          compacto
          titulo="Não foi possível carregar o resumo"
          descricao="Verifique a conexão e tente de novo. Se continuar, tente daqui a pouco."
          aoTentarNovamente={resumo.recarregar}
          className={estilos.erro}
        />
      ) : (
        <dl className={estilos.grade} aria-busy={resumo.dados === null || undefined}>
          {resumo.dados === null ? (
            <>
              <EsqueletoIndicador />
              <EsqueletoIndicador />
              <EsqueletoIndicador />
              <EsqueletoIndicador />
            </>
          ) : (
            <>
              <IndicadorNumerico
                icone={CircleCheck}
                rotulo="Concluídas"
                valor={resumo.dados.contagens.concluidas}
                contexto="nesta semana"
                tom={resumo.dados.contagens.concluidas > 0 ? 'sucesso' : 'neutro'}
              />
              <IndicadorNumerico
                icone={CircleDashed}
                rotulo="Pendentes"
                valor={resumo.dados.contagens.pendentes + resumo.dados.contagens.emAndamento}
                contexto={
                  resumo.dados.contagens.emAndamento > 0
                    ? `nesta semana · ${formatarEmAndamento(resumo.dados.contagens.emAndamento)}`
                    : 'nesta semana'
                }
              />
              <IndicadorNumerico
                icone={Clock}
                rotulo="Atrasadas"
                valor={resumo.dados.contagens.atrasadas}
                contexto={resumo.dados.contagens.atrasadas > 0 ? 'já passaram do prazo' : 'nada ficou para trás'}
                tom={resumo.dados.contagens.atrasadas > 0 ? 'erro' : 'neutro'}
              />
              <IndicadorNumerico
                icone={AlertTriangle}
                rotulo="Urgentes"
                valor={resumo.dados.contagens.urgentes}
                contexto={resumo.dados.contagens.urgentes > 0 ? 'em aberto, com qualquer data' : 'nenhuma em aberto'}
                tom={resumo.dados.contagens.urgentes > 0 ? 'urgente' : 'neutro'}
              />
            </>
          )}
          <IndicadorSequencia sequencia={sequencia} />
        </dl>
      )}
    </section>
  );
}

function formatarEmAndamento(quantidade: number): string {
  return `${quantidade} em andamento`;
}
