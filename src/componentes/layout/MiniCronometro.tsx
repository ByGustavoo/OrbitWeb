import { Link, useLocation } from 'react-router-dom';
import { BellRing, Pause, Play } from 'lucide-react';
import { useAgora } from '@/ganchos/useAgora';
import { useCronometro } from '@/provedores/ProvedorCronometro';
import { lerCronometro } from '@/regras/cronometro';
import { caminhos } from '@/rotas/caminhos';
import { formatarContagemRegressiva, formatarDuracaoSegundosPorExtenso, formatarRelogio } from '@/utilitarios/formatacao';
import { juntarClasses } from '@/utilitarios/juntarClasses';
import estilos from './MiniCronometro.module.css';

export function MiniCronometro() {
  const { pathname } = useLocation();
  const { sessao, pausar, retomar } = useCronometro();
  const agora = useAgora(sessao !== null && sessao.estado === 'RODANDO');

  if (!sessao || pathname === caminhos.estudos) return null;

  const leitura = lerCronometro(sessao, agora);
  const aguardando = leitura.faseConcluida;
  const encerrando = sessao.encerradaEm !== null;
  const pausada = sessao.estado === 'PAUSADA' && !encerrando;
  const emIntervalo = leitura.fase !== null && leitura.fase !== 'FOCO';
  const tempo = leitura.fase ? formatarContagemRegressiva(leitura.segundosRestantesFase) : formatarRelogio(leitura.segundosEstudo);

  const situacao = encerrando
    ? 'Finalizando'
    : aguardando
      ? leitura.fase === 'FOCO'
        ? 'Foco concluído'
        : 'Pausa concluída'
      : pausada
        ? 'Pausada'
        : emIntervalo
          ? 'Pausa'
          : leitura.fase
            ? 'Foco'
            : null;

  const descricao = `${sessao.atividade.nome}: ${situacao ? `${situacao.toLowerCase()}, ` : 'em andamento, '}${formatarDuracaoSegundosPorExtenso(leitura.segundosEstudo)} de estudo. Abrir o cronômetro.`;
  const podeAlternar = !encerrando && !aguardando && !emIntervalo;

  return (
    <div className={juntarClasses(estilos.mini, pausada && estilos.pausada, (aguardando || encerrando) && estilos.atencao)} data-mini-cronometro="">
      <Link to={caminhos.estudos} className={estilos.link} aria-label={descricao} title="Abrir o cronômetro">
        {aguardando ? (
          <BellRing size={14} strokeWidth={2.25} aria-hidden="true" className={estilos.icone} />
        ) : (
          <span className={juntarClasses(estilos.ponto, !pausada && !encerrando && estilos.pontoAoVivo)} aria-hidden="true" />
        )}
        {situacao ? <span className={estilos.situacao}>{situacao}</span> : null}
        <span className={estilos.tempo}>{tempo}</span>
        <span className={estilos.atividade}>{sessao.atividade.nome}</span>
      </Link>
      {podeAlternar ? (
        <button
          type="button"
          className={estilos.alternar}
          onClick={pausada ? retomar : pausar}
          aria-label={pausada ? 'Retomar a sessão' : 'Pausar a sessão'}
          title={pausada ? 'Retomar' : 'Pausar'}
        >
          {pausada ? <Play size={14} strokeWidth={2.25} aria-hidden="true" /> : <Pause size={14} strokeWidth={2.25} aria-hidden="true" />}
        </button>
      ) : null}
    </div>
  );
}
