import { CircleCheck, Target } from 'lucide-react';
import { BarraProgresso, CabecalhoPainel, ConteudoAssincrono, EsqueletoLista, EstadoVazio, Painel } from '@/componentes/ui';
import type { ResultadoAssincrono } from '@/ganchos/useDadosAssincronos';
import { coresDaPaleta } from '@/modelos/cores';
import type { ProgressoMetaDTO } from '@/modelos/estudos';
import { formatarDuracao, formatarDuracaoPorExtenso } from '@/utilitarios/formatacao';
import estilos from './ProgressoMetas.module.css';

export interface ProgressoMetasProps {
  resultado: ResultadoAssincrono<ProgressoMetaDTO[]>;
  semanaEncerrada?: boolean;
  className?: string;
}

export function ProgressoMetas({ resultado, semanaEncerrada = false, className }: ProgressoMetasProps) {
  return (
    <Painel className={className} aria-labelledby="titulo-metas">
      <CabecalhoPainel titulo={<span id="titulo-metas">Metas da semana</span>} descricao="Horas de estudo por atividade, de domingo a sábado" />

      <ConteudoAssincrono
        resultado={resultado}
        tituloErro="Não foi possível carregar as metas"
        esqueleto={<EsqueletoLista linhas={3} rotulo="Carregando as metas…" />}
      >
        {(metas) =>
          metas.length === 0 ? (
            <EstadoVazio
              compacto
              icone={Target}
              titulo="Nenhuma meta definida."
              descricao="Defina uma meta semanal para cada atividade na página Estudos e acompanhe o progresso aqui."
            />
          ) : (
            <ul className={estilos.lista}>
              {metas.map((meta) => {
                const batida = meta.minutosRealizados >= meta.metaMinutos;
                const faltam = Math.max(0, meta.metaMinutos - meta.minutosRealizados);
                return (
                  <li key={meta.atividade.id} className={estilos.item}>
                    <div className={estilos.linha}>
                      <span className={estilos.nome}>
                        <span className={estilos.cor} style={{ backgroundColor: coresDaPaleta(meta.atividade.cor).texto }} aria-hidden="true" />
                        {meta.atividade.nome}
                      </span>
                      <span className={estilos.valores}>
                        <strong>{formatarDuracao(meta.minutosRealizados)}</strong> de {formatarDuracao(meta.metaMinutos)}
                      </span>
                    </div>
                    <BarraProgresso
                      valor={meta.minutosRealizados}
                      maximo={meta.metaMinutos}
                      rotulo={`Meta de ${meta.atividade.nome}`}
                      textoValor={`${formatarDuracaoPorExtenso(meta.minutosRealizados)} de ${formatarDuracaoPorExtenso(meta.metaMinutos)}`}
                      tom={batida ? 'sucesso' : 'destaque'}
                    />
                    <span className={batida ? estilos.batida : estilos.falta}>
                      {batida ? (
                        <>
                          <CircleCheck size={13} strokeWidth={2.25} aria-hidden="true" />
                          Meta batida
                        </>
                      ) : (
                        `${semanaEncerrada ? 'Faltaram' : 'Faltam'} ${formatarDuracao(faltam)}`
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          )
        }
      </ConteudoAssincrono>
    </Painel>
  );
}
