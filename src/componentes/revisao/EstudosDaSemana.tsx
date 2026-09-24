import type { CSSProperties } from 'react';
import { ArrowRight, BookOpen } from 'lucide-react';
import { Botao, CabecalhoPainel, EstadoVazio, Painel } from '@/componentes/ui';
import { coresDaPaleta } from '@/modelos/cores';
import type { EstudosSemanaDTO } from '@/modelos/revisao';
import { formatarDuracao, formatarDuracaoPorExtenso, pluralizar } from '@/utilitarios/formatacao';
import estilos from './EstudosDaSemana.module.css';

export interface EstudosDaSemanaProps {
  estudos: EstudosSemanaDTO;
  aoVerEstudos: () => void;
  className?: string;
}

export function EstudosDaSemana({ estudos, aoVerEstudos, className }: EstudosDaSemanaProps) {
  const maximo = Math.max(1, ...estudos.porAtividade.map((item) => item.minutos));
  const descricao =
    estudos.sessoes === 0
      ? 'Tempo estudado por atividade'
      : `${formatarDuracao(estudos.minutos)} em ${pluralizar(estudos.sessoes, 'sessão', 'sessões')} · ${pluralizar(
          estudos.porAtividade.length,
          'atividade',
          'atividades',
        )}`;

  return (
    <Painel className={className} aria-labelledby="titulo-estudos-semana">
      <CabecalhoPainel
        titulo={<span id="titulo-estudos-semana">Estudos</span>}
        descricao={descricao}
        acao={
          <Botao variante="terciario" tamanho="sm" iconeDireita={ArrowRight} onClick={aoVerEstudos}>
            Ver estudos
          </Botao>
        }
      />

      {estudos.porAtividade.length === 0 ? (
        <EstadoVazio
          compacto
          icone={BookOpen}
          titulo="Nenhuma sessão de estudo nesta semana."
          descricao="As sessões salvas no cronômetro ou lançadas à mão aparecem aqui, somadas por atividade."
        />
      ) : (
        <ul className={estilos.lista}>
          {estudos.porAtividade.map((item) => {
            const cor = coresDaPaleta(item.atividade.cor).texto;
            return (
              <li key={item.atividade.id} className={estilos.item}>
                <span className="visualmente-oculto">
                  {item.atividade.nome}: {formatarDuracaoPorExtenso(item.minutos)} em{' '}
                  {pluralizar(item.sessoes, 'sessão', 'sessões')}.
                </span>
                <span className={estilos.nome} aria-hidden="true">
                  <span className={estilos.cor} style={{ backgroundColor: cor }} />
                  {item.atividade.nome}
                </span>
                <span className={estilos.valores} aria-hidden="true">
                  <strong>{formatarDuracao(item.minutos)}</strong>
                  <span className={estilos.sessoes}>{pluralizar(item.sessoes, 'sessão', 'sessões')}</span>
                </span>
                <span className={estilos.trilho} aria-hidden="true">
                  <span
                    className={estilos.barra}
                    style={{ '--proporcao': item.minutos / maximo, '--cor-barra': cor } as CSSProperties}
                  />
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Painel>
  );
}
