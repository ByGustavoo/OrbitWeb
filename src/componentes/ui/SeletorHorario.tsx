import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent, RefObject } from 'react';
import { Clock } from 'lucide-react';
import { juntarClasses } from '@/utilitarios/juntarClasses';
import { classesControle } from './classesControle';
import { EstruturaCampo } from './EstruturaCampo';
import type { PropriedadesMensagensCampo } from './EstruturaCampo';
import { Flutuante } from './Flutuante';
import estilosCampo from './Campo.module.css';
import estilos from './SeletorHorario.module.css';

export interface SeletorHorarioProps extends PropriedadesMensagensCampo {
  valor: string | null;
  aoMudar: (valor: string | null) => void;
  passoMinutos?: number;
  textoVazio?: string;
  desabilitado?: boolean;
  permitirLimpar?: boolean;
  id?: string;
}

const dois = (numero: number) => String(numero).padStart(2, '0');
const ehDigito = (tecla: string) => /^\d$/.test(tecla);
const INTERVALO_DIGITACAO_MS = 1500;

type ColunaHorario = 'horas' | 'minutos';

export function SeletorHorario({
  rotulo,
  dica,
  erro,
  sucesso,
  obrigatorio,
  className,
  valor,
  aoMudar,
  passoMinutos = 5,
  textoVazio = 'Escolher horário',
  desabilitado = false,
  permitirLimpar = true,
  id,
}: SeletorHorarioProps) {
  const gatilhoRef = useRef<HTMLButtonElement>(null);
  const idPainel = useId();
  const [aberto, setAberto] = useState(false);
  const [digitoInicial, setDigitoInicial] = useState<string | null>(null);

  const fechar = useCallback((devolverFoco: boolean) => {
    setAberto(false);
    if (devolverFoco) gatilhoRef.current?.focus();
  }, []);

  return (
    <EstruturaCampo
      id={id}
      rotulo={rotulo}
      dica={dica}
      erro={erro}
      sucesso={sucesso}
      obrigatorio={obrigatorio}
      className={className}
    >
      {({ idControle, idDescricao }) => (
        <>
          <button
            ref={gatilhoRef}
            id={idControle}
            type="button"
            className={classesControle(erro, sucesso, juntarClasses(estilosCampo.gatilho, aberto && estilosCampo.gatilhoAberto))}
            aria-haspopup="dialog"
            aria-expanded={aberto}
            aria-controls={aberto ? idPainel : undefined}
            aria-describedby={idDescricao}
            aria-invalid={erro ? true : undefined}
            disabled={desabilitado}
            onClick={() => {
              setDigitoInicial(null);
              setAberto((atual) => !atual);
            }}
            onKeyDown={(evento) => {
              if (aberto) return;
              if (evento.key === 'ArrowDown' || ehDigito(evento.key)) {
                evento.preventDefault();
                setDigitoInicial(ehDigito(evento.key) ? evento.key : null);
                setAberto(true);
              }
            }}
          >
            <Clock className={estilosCampo.icone} size={16} strokeWidth={2} aria-hidden="true" />
            <span className={juntarClasses(estilosCampo.valorGatilho, 'numeros', !valor && estilosCampo.textoVazio)}>
              {valor ?? textoVazio}
            </span>
          </button>

          <Flutuante
            aberto={aberto}
            ancora={gatilhoRef}
            aoFechar={fechar}
            id={idPainel}
            rotulo={rotulo ?? 'Escolher horário'}
            larguraMinimaDaAncora
          >
            <PainelHorario
              valor={valor}
              digitoInicial={digitoInicial}
              passoMinutos={passoMinutos}
              aoMudar={aoMudar}
              aoConcluir={() => fechar(true)}
              aoLimpar={
                permitirLimpar && valor
                  ? () => {
                      aoMudar(null);
                      fechar(true);
                    }
                  : undefined
              }
            />
          </Flutuante>
        </>
      )}
    </EstruturaCampo>
  );
}

interface PainelHorarioProps {
  valor: string | null;
  digitoInicial: string | null;
  passoMinutos: number;
  aoMudar: (valor: string) => void;
  aoConcluir: () => void;
  aoLimpar?: () => void;
}

function PainelHorario({ valor, digitoInicial, passoMinutos, aoMudar, aoConcluir, aoLimpar }: PainelHorarioProps) {
  const [horaAtual, minutoAtual] = (valor ?? '').split(':').map(Number);
  const horaSelecionada = valor ? horaAtual ?? null : null;
  const minutoSelecionado = valor ? minutoAtual ?? null : null;
  const horas = Array.from({ length: 24 }, (_, indice) => indice);
  const minutos = Array.from({ length: Math.ceil(60 / passoMinutos) }, (_, indice) => indice * passoMinutos);
  if (minutoSelecionado !== null && !minutos.includes(minutoSelecionado)) {
    minutos.push(minutoSelecionado);
    minutos.sort((a, b) => a - b);
  }

  const agora = new Date();
  const [horaFocada, setHoraFocada] = useState(horaSelecionada ?? agora.getHours());
  const [minutoFocado, setMinutoFocado] = useState(
    minutoSelecionado ?? minutos.reduce((maisProximo, minuto) => (minuto <= agora.getMinutes() ? minuto : maisProximo), 0),
  );
  const colunaHorasRef = useRef<HTMLDivElement>(null);
  const colunaMinutosRef = useRef<HTMLDivElement>(null);
  const colunaAtivaRef = useRef<ColunaHorario>('horas');
  const digitadoRef = useRef({ coluna: 'horas' as ColunaHorario, texto: '', instante: 0 });
  const horaEscolhidaRef = useRef<number | null>(null);

  const focarEm = (coluna: HTMLDivElement | null) => {
    requestAnimationFrame(() => {
      const alvo = coluna?.querySelector<HTMLElement>('[tabindex="0"]');
      alvo?.focus({ preventScroll: true });
      alvo?.scrollIntoView({ block: 'nearest' });
    });
  };

  const escolherHora = (hora: number) => {
    setHoraFocada(hora);
    horaEscolhidaRef.current = hora;
    colunaAtivaRef.current = 'minutos';
    aoMudar(`${dois(hora)}:${dois(minutoSelecionado ?? minutoFocado)}`);
    focarEm(colunaMinutosRef.current);
    requestAnimationFrame(() => colunaHorasRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' }));
  };

  const escolherMinuto = (minuto: number) => {
    setMinutoFocado(minuto);
    aoMudar(`${dois(horaEscolhidaRef.current ?? horaSelecionada ?? horaFocada)}:${dois(minuto)}`);
    aoConcluir();
  };

  const lembrarDigito = (coluna: ColunaHorario, texto: string) => {
    digitadoRef.current = { coluna, texto, instante: performance.now() };
  };

  const digitar = (tecla: string) => {
    const coluna = colunaAtivaRef.current;
    const anterior = digitadoRef.current;
    const continua =
      anterior.coluna === coluna && anterior.texto.length === 1 && performance.now() - anterior.instante < INTERVALO_DIGITACAO_MS;
    const numero = Number(continua ? anterior.texto + tecla : tecla);
    const digito = Number(tecla);

    if (coluna === 'horas') {
      if (continua && numero <= 23) {
        lembrarDigito(coluna, '');
        escolherHora(numero);
      } else if (digito > 2) {
        lembrarDigito(coluna, '');
        escolherHora(digito);
      } else {
        lembrarDigito(coluna, tecla);
        setHoraFocada(digito);
        focarEm(colunaHorasRef.current);
      }
      return;
    }

    if (continua && numero <= 59) {
      lembrarDigito(coluna, '');
      escolherMinuto(numero);
      return;
    }
    if (digito > 5) {
      lembrarDigito(coluna, '');
      return;
    }
    lembrarDigito(coluna, tecla);
    const candidato = minutos.find((minuto) => dois(minuto).startsWith(tecla));
    if (candidato !== undefined) {
      setMinutoFocado(candidato);
      focarEm(colunaMinutosRef.current);
    }
  };

  const teclarPainel = (evento: KeyboardEvent<HTMLDivElement>) => {
    if (ehDigito(evento.key)) {
      evento.preventDefault();
      digitar(evento.key);
    } else if (evento.key === ':' && colunaAtivaRef.current === 'horas') {
      evento.preventDefault();
      escolherHora(horaFocada);
    }
  };

  useEffect(() => {
    const quadro = requestAnimationFrame(() => {
      for (const coluna of [colunaHorasRef.current, colunaMinutosRef.current]) {
        const alvo = coluna?.querySelector<HTMLElement>('[tabindex="0"]');
        if (coluna && alvo) coluna.scrollTop = alvo.offsetTop - coluna.clientHeight / 2 + alvo.offsetHeight / 2;
      }
      colunaHorasRef.current?.querySelector<HTMLElement>('[tabindex="0"]')?.focus({ preventScroll: true });
      if (digitoInicial) digitar(digitoInicial);
    });
    return () => cancelAnimationFrame(quadro);
  }, []);

  const teclarColuna = (
    evento: KeyboardEvent<HTMLDivElement>,
    lista: number[],
    focado: number,
    definir: (valor: number) => void,
    coluna: HTMLDivElement | null,
    outraColuna: HTMLDivElement | null,
  ) => {
    const indice = lista.indexOf(focado);
    const destinos: Record<string, number> = {
      ArrowUp: Math.max(indice - 1, 0),
      ArrowDown: Math.min(indice + 1, lista.length - 1),
      Home: 0,
      End: lista.length - 1,
      PageUp: Math.max(indice - 6, 0),
      PageDown: Math.min(indice + 6, lista.length - 1),
    };
    if (evento.key === 'ArrowLeft' || evento.key === 'ArrowRight') {
      evento.preventDefault();
      focarEm(outraColuna);
      return;
    }
    const destino = destinos[evento.key];
    if (destino === undefined) return;
    evento.preventDefault();
    definir(lista[destino] ?? focado);
    focarEm(coluna);
  };

  return (
    <div className={estilos.painel} onKeyDown={teclarPainel}>
      <div className={estilos.titulos} aria-hidden="true">
        <span>Hora</span>
        <span>Minuto</span>
      </div>
      <div className={estilos.colunas}>
        <Coluna
          referencia={colunaHorasRef}
          rotulo="Horas"
          itens={horas}
          selecionado={horaSelecionada}
          focado={horaFocada}
          aoEscolher={escolherHora}
          aoFocar={() => {
            colunaAtivaRef.current = 'horas';
          }}
          aoTeclar={(evento) =>
            teclarColuna(evento, horas, horaFocada, setHoraFocada, colunaHorasRef.current, colunaMinutosRef.current)
          }
        />
        <span className={estilos.separador} aria-hidden="true">
          :
        </span>
        <Coluna
          referencia={colunaMinutosRef}
          rotulo="Minutos"
          itens={minutos}
          selecionado={minutoSelecionado}
          focado={minutoFocado}
          aoEscolher={escolherMinuto}
          aoFocar={() => {
            colunaAtivaRef.current = 'minutos';
          }}
          aoTeclar={(evento) =>
            teclarColuna(evento, minutos, minutoFocado, setMinutoFocado, colunaMinutosRef.current, colunaHorasRef.current)
          }
        />
      </div>
      <div className={juntarClasses(estilos.rodape, !aoLimpar && estilos.rodapeSoDica)}>
        <p className={estilos.dica}>Digite a hora, como 0930.</p>
        {aoLimpar ? (
          <button type="button" className={estilos.limpar} onClick={aoLimpar}>
            Limpar
          </button>
        ) : null}
      </div>
    </div>
  );
}

interface ColunaProps {
  referencia: RefObject<HTMLDivElement>;
  rotulo: string;
  itens: number[];
  selecionado: number | null;
  focado: number;
  aoEscolher: (valor: number) => void;
  aoFocar: () => void;
  aoTeclar: (evento: KeyboardEvent<HTMLDivElement>) => void;
}

function Coluna({ referencia, rotulo, itens, selecionado, focado, aoEscolher, aoFocar, aoTeclar }: ColunaProps) {
  return (
    <div ref={referencia} role="listbox" aria-label={rotulo} className={estilos.coluna} onKeyDown={aoTeclar} onFocus={aoFocar}>
      {itens.map((item) => (
        <button
          key={item}
          type="button"
          role="option"
          aria-selected={item === selecionado}
          tabIndex={item === focado ? 0 : -1}
          className={juntarClasses(estilos.opcao, 'numeros', item === selecionado && estilos.selecionada)}
          onClick={() => aoEscolher(item)}
        >
          {dois(item)}
        </button>
      ))}
    </div>
  );
}
