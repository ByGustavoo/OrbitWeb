import { ArrowRight, CalendarPlus, Plus } from 'lucide-react';
import { ItemTarefa } from '@/componentes/tarefas/ItemTarefa';
import { Botao, CabecalhoPainel, EstadoVazio, Painel } from '@/componentes/ui';
import type { ProximaSemanaDTO } from '@/modelos/revisao';
import type { TarefaDTO } from '@/modelos/tarefas';
import { formatarIntervaloDias, formatarNumero } from '@/utilitarios/formatacao';
import estilos from './ProximaSemana.module.css';

export interface ProximaSemanaProps {
  proxima: ProximaSemanaDTO;
  tarefas: TarefaDTO[];
  hojeIso: string;
  idsEnviando: ReadonlySet<number>;
  aoAlternarConclusao: (tarefa: TarefaDTO) => void;
  aoAbrir: (tarefa: TarefaDTO) => void;
  aoNovaTarefa: () => void;
  aoVerCalendario: () => void;
  className?: string;
}

export function ProximaSemana({
  proxima,
  tarefas,
  hojeIso,
  idsEnviando,
  aoAlternarConclusao,
  aoAbrir,
  aoNovaTarefa,
  aoVerCalendario,
  className,
}: ProximaSemanaProps) {
  const restantes = proxima.agendadas - tarefas.length;
  const numeros = [
    { chave: 'agendadas', valor: proxima.agendadas, rotulo: proxima.agendadas === 1 ? 'tarefa agendada' : 'tarefas agendadas' },
    { chave: 'alta', valor: proxima.altaPrioridade, rotulo: 'de prioridade alta ou urgente' },
    {
      chave: 'atrasadas',
      valor: proxima.atrasadasEmAberto,
      rotulo: proxima.atrasadasEmAberto === 1 ? 'atrasada continua em aberto' : 'atrasadas continuam em aberto',
    },
  ];

  return (
    <Painel className={className} aria-labelledby="titulo-proxima-semana">
      <CabecalhoPainel
        titulo={<span id="titulo-proxima-semana">Próxima semana</span>}
        descricao={formatarIntervaloDias(proxima.inicioSemana, proxima.fimSemana)}
        acao={
          <Botao variante="terciario" tamanho="sm" iconeDireita={ArrowRight} onClick={aoVerCalendario}>
            Ver no calendário
          </Botao>
        }
      />

      <dl className={estilos.numeros}>
        {numeros.map((numero) => (
          <div key={numero.chave} className={estilos.numero}>
            <dt className={estilos.rotulo}>{numero.rotulo}</dt>
            <dd className={estilos.valor}>{formatarNumero(numero.valor)}</dd>
          </div>
        ))}
      </dl>

      {tarefas.length === 0 ? (
        <EstadoVazio
          compacto
          icone={CalendarPlus}
          titulo="Nenhuma tarefa agendada para a próxima semana."
          acao={
            <Botao variante="secundario" tamanho="sm" icone={Plus} onClick={aoNovaTarefa}>
              Nova tarefa
            </Botao>
          }
        />
      ) : (
        <>
          <ul className={estilos.lista} aria-label="Tarefas agendadas para a próxima semana">
            {tarefas.map((tarefa, indice) => (
              <ItemTarefa
                key={tarefa.id}
                tarefa={tarefa}
                hojeIso={hojeIso}
                mostrarDia
                indice={indice}
                enviando={idsEnviando.has(tarefa.id)}
                aoAlternarConclusao={aoAlternarConclusao}
                aoAbrir={aoAbrir}
              />
            ))}
          </ul>
          {restantes > 0 ? (
            <p className={estilos.restantes}>
              E mais {restantes === 1 ? '1 tarefa' : `${restantes} tarefas`} no calendário.
            </p>
          ) : null}
        </>
      )}
    </Painel>
  );
}

export interface SemanaSeguinteProps {
  inicioSemana: string;
  fimSemana: string;
  aoIr: () => void;
  className?: string;
}

export function AtalhoSemanaSeguinte({ inicioSemana, fimSemana, aoIr, className }: SemanaSeguinteProps) {
  return (
    <Painel className={className} tom="suave" aria-labelledby="titulo-semana-seguinte">
      <CabecalhoPainel
        titulo={<span id="titulo-semana-seguinte">Semana seguinte</span>}
        descricao="O que estava previsto para depois desta semana já tem a própria revisão."
      />
      <div>
        <Botao variante="secundario" iconeDireita={ArrowRight} onClick={aoIr}>
          Ir para {formatarIntervaloDias(inicioSemana, fimSemana)}
        </Botao>
      </div>
    </Painel>
  );
}
