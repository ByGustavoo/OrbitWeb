import { useEffect, useRef } from 'react';
import { CHAVE_LEMBRETES_EXIBIDOS } from '@/configuracoes/aplicacao';
import { gravarArmazenamentoLocal, lerArmazenamentoLocal } from '@/ganchos/useArmazenamentoLocal';
import { useDadosAssincronos } from '@/ganchos/useDadosAssincronos';
import { useHojeIso } from '@/ganchos/useHojeIso';
import { chaveDoLembrete, inicioDaTarefa, lembreteDevido } from '@/regras/lembrete';
import { servicoTarefas } from '@/servicos';
import { useAcoesTarefa } from './ProvedorAcoesTarefa';
import { useAlteracoes } from './ProvedorAlteracoes';
import { useNotificacoes } from './ProvedorNotificacoes';

const INTERVALO_VERIFICACAO_MS = 30000;

function descreverInicio(inicio: Date, horario: string, agora: Date): string {
  const minutos = Math.round((inicio.getTime() - agora.getTime()) / 60000);
  if (minutos < 0) return `Começou às ${horario}.`;
  if (minutos === 0) return `Começa agora, às ${horario}.`;
  return `Começa às ${horario}, daqui a ${minutos} ${minutos === 1 ? 'minuto' : 'minutos'}.`;
}

export function AgendadorLembretes() {
  const hoje = useHojeIso();
  const { versoes } = useAlteracoes();
  const notificacoes = useNotificacoes();
  const { abrirDetalhes } = useAcoesTarefa();
  const dependencias = useRef({ notificacoes, abrirDetalhes });
  dependencias.current = { notificacoes, abrirDetalhes };

  const tarefas = useDadosAssincronos(
    async (signal) => {
      const doDia = await servicoTarefas.buscarTarefasPorData(hoje, signal);
      return doDia.filter((tarefa) => tarefa.lembreteMinutosAntes !== null);
    },
    [hoje, versoes.tarefas],
  );

  useEffect(() => {
    const comLembrete = tarefas.dados;
    if (!comLembrete || comLembrete.length === 0) return;

    const verificar = () => {
      const agora = new Date();
      const exibidos = lerArmazenamentoLocal<string[]>(CHAVE_LEMBRETES_EXIBIDOS, []).filter((chave) => chave.includes(`@${hoje}T`));
      const novos: string[] = [];

      for (const tarefa of comLembrete) {
        const chave = chaveDoLembrete(tarefa);
        const inicio = inicioDaTarefa(tarefa);
        if (!inicio || !tarefa.horarioInicio || exibidos.includes(chave) || !lembreteDevido(tarefa, agora)) continue;
        novos.push(chave);
        dependencias.current.notificacoes.notificar({
          titulo: `Lembrete: ${tarefa.titulo}`,
          descricao: descreverInicio(inicio, tarefa.horarioInicio, agora),
          variante: 'informacao',
          acao: { rotulo: 'Ver tarefa', aoExecutar: () => dependencias.current.abrirDetalhes(tarefa) },
        });
      }

      if (novos.length > 0) gravarArmazenamentoLocal(CHAVE_LEMBRETES_EXIBIDOS, [...exibidos, ...novos]);
    };

    verificar();
    const intervalo = window.setInterval(verificar, INTERVALO_VERIFICACAO_MS);
    return () => window.clearInterval(intervalo);
  }, [tarefas.dados, hoje]);

  return null;
}
