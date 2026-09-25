import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { Check, Info, RotateCcw, Volume2 } from 'lucide-react';
import { Botao, CabecalhoPainel, CampoNumero, Interruptor, Painel } from '@/componentes/ui';
import type { AjusteAoLimite } from '@/componentes/ui';
import { useCronometro } from '@/provedores/ProvedorCronometro';
import {
  LIMITES_POMODORO,
  PREFERENCIAS_POMODORO_PADRAO,
  duracoesSaoPadrao,
  resumirConjunto,
} from '@/regras/preferenciasPomodoro';
import type { CampoDuracaoPomodoro, PreferenciasPomodoro } from '@/regras/preferenciasPomodoro';
import { formatarDuracao, formatarNumero, pluralizar } from '@/utilitarios/formatacao';
import { juntarClasses } from '@/utilitarios/juntarClasses';
import { tocarAviso } from '@/utilitarios/som';
import type { SecaoConfiguracaoProps } from './SecaoAparencia';
import estilos from './SecaoConfiguracao.module.css';
import estilosPomodoro from './SecaoPomodoro.module.css';

const TEMPO_AVISO_SALVO_MS = 2400;
const DURACAO_ENTRADA_LINHA_MS = 1600;

interface DefinicaoCampo {
  campo: CampoDuracaoPomodoro;
  rotulo: string;
  sufixo: string;
  erroVazio: string;
}

const camposDuracao: DefinicaoCampo[] = [
  { campo: 'focoMinutos', rotulo: 'Foco', sufixo: 'min', erroVazio: 'Informe quantos minutos dura o foco.' },
  { campo: 'pausaCurtaMinutos', rotulo: 'Pausa curta', sufixo: 'min', erroVazio: 'Informe quantos minutos dura a pausa curta.' },
  { campo: 'pausaLongaMinutos', rotulo: 'Pausa longa', sufixo: 'min', erroVazio: 'Informe quantos minutos dura a pausa longa.' },
  {
    campo: 'ciclosAtePausaLonga',
    rotulo: 'Pausa longa a cada',
    sufixo: 'focos',
    erroVazio: 'Informe depois de quantos focos vem a pausa longa.',
  },
];

type Rascunho = Record<CampoDuracaoPomodoro, number | null>;

function rascunhoDe(preferencias: PreferenciasPomodoro): Rascunho {
  return {
    focoMinutos: preferencias.focoMinutos,
    pausaCurtaMinutos: preferencias.pausaCurtaMinutos,
    pausaLongaMinutos: preferencias.pausaLongaMinutos,
    ciclosAtePausaLonga: preferencias.ciclosAtePausaLonga,
  };
}

function descreverLimite(campo: CampoDuracaoPomodoro): string {
  const { minimo, maximo } = LIMITES_POMODORO[campo];
  return campo === 'ciclosAtePausaLonga' ? `De ${minimo} a ${maximo} focos.` : `De ${minimo} a ${maximo} minutos.`;
}

function descreverAjuste(campo: CampoDuracaoPomodoro, { digitado, ajustado }: AjusteAoLimite): string {
  const limite = digitado > ajustado ? 'passa do máximo' : 'fica abaixo do mínimo';
  const valor = campo === 'ciclosAtePausaLonga' ? pluralizar(ajustado, 'foco', 'focos') : `${formatarNumero(ajustado)} min`;
  return `${formatarNumero(digitado)} ${limite}, então ficou em ${valor}.`;
}

function LinhaDoConjunto({ preferencias }: { preferencias: PreferenciasPomodoro }) {
  const { focoMinutos, pausaCurtaMinutos, pausaLongaMinutos, ciclosAtePausaLonga } = preferencias;
  const trechos: { tipo: 'foco' | 'curta' | 'longa'; minutos: number }[] = [];
  for (let foco = 1; foco <= ciclosAtePausaLonga; foco += 1) {
    trechos.push({ tipo: 'foco', minutos: focoMinutos });
    trechos.push(foco < ciclosAtePausaLonga ? { tipo: 'curta', minutos: pausaCurtaMinutos } : { tipo: 'longa', minutos: pausaLongaMinutos });
  }
  const { minutosEstudo, minutosTotais } = resumirConjunto(preferencias);
  const [entrando, setEntrando] = useState(true);

  useEffect(() => {
    const temporizador = window.setTimeout(() => setEntrando(false), DURACAO_ENTRADA_LINHA_MS);
    return () => window.clearTimeout(temporizador);
  }, []);

  return (
    <div className={estilosPomodoro.conjunto}>
      <p className={estilosPomodoro.resumoConjunto}>
        <span className={estilosPomodoro.rotuloConjunto}>Um ciclo completo</span>
        <span>
          {pluralizar(ciclosAtePausaLonga, 'foco', 'focos')} · <strong>{formatarDuracao(minutosEstudo)}</strong> de estudo em{' '}
          {formatarDuracao(minutosTotais)}
        </span>
      </p>
      <div className={juntarClasses(estilosPomodoro.linha, entrando && estilosPomodoro.linhaEntrando)} aria-hidden="true">
        {trechos.map((trecho, indice) => (
          <span
            key={indice}
            className={juntarClasses(estilosPomodoro.trecho, estilosPomodoro[trecho.tipo])}
            style={{ '--peso': trecho.minutos, '--indice': indice } as CSSProperties}
          />
        ))}
      </div>
      <ul className={estilosPomodoro.legenda} aria-hidden="true">
        <li>
          <span className={juntarClasses(estilosPomodoro.amostra, estilosPomodoro.foco)} />
          Foco
        </li>
        <li>
          <span className={juntarClasses(estilosPomodoro.amostra, estilosPomodoro.curta)} />
          Pausa curta
        </li>
        <li>
          <span className={juntarClasses(estilosPomodoro.amostra, estilosPomodoro.longa)} />
          Pausa longa
        </li>
      </ul>
    </div>
  );
}

export function SecaoPomodoro({ id, idTitulo }: SecaoConfiguracaoProps) {
  const { preferenciasPomodoro: preferencias, definirPreferenciasPomodoro, sessao } = useCronometro();
  const [rascunho, setRascunho] = useState<Rascunho>(() => rascunhoDe(preferencias));
  const [salvo, setSalvo] = useState(false);
  const [anuncio, setAnuncio] = useState('');
  const [ajustes, setAjustes] = useState<Partial<Record<CampoDuracaoPomodoro, string>>>({});
  const temporizador = useRef(0);

  useEffect(() => {
    setRascunho((atual) => {
      const proximo = { ...atual };
      (Object.keys(atual) as CampoDuracaoPomodoro[]).forEach((campo) => {
        if (atual[campo] !== null) proximo[campo] = preferencias[campo];
      });
      return proximo;
    });
  }, [preferencias]);

  useEffect(() => () => window.clearTimeout(temporizador.current), []);

  const anunciar = (mensagem: string) => setAnuncio((atual) => (atual === mensagem ? `${mensagem} ` : mensagem));

  const confirmarSalvamento = (mensagem: string) => {
    setSalvo(true);
    anunciar(mensagem);
    window.clearTimeout(temporizador.current);
    temporizador.current = window.setTimeout(() => setSalvo(false), TEMPO_AVISO_SALVO_MS);
  };

  const salvar = (parcial: Partial<PreferenciasPomodoro>, mensagem: string) => {
    const mudou = (Object.keys(parcial) as (keyof PreferenciasPomodoro)[]).some((chave) => parcial[chave] !== preferencias[chave]);
    if (!mudou) return;
    definirPreferenciasPomodoro(parcial);
    confirmarSalvamento(mensagem);
  };

  const mudarDuracao = (campo: CampoDuracaoPomodoro, valor: number | null) => {
    setRascunho((atual) => ({ ...atual, [campo]: valor }));
    setAjustes((atuais) => {
      if (!atuais[campo]) return atuais;
      const proximos = { ...atuais };
      delete proximos[campo];
      return proximos;
    });
    if (valor !== null) salvar({ [campo]: valor }, 'Durações do Pomodoro salvas.');
  };

  const avisarAjuste = (campo: CampoDuracaoPomodoro, ajuste: AjusteAoLimite) => {
    const mensagem = descreverAjuste(campo, ajuste);
    setAjustes((atuais) => ({ ...atuais, [campo]: mensagem }));
    anunciar(mensagem);
  };

  const restaurarPadrao = () => {
    setRascunho(rascunhoDe(PREFERENCIAS_POMODORO_PADRAO));
    setAjustes({});
    const { focoMinutos, pausaCurtaMinutos, pausaLongaMinutos, ciclosAtePausaLonga } = PREFERENCIAS_POMODORO_PADRAO;
    salvar({ focoMinutos, pausaCurtaMinutos, pausaLongaMinutos, ciclosAtePausaLonga }, 'Durações padrão restauradas: 25 minutos de foco, 5 de pausa curta e 15 de pausa longa a cada 4 focos.');
  };

  const sessaoPomodoroEmAndamento = sessao?.modo === 'POMODORO';
  const podeRestaurar = !duracoesSaoPadrao(preferencias) || Object.values(rascunho).some((valor) => valor === null);

  return (
    <Painel id={id} aria-labelledby={idTitulo} className={juntarClasses(estilos.secao, estilosPomodoro.secao)}>
      <CabecalhoPainel
        titulo={
          <span id={idTitulo} tabIndex={-1} className={estilos.ancora}>
            Pomodoro
          </span>
        }
        descricao="Defina o ritmo do cronômetro em Estudos. Só o tempo de foco conta como estudo."
      />

      {sessaoPomodoroEmAndamento ? (
        <p className={estilosPomodoro.aviso}>
          <Info size={16} strokeWidth={2} aria-hidden="true" />
          Há uma sessão no Pomodoro em andamento. Ela termina com as durações com que começou; as mudanças valem a partir da
          próxima sessão.
        </p>
      ) : null}

      <div className={estilosPomodoro.campos}>
        {camposDuracao.map(({ campo, rotulo, sufixo, erroVazio }) => (
          <CampoNumero
            key={campo}
            rotulo={rotulo}
            valor={rascunho[campo]}
            aoMudar={(valor) => mudarDuracao(campo, valor)}
            aoAjustarAoLimite={(ajuste) => avisarAjuste(campo, ajuste)}
            minimo={LIMITES_POMODORO[campo].minimo}
            maximo={LIMITES_POMODORO[campo].maximo}
            sufixo={sufixo}
            erro={rascunho[campo] === null ? erroVazio : undefined}
            aviso={ajustes[campo]}
            dica={descreverLimite(campo)}
          />
        ))}
      </div>

      <LinhaDoConjunto preferencias={preferencias} />

      <div className={estilosPomodoro.opcoes}>
        <Interruptor
          rotulo="Começar a pausa sozinha"
          descricao="Quando o foco termina, a pausa começa sem esperar você confirmar. Voltar ao foco continua sendo com você."
          ligado={preferencias.iniciarPausaSozinha}
          aoMudar={(ligado) =>
            salvar(
              { iniciarPausaSozinha: ligado },
              ligado ? 'A pausa vai começar sozinha ao fim do foco.' : 'A pausa vai esperar você confirmar.',
            )
          }
        />
        <div className={estilosPomodoro.opcaoComAcao}>
          <Interruptor
            rotulo="Tocar um som ao fim de cada fase"
            descricao="Um aviso curto quando o foco ou a pausa terminam, mesmo com o Orbit em outra aba."
            ligado={preferencias.somAoFimDaFase}
            aoMudar={(ligado) => {
              if (ligado) tocarAviso('fimDoFoco');
              salvar({ somAoFimDaFase: ligado }, ligado ? 'O som ao fim de cada fase foi ligado.' : 'O som ao fim de cada fase foi desligado.');
            }}
            className={estilosPomodoro.interruptorComAcao}
          />
          <Botao variante="terciario" tamanho="sm" icone={Volume2} onClick={() => tocarAviso('fimDoFoco')}>
            Ouvir o som
          </Botao>
        </div>
      </div>

      <footer className={estilosPomodoro.rodape}>
        <p className={juntarClasses(estilosPomodoro.estadoSalvo, salvo && estilosPomodoro.acabouDeSalvar)}>
          {salvo ? <Check size={14} strokeWidth={2.5} aria-hidden="true" /> : null}
          {salvo ? 'Salvo' : 'As mudanças são salvas automaticamente neste navegador.'}
        </p>
        <Botao variante="secundario" tamanho="sm" icone={RotateCcw} onClick={restaurarPadrao} disabled={!podeRestaurar}>
          Restaurar padrão
        </Botao>
      </footer>

      <div className="visualmente-oculto" role="status" aria-live="polite">
        {anuncio}
      </div>
    </Painel>
  );
}
