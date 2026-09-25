import { ArrowRight, BookOpen, CircleCheck } from 'lucide-react';
import { BarraProgresso, Botao, CabecalhoPainel, EstadoVazio, Painel } from '@/componentes/ui';
import { coresDaPaleta } from '@/modelos/cores';
import type { ResumoAtividadeDTO } from '@/modelos/tarefas';
import type { EstudosSemanaDTO } from '@/modelos/revisao';
import { formatarDuracao, formatarDuracaoPorExtenso, pluralizar } from '@/utilitarios/formatacao';
import estilos from './EstudosDaSemana.module.css';

export interface EstudosDaSemanaProps {
  estudos: EstudosSemanaDTO;
  semanaEncerrada: boolean;
  aoVerEstudos: () => void;
  className?: string;
}

interface LinhaEstudo {
  atividade: ResumoAtividadeDTO;
  minutos: number;
  sessoes: number;
  metaMinutos: number | null;
}

function montarLinhas(estudos: EstudosSemanaDTO): LinhaEstudo[] {
  const metas = new Map(estudos.metas.map((meta) => [meta.atividade.id, meta]));
  const linhas: LinhaEstudo[] = estudos.porAtividade.map((item) => ({
    atividade: item.atividade,
    minutos: item.minutos,
    sessoes: item.sessoes,
    metaMinutos: metas.get(item.atividade.id)?.metaMinutos ?? null,
  }));
  const estudadas = new Set(linhas.map((linha) => linha.atividade.id));
  for (const meta of estudos.metas) {
    if (estudadas.has(meta.atividade.id)) continue;
    linhas.push({ atividade: meta.atividade, minutos: meta.minutosRealizados, sessoes: 0, metaMinutos: meta.metaMinutos });
  }
  return linhas;
}

function descreverSituacao(linha: LinhaEstudo, semanaEncerrada: boolean): string {
  if (linha.metaMinutos === null) return 'Sem meta';
  const faltam = Math.max(0, linha.metaMinutos - linha.minutos);
  return `${semanaEncerrada ? 'Faltaram' : 'Faltam'} ${formatarDuracao(faltam)}`;
}

export function EstudosDaSemana({ estudos, semanaEncerrada, aoVerEstudos, className }: EstudosDaSemanaProps) {
  const linhas = montarLinhas(estudos);
  const descricao =
    estudos.sessoes === 0
      ? 'Tempo estudado e metas por atividade, de domingo a sábado'
      : `${formatarDuracao(estudos.minutos)} em ${pluralizar(estudos.sessoes, 'sessão', 'sessões')} · ${pluralizar(
          estudos.porAtividade.length,
          'atividade estudada',
          'atividades estudadas',
        )}`;

  return (
    <Painel className={className} aria-labelledby="titulo-estudos-semana">
      <CabecalhoPainel
        titulo={<span id="titulo-estudos-semana">Estudos da semana</span>}
        descricao={descricao}
        acao={
          <Botao variante="terciario" tamanho="sm" iconeDireita={ArrowRight} onClick={aoVerEstudos}>
            Ver estudos
          </Botao>
        }
      />

      {linhas.length === 0 ? (
        <EstadoVazio
          compacto
          icone={BookOpen}
          titulo="Nenhuma sessão de estudo nesta semana."
          descricao="As sessões salvas no cronômetro ou lançadas à mão aparecem aqui, somadas por atividade, junto das metas."
        />
      ) : (
        <ul className={estilos.lista}>
          {linhas.map((linha) => {
            const cor = coresDaPaleta(linha.atividade.cor).texto;
            const batida = linha.metaMinutos !== null && linha.minutos >= linha.metaMinutos;
            return (
              <li key={linha.atividade.id} className={estilos.item}>
                <div className={estilos.linha}>
                  <span className={estilos.nome}>
                    <span className={estilos.cor} style={{ backgroundColor: cor }} aria-hidden="true" />
                    {linha.atividade.nome}
                  </span>
                  <span className={estilos.valores}>
                    <strong>{formatarDuracao(linha.minutos)}</strong>
                    {linha.metaMinutos !== null ? ` de ${formatarDuracao(linha.metaMinutos)}` : null}
                  </span>
                </div>
                {linha.metaMinutos !== null ? (
                  <BarraProgresso
                    valor={linha.minutos}
                    maximo={linha.metaMinutos}
                    rotulo={`Meta de ${linha.atividade.nome}`}
                    textoValor={`${formatarDuracaoPorExtenso(linha.minutos)} de ${formatarDuracaoPorExtenso(linha.metaMinutos)}`}
                    tom={batida ? 'sucesso' : 'destaque'}
                  />
                ) : (
                  <span className={estilos.semBarra} aria-hidden="true" />
                )}
                <div className={estilos.rodape}>
                  {batida ? (
                    <span className={estilos.batida}>
                      <CircleCheck size={13} strokeWidth={2.25} aria-hidden="true" />
                      Meta batida
                    </span>
                  ) : (
                    <span className={estilos.situacao}>{descreverSituacao(linha, semanaEncerrada)}</span>
                  )}
                  <span className={estilos.sessoes}>{pluralizar(linha.sessoes, 'sessão', 'sessões')}</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Painel>
  );
}
