import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';
import { Minus, Plus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { juntarClasses } from '@/utilitarios/juntarClasses';
import { classesControle } from './classesControle';
import { EstruturaCampo } from './EstruturaCampo';
import type { PropriedadesMensagensCampo } from './EstruturaCampo';
import estilosCampo from './Campo.module.css';
import estilos from './CampoNumero.module.css';

const ESPERA_ANTES_DE_REPETIR_MS = 400;
const INTERVALO_REPETICAO_MS = 70;

export interface AjusteAoLimite {
  digitado: number;
  ajustado: number;
}

export interface CampoNumeroProps extends PropriedadesMensagensCampo {
  valor: number | null;
  aoMudar: (valor: number | null) => void;
  aoAjustarAoLimite?: (ajuste: AjusteAoLimite) => void;
  aviso?: string;
  minimo?: number;
  maximo?: number;
  passo?: number;
  casasDecimais?: number;
  sufixo?: string;
  placeholder?: string;
  icone?: LucideIcon;
  desabilitado?: boolean;
  id?: string;
}

function formatar(valor: number | null, casas: number): string {
  if (valor === null) return '';
  return valor.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: casas });
}

function interpretar(texto: string): number | null {
  const bruto = texto.trim();
  const limpo = bruto.includes(',') ? bruto.replace(/\./g, '').replace(',', '.') : bruto;
  if (limpo === '' || limpo === '-') return null;
  const numero = Number(limpo);
  return Number.isFinite(numero) ? numero : null;
}

export function CampoNumero({
  rotulo,
  dica,
  erro,
  aviso,
  sucesso,
  obrigatorio,
  className,
  valor,
  aoMudar,
  aoAjustarAoLimite,
  minimo = -Infinity,
  maximo = Infinity,
  passo = 1,
  casasDecimais = 0,
  sufixo,
  placeholder,
  icone: Icone,
  desabilitado = false,
  id,
}: CampoNumeroProps) {
  const [texto, setTexto] = useState(() => formatar(valor, casasDecimais));
  const [editando, setEditando] = useState(false);
  const valorAtual = useRef(valor);
  const repeticao = useRef({ espera: 0, intervalo: 0 });

  valorAtual.current = valor;

  useEffect(() => {
    if (!editando) setTexto(formatar(valor, casasDecimais));
  }, [valor, casasDecimais, editando]);

  useEffect(() => () => pararRepeticao(), []);

  const limitar = (numero: number) => {
    const fator = 10 ** casasDecimais;
    return Math.min(Math.max(Math.round(numero * fator) / fator, minimo), maximo);
  };

  const definir = (numero: number) => {
    valorAtual.current = numero;
    aoMudar(numero);
    setTexto(formatar(numero, casasDecimais));
  };

  const incrementar = (direcao: 1 | -1) => {
    const base = valorAtual.current ?? (Number.isFinite(minimo) && minimo > 0 ? minimo - passo * direcao : 0);
    const proximo = limitar(base + passo * direcao);
    if (proximo === valorAtual.current) {
      pararRepeticao();
      return;
    }
    definir(proximo);
  };

  function pararRepeticao() {
    window.clearTimeout(repeticao.current.espera);
    window.clearInterval(repeticao.current.intervalo);
  }

  const iniciarRepeticao = (evento: PointerEvent<HTMLButtonElement>, direcao: 1 | -1) => {
    if (evento.button !== 0) return;
    evento.preventDefault();
    pararRepeticao();
    incrementar(direcao);
    window.addEventListener('pointerup', pararRepeticao, { once: true });
    repeticao.current.espera = window.setTimeout(() => {
      repeticao.current.intervalo = window.setInterval(() => incrementar(direcao), INTERVALO_REPETICAO_MS);
    }, ESPERA_ANTES_DE_REPETIR_MS);
  };

  const confirmarTexto = () => {
    setEditando(false);
    const numero = interpretar(texto);
    const final = numero === null ? null : limitar(numero);
    aoMudar(final);
    setTexto(formatar(final, casasDecimais));
    if (numero !== null && final !== null && (numero < minimo || numero > maximo)) {
      aoAjustarAoLimite?.({ digitado: numero, ajustado: final });
    }
  };

  const aoTeclar = (evento: KeyboardEvent<HTMLInputElement>) => {
    const acoes: Record<string, () => void> = {
      ArrowUp: () => incrementar(1),
      ArrowDown: () => incrementar(-1),
      PageUp: () => {
        for (let vez = 0; vez < 10; vez += 1) incrementar(1);
      },
      PageDown: () => {
        for (let vez = 0; vez < 10; vez += 1) incrementar(-1);
      },
      Home: () => Number.isFinite(minimo) && definir(minimo),
      End: () => Number.isFinite(maximo) && definir(maximo),
      Enter: confirmarTexto,
    };
    const acao = acoes[evento.key];
    if (!acao) return;
    evento.preventDefault();
    acao();
  };

  const noMinimo = valor !== null && valor <= minimo;
  const noMaximo = valor !== null && valor >= maximo;

  return (
    <EstruturaCampo
      id={id}
      rotulo={rotulo}
      dica={dica}
      erro={erro}
      aviso={aviso}
      sucesso={sucesso}
      obrigatorio={obrigatorio}
      className={className}
    >
      {({ idControle, idDescricao }) => (
        <div className={classesControle(erro, sucesso, estilos.controle)}>
          {Icone ? <Icone className={estilosCampo.icone} size={16} strokeWidth={2} aria-hidden="true" /> : null}
          <input
            id={idControle}
            type="text"
            inputMode={casasDecimais > 0 ? 'decimal' : 'numeric'}
            role="spinbutton"
            autoComplete="off"
            className={juntarClasses(estilosCampo.entrada, 'numeros')}
            value={texto}
            placeholder={placeholder}
            disabled={desabilitado}
            required={obrigatorio}
            aria-valuenow={valor ?? undefined}
            aria-valuemin={Number.isFinite(minimo) ? minimo : undefined}
            aria-valuemax={Number.isFinite(maximo) ? maximo : undefined}
            aria-valuetext={valor !== null && sufixo ? `${formatar(valor, casasDecimais)} ${sufixo}` : undefined}
            aria-invalid={erro ? true : undefined}
            aria-describedby={idDescricao}
            onFocus={() => setEditando(true)}
            onChange={(evento) => setTexto(evento.target.value.replace(/[^\d,.-]/g, ''))}
            onBlur={confirmarTexto}
            onKeyDown={aoTeclar}
          />
          {sufixo ? (
            <span className={estilos.sufixo} aria-hidden="true">
              {sufixo}
            </span>
          ) : null}
          <div className={estilos.botoes}>
            <button
              type="button"
              tabIndex={-1}
              className={estilos.botao}
              aria-label="Diminuir"
              disabled={desabilitado || noMinimo}
              onPointerDown={(evento) => iniciarRepeticao(evento, -1)}
              onPointerUp={pararRepeticao}
              onPointerLeave={pararRepeticao}
              onPointerCancel={pararRepeticao}
            >
              <Minus size={14} strokeWidth={2.25} aria-hidden="true" />
            </button>
            <span className={estilos.divisor} aria-hidden="true" />
            <button
              type="button"
              tabIndex={-1}
              className={estilos.botao}
              aria-label="Aumentar"
              disabled={desabilitado || noMaximo}
              onPointerDown={(evento) => iniciarRepeticao(evento, 1)}
              onPointerUp={pararRepeticao}
              onPointerLeave={pararRepeticao}
              onPointerCancel={pararRepeticao}
            >
              <Plus size={14} strokeWidth={2.25} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </EstruturaCampo>
  );
}
