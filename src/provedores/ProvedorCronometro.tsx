import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { CHAVE_PREFERENCIAS_CRONOMETRO, CHAVE_PREFERENCIAS_POMODORO, CHAVE_SESSAO_ESTUDO } from '@/configuracoes/aplicacao';
import { gravarArmazenamentoLocal, lerArmazenamentoLocal } from '@/ganchos/useArmazenamentoLocal';
import { useAgora } from '@/ganchos/useAgora';
import type { ModoCronometro } from '@/modelos/enumeracoes';
import type { ResumoTarefaSessaoDTO, SessaoEstudoDTO } from '@/modelos/estudos';
import type { ResumoAtividadeDTO } from '@/modelos/tarefas';
import {
  continuarSessao,
  encerrarSessao,
  iniciarProximaFase as iniciarProximaFaseRegra,
  iniciarSessao,
  instanteFimDaFase,
  lerCronometro,
  lerSessaoSalva,
  montarEnvioSessao,
  pausarSessao,
  pularPausa as pularPausaRegra,
  retomarSessao,
} from '@/regras/cronometro';
import type { FasePomodoro, LeituraCronometro, SessaoEmAndamento } from '@/regras/cronometro';
import { duracoesDasPreferencias, lerPreferenciasPomodoro } from '@/regras/preferenciasPomodoro';
import type { PreferenciasPomodoro } from '@/regras/preferenciasPomodoro';
import { servicoSessoes } from '@/servicos';
import { formatarContagemRegressiva, formatarDuracao, formatarDuracaoPorExtenso, formatarDuracaoSegundos, formatarRelogio } from '@/utilitarios/formatacao';
import { prepararSom, tocarAviso } from '@/utilitarios/som';
import { definirTituloDestaque } from '@/utilitarios/tituloDocumento';
import { useAlteracoes } from './ProvedorAlteracoes';
import { useNotificacoes } from './ProvedorNotificacoes';

interface PreferenciasCronometro {
  modo: ModoCronometro;
  atividadeId: number | null;
}

export const rotuloFase: Record<FasePomodoro, string> = {
  FOCO: 'Foco',
  PAUSA_CURTA: 'Pausa curta',
  PAUSA_LONGA: 'Pausa longa',
};

const rotuloFaseConcluida: Record<FasePomodoro, string> = {
  FOCO: 'Foco concluído',
  PAUSA_CURTA: 'Pausa concluída',
  PAUSA_LONGA: 'Pausa concluída',
};

const anuncioFaseIniciada: Record<FasePomodoro, string> = {
  FOCO: 'Foco iniciado.',
  PAUSA_CURTA: 'Pausa curta iniciada.',
  PAUSA_LONGA: 'Pausa longa iniciada.',
};

interface ValorContextoCronometro {
  sessao: SessaoEmAndamento | null;
  modoPreferido: ModoCronometro;
  atividadeSelecionadaId: number | null;
  salvando: boolean;
  anuncio: string;
  preferenciasPomodoro: PreferenciasPomodoro;
  definirPreferenciasPomodoro: (parcial: Partial<PreferenciasPomodoro>) => void;
  definirModoPreferido: (modo: ModoCronometro) => void;
  selecionarAtividade: (id: number | null) => void;
  iniciar: (dados: { atividade: ResumoAtividadeDTO; tarefa?: ResumoTarefaSessaoDTO | null; modo?: ModoCronometro }) => boolean;
  pausar: () => void;
  retomar: () => void;
  iniciarProximaFase: () => void;
  pularPausa: () => void;
  encerrar: () => void;
  continuar: () => void;
  descartar: () => void;
  salvar: (opcoes: { observacao: string; duracaoSegundos: number | null }) => Promise<SessaoEstudoDTO | null>;
}

const ContextoCronometro = createContext<ValorContextoCronometro | null>(null);

function lerSessaoArmazenada(): SessaoEmAndamento | null {
  return lerSessaoSalva(lerArmazenamentoLocal<unknown>(CHAVE_SESSAO_ESTUDO, null));
}

function gravarSessao(sessao: SessaoEmAndamento | null): void {
  if (sessao) {
    gravarArmazenamentoLocal(CHAVE_SESSAO_ESTUDO, sessao);
    return;
  }
  try {
    window.localStorage.removeItem(CHAVE_SESSAO_ESTUDO);
  } catch {
    return;
  }
}

function lerPreferencias(): PreferenciasCronometro {
  const salvas = lerArmazenamentoLocal<Partial<PreferenciasCronometro>>(CHAVE_PREFERENCIAS_CRONOMETRO, {});
  return {
    modo: salvas.modo === 'POMODORO' ? 'POMODORO' : 'LIVRE',
    atividadeId: typeof salvas.atividadeId === 'number' ? salvas.atividadeId : null,
  };
}

function lerPomodoroArmazenado(): PreferenciasPomodoro {
  return lerPreferenciasPomodoro(lerArmazenamentoLocal<unknown>(CHAVE_PREFERENCIAS_POMODORO, null));
}

export function descreverTituloAba(sessao: SessaoEmAndamento, leitura: LeituraCronometro): string {
  const nome = sessao.atividade.nome;
  if (sessao.encerradaEm) return `Finalizando · ${nome}`;
  if (leitura.fase) {
    if (leitura.faseConcluida) return `${rotuloFaseConcluida[leitura.fase]} · ${nome}`;
    const rotulo = leitura.fase === 'FOCO' ? 'Foco' : 'Pausa';
    const tempo = formatarContagemRegressiva(leitura.segundosRestantesFase);
    return sessao.estado === 'PAUSADA' ? `Pausada · ${rotulo} ${tempo} · ${nome}` : `${rotulo} ${tempo} · ${nome}`;
  }
  const tempo = formatarRelogio(leitura.segundosEstudo);
  return sessao.estado === 'PAUSADA' ? `Pausada · ${tempo} · ${nome}` : `${tempo} · ${nome}`;
}

function VigiaCronometro({ sessao, aoConcluirFase }: { sessao: SessaoEmAndamento | null; aoConcluirFase: (fase: FasePomodoro, sessao: SessaoEmAndamento) => void }) {
  const agora = useAgora(sessao !== null && sessao.estado === 'RODANDO' && !sessao.encerradaEm);
  const leitura = sessao ? lerCronometro(sessao, agora) : null;
  const faseAnterior = useRef<string | null>(null);

  const titulo = sessao && leitura ? descreverTituloAba(sessao, leitura) : null;
  useEffect(() => {
    definirTituloDestaque(titulo);
  }, [titulo]);

  useEffect(() => () => definirTituloDestaque(null), []);

  const chaveFase = sessao?.pomodoro ? `${sessao.iniciadaEm}|${sessao.pomodoro.fase}|${sessao.pomodoro.ciclosConcluidos}` : null;
  const concluida = Boolean(leitura?.faseConcluida);
  useEffect(() => {
    if (!chaveFase || !sessao?.pomodoro) {
      faseAnterior.current = null;
      return;
    }
    const marcador = `${chaveFase}|${concluida}`;
    const anterior = faseAnterior.current;
    faseAnterior.current = marcador;
    if (concluida && anterior === `${chaveFase}|false`) aoConcluirFase(sessao.pomodoro.fase, sessao);
  }, [chaveFase, concluida, sessao, aoConcluirFase]);

  return null;
}

export function ProvedorCronometro({ children }: { children: ReactNode }) {
  const { notificarAlteracao } = useAlteracoes();
  const notificacoes = useNotificacoes();
  const [sessao, setSessao] = useState<SessaoEmAndamento | null>(lerSessaoArmazenada);
  const [preferencias, setPreferencias] = useState<PreferenciasCronometro>(lerPreferencias);
  const [pomodoro, setPomodoro] = useState<PreferenciasPomodoro>(lerPomodoroArmazenado);
  const pomodoroRef = useRef(pomodoro);
  pomodoroRef.current = pomodoro;
  const [salvando, setSalvando] = useState(false);
  const [anuncio, setAnuncio] = useState('');
  const sessaoRef = useRef(sessao);
  sessaoRef.current = sessao;

  const anunciar = useCallback((texto: string) => {
    setAnuncio((atual) => (atual === texto ? `${texto} ` : texto));
  }, []);

  const aplicar = useCallback((proxima: SessaoEmAndamento | null) => {
    sessaoRef.current = proxima;
    setSessao(proxima);
    gravarSessao(proxima);
  }, []);

  const transformar = useCallback(
    (transformacao: (atual: SessaoEmAndamento, agora: Date) => SessaoEmAndamento) => {
      const atual = sessaoRef.current;
      if (!atual) return null;
      const proxima = transformacao(atual, new Date());
      if (proxima !== atual) aplicar(proxima);
      return proxima;
    },
    [aplicar],
  );

  const atualizarPreferencias = useCallback((parcial: Partial<PreferenciasCronometro>) => {
    setPreferencias((atuais) => {
      const proximas = { ...atuais, ...parcial };
      gravarArmazenamentoLocal(CHAVE_PREFERENCIAS_CRONOMETRO, proximas);
      return proximas;
    });
  }, []);

  const definirPreferenciasPomodoro = useCallback((parcial: Partial<PreferenciasPomodoro>) => {
    const proximas = lerPreferenciasPomodoro({ ...pomodoroRef.current, ...parcial });
    pomodoroRef.current = proximas;
    setPomodoro(proximas);
    gravarArmazenamentoLocal(CHAVE_PREFERENCIAS_POMODORO, proximas);
  }, []);

  useEffect(() => {
    if (!pomodoro.somAoFimDaFase) return;
    const aoInteragir = () => prepararSom();
    document.addEventListener('pointerdown', aoInteragir, true);
    document.addEventListener('keydown', aoInteragir, true);
    return () => {
      document.removeEventListener('pointerdown', aoInteragir, true);
      document.removeEventListener('keydown', aoInteragir, true);
    };
  }, [pomodoro.somAoFimDaFase]);

  useEffect(() => {
    if (!pomodoro.iniciarPausaSozinha || !sessao?.pomodoro || sessao.pomodoro.fase !== 'FOCO') return;
    const fim = instanteFimDaFase(sessao);
    if (fim && fim.getTime() <= Date.now()) aplicar(iniciarProximaFaseRegra(sessao, fim));
  }, [sessao, pomodoro.iniciarPausaSozinha, aplicar]);

  useEffect(() => {
    const aoMudarArmazenamento = (evento: StorageEvent) => {
      if (evento.key === CHAVE_SESSAO_ESTUDO) {
        let proxima: SessaoEmAndamento | null = null;
        try {
          proxima = evento.newValue ? lerSessaoSalva(JSON.parse(evento.newValue)) : null;
        } catch {
          proxima = null;
        }
        sessaoRef.current = proxima;
        setSessao(proxima);
      }
      if (evento.key === CHAVE_PREFERENCIAS_CRONOMETRO) setPreferencias(lerPreferencias());
      if (evento.key === CHAVE_PREFERENCIAS_POMODORO) {
        const proximas = lerPomodoroArmazenado();
        pomodoroRef.current = proximas;
        setPomodoro(proximas);
      }
    };
    window.addEventListener('storage', aoMudarArmazenamento);
    return () => window.removeEventListener('storage', aoMudarArmazenamento);
  }, []);

  const iniciar = useCallback<ValorContextoCronometro['iniciar']>(
    ({ atividade, tarefa = null, modo }) => {
      if (sessaoRef.current) return false;
      const modoEscolhido = modo ?? preferencias.modo;
      const duracoes = duracoesDasPreferencias(pomodoroRef.current);
      aplicar(iniciarSessao({ atividade, tarefa, modo: modoEscolhido, duracoes }, new Date()));
      atualizarPreferencias({ atividadeId: atividade.id, modo: modoEscolhido });
      anunciar(
        modoEscolhido === 'POMODORO'
          ? `Sessão de ${atividade.nome} iniciada no Pomodoro. Foco de ${formatarDuracaoPorExtenso(pomodoroRef.current.focoMinutos)}.`
          : `Sessão de ${atividade.nome} iniciada.`,
      );
      return true;
    },
    [aplicar, anunciar, atualizarPreferencias, preferencias.modo],
  );

  const pausar = useCallback(() => {
    const proxima = transformar(pausarSessao);
    if (proxima) anunciar(`Sessão pausada em ${formatarDuracaoSegundos(lerCronometro(proxima, new Date()).segundosEstudo)} de estudo.`);
  }, [anunciar, transformar]);

  const retomar = useCallback(() => {
    if (transformar(retomarSessao)) anunciar('Sessão retomada.');
  }, [anunciar, transformar]);

  const iniciarProximaFase = useCallback(() => {
    const proxima = transformar(iniciarProximaFaseRegra);
    if (proxima?.pomodoro) anunciar(anuncioFaseIniciada[proxima.pomodoro.fase]);
  }, [anunciar, transformar]);

  const pularPausa = useCallback(() => {
    if (transformar(pularPausaRegra)) anunciar('Pausa pulada. Foco iniciado.');
  }, [anunciar, transformar]);

  const encerrar = useCallback(() => {
    transformar(encerrarSessao);
  }, [transformar]);

  const continuar = useCallback(() => {
    if (transformar(continuarSessao)) anunciar('A sessão continua.');
  }, [anunciar, transformar]);

  const descartar = useCallback(() => {
    if (!sessaoRef.current) return;
    aplicar(null);
    anunciar('Sessão descartada.');
  }, [aplicar, anunciar]);

  const salvar = useCallback<ValorContextoCronometro['salvar']>(
    async ({ observacao, duracaoSegundos }) => {
      const atual = sessaoRef.current;
      if (!atual) return null;
      setSalvando(true);
      try {
        const salva = await servicoSessoes.criarSessao(montarEnvioSessao(atual, { observacao, duracaoSegundos }, new Date()));
        if (sessaoRef.current?.iniciadaEm === atual.iniciadaEm) aplicar(null);
        notificarAlteracao('sessoes');
        notificacoes.sucesso('Sessão salva.', `${salva.atividade.nome} · ${formatarDuracaoSegundos(salva.duracaoSegundos)} de estudo.`);
        return salva;
      } finally {
        setSalvando(false);
      }
    },
    [aplicar, notificacoes, notificarAlteracao],
  );

  const aoConcluirFase = useCallback(
    (fase: FasePomodoro, atual: SessaoEmAndamento) => {
      const leitura = lerCronometro(atual, new Date());
      const { somAoFimDaFase, iniciarPausaSozinha } = pomodoroRef.current;
      if (somAoFimDaFase) tocarAviso(fase === 'FOCO' ? 'fimDoFoco' : 'fimDaPausa');
      if (fase === 'FOCO') {
        const pausa = leitura.proximaFase === 'PAUSA_LONGA' ? 'pausa longa' : 'pausa curta';
        const fim = iniciarPausaSozinha ? instanteFimDaFase(atual) : null;
        if (fim && sessaoRef.current?.iniciadaEm === atual.iniciadaEm) {
          const comPausa = iniciarProximaFaseRegra(atual, fim);
          aplicar(comPausa);
          const minutosPausa = Math.round((comPausa.pomodoro ? lerCronometro(comPausa, fim).duracaoFaseSegundos : 0) / 60);
          notificacoes.notificar({
            titulo: 'Foco concluído.',
            descricao: `${atual.atividade.nome}: a ${pausa} de ${formatarDuracao(minutosPausa)} já começou.`,
            variante: 'informacao',
          });
          anunciar(`Foco concluído. A ${pausa} já começou.`);
          return;
        }
        notificacoes.notificar({
          titulo: 'Foco concluído.',
          descricao: `${atual.atividade.nome}: hora da ${pausa}. Ela começa quando você confirmar.`,
          variante: 'informacao',
        });
        anunciar(`Foco concluído. Confirme para iniciar a ${pausa}.`);
        return;
      }
      notificacoes.notificar({ titulo: 'Pausa concluída.', descricao: 'Confirme quando quiser voltar ao foco.', variante: 'informacao' });
      anunciar('Pausa concluída. Confirme para voltar ao foco.');
    },
    [anunciar, aplicar, notificacoes],
  );

  const valor = useMemo<ValorContextoCronometro>(
    () => ({
      sessao,
      preferenciasPomodoro: pomodoro,
      definirPreferenciasPomodoro,
      modoPreferido: preferencias.modo,
      atividadeSelecionadaId: preferencias.atividadeId,
      salvando,
      anuncio,
      definirModoPreferido: (modo) => atualizarPreferencias({ modo }),
      selecionarAtividade: (atividadeId) => atualizarPreferencias({ atividadeId }),
      iniciar,
      pausar,
      retomar,
      iniciarProximaFase,
      pularPausa,
      encerrar,
      continuar,
      descartar,
      salvar,
    }),
    [
      sessao,
      preferencias,
      pomodoro,
      definirPreferenciasPomodoro,
      salvando,
      anuncio,
      atualizarPreferencias,
      iniciar,
      pausar,
      retomar,
      iniciarProximaFase,
      pularPausa,
      encerrar,
      continuar,
      descartar,
      salvar,
    ],
  );

  return (
    <ContextoCronometro.Provider value={valor}>
      {children}
      <VigiaCronometro sessao={sessao} aoConcluirFase={aoConcluirFase} />
      <div className="visualmente-oculto" role="status" aria-live="polite">
        {anuncio}
      </div>
    </ContextoCronometro.Provider>
  );
}

export function useCronometro(): ValorContextoCronometro {
  const contexto = useContext(ContextoCronometro);
  if (!contexto) throw new Error('useCronometro precisa estar dentro de <ProvedorCronometro>.');
  return contexto;
}
