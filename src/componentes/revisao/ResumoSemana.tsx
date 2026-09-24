import type { ReactNode } from 'react';
import { BookOpen, CalendarCheck, CircleCheck, CirclePlus, Clock, Percent, Timer } from 'lucide-react';
import { IndicadorNumerico } from '@/componentes/dashboard/IndicadorNumerico';
import type { RevisaoSemanalDTO } from '@/modelos/revisao';
import { compararComSemanaAnterior, compararTaxas } from '@/regras/revisaoSemanal';
import { formatarDuracao, formatarNumero, pluralizar } from '@/utilitarios/formatacao';
import estilos from './ResumoSemana.module.css';

export interface ResumoSemanaProps {
  revisao: RevisaoSemanalDTO;
}

function Contexto({ fato, comparacao }: { fato?: string; comparacao: string }) {
  return (
    <>
      {fato ? <span className={estilos.fato}>{fato}</span> : null}
      <span className={estilos.comparacao}>{comparacao}</span>
    </>
  );
}

export function ResumoSemana({ revisao }: ResumoSemanaProps) {
  const { resumo, semanaAnterior: anterior, diasDecorridos } = revisao;
  const comparar = (atual: number, antes: number, formatar: (valor: number) => string = formatarNumero): ReactNode => (
    <Contexto comparacao={compararComSemanaAnterior(atual, antes, formatar)} />
  );
  const taxa = resumo.taxaConclusao;

  return (
    <section className={estilos.secao} aria-labelledby="titulo-resumo-semana">
      <h2 id="titulo-resumo-semana" className="visualmente-oculto">
        Resumo da semana
      </h2>
      <dl className={estilos.grade}>
        <IndicadorNumerico
          icone={CircleCheck}
          rotulo="Tarefas concluídas"
          valor={resumo.concluidas}
          tom="sucesso"
          contexto={comparar(resumo.concluidas, anterior.concluidas)}
        />
        <IndicadorNumerico
          icone={CirclePlus}
          rotulo="Tarefas criadas"
          valor={resumo.criadas}
          tom="destaque"
          contexto={comparar(resumo.criadas, anterior.criadas)}
        />
        <IndicadorNumerico
          icone={Clock}
          rotulo="Atrasadas"
          valor={resumo.atrasadas}
          tom={resumo.atrasadas > 0 ? 'erro' : 'neutro'}
          contexto={<Contexto fato="Planejadas para a semana" comparacao={compararComSemanaAnterior(resumo.atrasadas, anterior.atrasadas, formatarNumero)} />}
        />
        <IndicadorNumerico
          icone={Percent}
          rotulo="Taxa de conclusão"
          valor={taxa === null ? 0 : Math.round(taxa * 100)}
          formatar={(valor) => (taxa === null ? '—' : `${Math.round(valor)}%`)}
          contexto={
            <Contexto
              fato={
                resumo.planejadas === 0
                  ? revisao.emAndamento
                    ? 'Nenhuma tarefa planejada até hoje'
                    : 'Nenhuma tarefa planejada'
                  : `${resumo.planejadasConcluidas} de ${pluralizar(resumo.planejadas, 'planejada', 'planejadas')}${revisao.emAndamento ? ' até hoje' : ''}`
              }
              comparacao={compararTaxas(taxa, anterior.taxaConclusao)}
            />
          }
        />
        <IndicadorNumerico
          className={estilos.largo}
          icone={BookOpen}
          rotulo="Tempo de estudo"
          valor={resumo.minutosEstudo}
          formatar={(valor) => formatarDuracao(valor)}
          tom="destaque"
          contexto={comparar(resumo.minutosEstudo, anterior.minutosEstudo, formatarDuracao)}
        />
        <IndicadorNumerico
          icone={Timer}
          rotulo="Sessões de estudo"
          valor={resumo.sessoes}
          contexto={comparar(resumo.sessoes, anterior.sessoes)}
        />
        <IndicadorNumerico
          icone={CalendarCheck}
          rotulo="Dias com atividade"
          valor={resumo.diasComAtividade}
          unidade={() => `de ${diasDecorridos}`}
          contexto={comparar(resumo.diasComAtividade, anterior.diasComAtividade)}
        />
      </dl>
    </section>
  );
}
