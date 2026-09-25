import { useId, useState } from 'react';
import type { CSSProperties, FormEvent } from 'react';
import { AlertCircle, AlertTriangle, Pencil } from 'lucide-react';
import { descreverFalha, errosDeCampo } from '@/api/tratamentoErros';
import { AreaTexto, Botao, CampoNumero, Modal } from '@/componentes/ui';
import { coresDaPaleta } from '@/modelos/cores';
import { useCronometro } from '@/provedores/ProvedorCronometro';
import { DURACAO_MINIMA_SESSAO_SEGUNDOS, lerCronometro, segundosDeRelogio } from '@/regras/cronometro';
import type { SessaoEmAndamento } from '@/regras/cronometro';
import { LIMITE_OBSERVACAO_SESSAO } from '@/regras/validacaoSessao';
import { formatarDuracaoSegundos, formatarHorario, formatarNumero, pluralizar } from '@/utilitarios/formatacao';
import estilos from './ResumoSessao.module.css';

export interface ResumoSessaoProps {
  aberto: boolean;
  sessao: SessaoEmAndamento | null;
  aoSalvar: (opcoes: { observacao: string; duracaoSegundos: number | null }) => Promise<unknown>;
  aoPedirDescarte: () => void;
}

function mensagemFalha(erro: unknown): string {
  const [primeiroErroCampo] = Object.values(errosDeCampo(erro));
  if (primeiroErroCampo) return `${primeiroErroCampo} A sessão continua guardada neste navegador.`;
  return `Não foi possível salvar a sessão. ${descreverFalha(erro)} Ela continua guardada neste navegador.`;
}

export function ResumoSessao({ aberto, sessao, aoSalvar, aoPedirDescarte }: ResumoSessaoProps) {
  const idFormulario = useId();
  const idDuracao = useId();
  const cronometro = useCronometro();
  const [observacao, setObservacao] = useState('');
  const [ajustando, setAjustando] = useState(false);
  const [minutosAjustados, setMinutosAjustados] = useState<number | null>(null);
  const [falha, setFalha] = useState<string | null>(null);

  if (!sessao) return <Modal aberto={false} aoFechar={() => undefined} titulo="" />;

  const agora = new Date();
  const leitura = lerCronometro(sessao, agora);
  const segundosMedidos = leitura.segundosEstudo;
  const minutosMedidos = Math.max(1, Math.round(segundosMedidos / 60));
  const minutosMaximos = Math.max(minutosMedidos, Math.floor(segundosDeRelogio(sessao, agora) / 60));
  const curta = segundosMedidos < DURACAO_MINIMA_SESSAO_SEGUNDOS;
  const duracaoAjustada = ajustando && minutosAjustados !== null && minutosAjustados !== minutosMedidos ? minutosAjustados * 60 : null;
  const duracaoFinal = duracaoAjustada ?? segundosMedidos;
  const erroAjuste =
    ajustando && (minutosAjustados === null || minutosAjustados < 1)
      ? 'Informe pelo menos 1 minuto.'
      : ajustando && minutosAjustados !== null && minutosAjustados > minutosMaximos
        ? `Use no máximo ${pluralizar(minutosMaximos, 'minuto', 'minutos')}, o tempo entre o início e agora.`
        : undefined;
  const erroObservacao =
    observacao.length > LIMITE_OBSERVACAO_SESSAO
      ? `Use no máximo ${formatarNumero(LIMITE_OBSERVACAO_SESSAO)} caracteres. Agora são ${formatarNumero(observacao.length)}.`
      : undefined;
  const cores = coresDaPaleta(sessao.atividade.cor);
  const fim = sessao.encerradaEm ?? agora.toISOString();

  const detalhes = [
    `Das ${formatarHorario(sessao.iniciadaEm)} às ${formatarHorario(fim)}`,
    sessao.pomodoro
      ? pluralizar(leitura.ciclosConcluidos, 'ciclo de foco', 'ciclos de foco')
      : sessao.pausas > 0
        ? pluralizar(sessao.pausas, 'pausa', 'pausas')
        : 'sem pausas',
  ];

  const salvar = async (evento: FormEvent) => {
    evento.preventDefault();
    if (curta || cronometro.salvando) return;
    if (erroAjuste) {
      document.getElementById(idDuracao)?.focus();
      return;
    }
    if (erroObservacao) return;
    setFalha(null);
    try {
      await aoSalvar({ observacao, duracaoSegundos: duracaoAjustada });
    } catch (erro) {
      setFalha(mensagemFalha(erro));
    }
  };

  const continuar = () => {
    if (cronometro.salvando) return;
    cronometro.continuar();
  };

  return (
    <Modal
      aberto={aberto}
      aoFechar={continuar}
      titulo="Finalizar sessão"
      tamanho="sm"
      rodape={
        <>
          <Botao variante="terciario" className={estilos.descartar} onClick={aoPedirDescarte} disabled={cronometro.salvando}>
            Descartar
          </Botao>
          <Botao variante="secundario" onClick={continuar} disabled={cronometro.salvando}>
            Continuar estudando
          </Botao>
          {curta ? null : (
            <Botao type="submit" form={idFormulario} carregando={cronometro.salvando}>
              Salvar sessão
            </Botao>
          )}
        </>
      }
    >
      <form id={idFormulario} className={estilos.resumo} onSubmit={salvar} noValidate>
        <div className={estilos.destaque} style={{ '--cor-atividade': cores.texto, '--cor-atividade-suave': cores.fundo } as CSSProperties}>
          <p className={estilos.atividade}>
            <span className={estilos.cor} aria-hidden="true" />
            {sessao.atividade.nome}
          </p>
          <p className={estilos.duracao}>
            {formatarDuracaoSegundos(duracaoFinal)}
            {duracaoAjustada !== null ? <span className={estilos.ajustada}>ajustada</span> : null}
          </p>
          <p className={estilos.detalhes}>{detalhes.join(' · ')}</p>
          {sessao.tarefa ? <p className={estilos.detalhes}>Da tarefa “{sessao.tarefa.titulo}”</p> : null}
        </div>

        {falha ? (
          <p className={estilos.falha} role="alert">
            <AlertCircle size={16} strokeWidth={2} aria-hidden="true" />
            {falha}
          </p>
        ) : null}

        {curta ? (
          <p className={estilos.aviso} role="note">
            <AlertTriangle size={16} strokeWidth={2} aria-hidden="true" />
            Sessões com menos de 1 minuto não são salvas. Continue estudando ou descarte a sessão.
          </p>
        ) : (
          <>
            {ajustando ? (
              <CampoNumero
                id={idDuracao}
                rotulo="Duração efetiva"
                valor={minutosAjustados}
                aoMudar={setMinutosAjustados}
                minimo={1}
                maximo={minutosMaximos}
                sufixo="min"
                erro={erroAjuste}
                dica="Use quando o cronômetro ficou ligado depois que você parou de estudar."
              />
            ) : (
              <button
                type="button"
                className={estilos.ajustar}
                onClick={() => {
                  setMinutosAjustados(minutosMedidos);
                  setAjustando(true);
                  window.requestAnimationFrame(() => document.getElementById(idDuracao)?.focus());
                }}
              >
                <Pencil size={14} strokeWidth={2} aria-hidden="true" />
                Corrigir a duração
              </button>
            )}

            <AreaTexto
              rotulo="Observação"
              value={observacao}
              rows={2}
              placeholder="Ex.: Li os capítulos 3 e 4"
              onChange={(evento) => setObservacao(evento.target.value)}
              erro={erroObservacao}
              dica="Opcional. Aparece no histórico da sessão."
            />
          </>
        )}
      </form>
    </Modal>
  );
}
