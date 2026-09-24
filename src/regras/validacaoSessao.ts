import type { SessaoEnvioDTO } from '@/modelos/estudos';
import { formatarHorario, formatarNumero } from '@/utilitarios/formatacao';
import { DURACAO_MINIMA_SESSAO_SEGUNDOS } from './cronometro';

export const LIMITE_OBSERVACAO_SESSAO = 500;
export const DURACAO_MAXIMA_SESSAO_SEGUNDOS = 24 * 3600;
const TOLERANCIA_FUTURO_MS = 60 * 1000;

export type CampoSessao = 'atividadeId' | 'inicio' | 'duracaoSegundos' | 'observacao';

export type ErrosSessao = Partial<Record<CampoSessao, string>>;

export const ORDEM_CAMPOS_SESSAO: CampoSessao[] = ['atividadeId', 'inicio', 'duracaoSegundos', 'observacao'];

function instanteValido(valor: string): boolean {
  return typeof valor === 'string' && !Number.isNaN(new Date(valor).getTime());
}

export function validarSessao(dados: SessaoEnvioDTO, agora: Date): ErrosSessao {
  const erros: ErrosSessao = {};

  if (!Number.isInteger(dados.atividadeId) || dados.atividadeId <= 0) erros.atividadeId = 'Escolha a atividade que você estudou.';

  const inicioValido = instanteValido(dados.inicio);
  if (!inicioValido) erros.inicio = 'Informe quando a sessão começou.';
  else if (new Date(dados.inicio).getTime() > agora.getTime() + TOLERANCIA_FUTURO_MS) {
    erros.inicio = 'A sessão não pode começar depois de agora.';
  }

  const duracao = dados.duracaoSegundos;
  if (!Number.isFinite(duracao) || duracao < DURACAO_MINIMA_SESSAO_SEGUNDOS) {
    erros.duracaoSegundos = 'A sessão precisa ter pelo menos 1 minuto.';
  } else if (duracao > DURACAO_MAXIMA_SESSAO_SEGUNDOS) {
    erros.duracaoSegundos = 'Uma sessão pode ter no máximo 24 horas.';
  } else if (inicioValido && instanteValido(dados.fim)) {
    const inicio = new Date(dados.inicio).getTime();
    const fim = new Date(dados.fim).getTime();
    if (fim < inicio) erros.duracaoSegundos = 'O fim da sessão precisa ser depois do início.';
    else if (duracao * 1000 > fim - inicio + 1000) erros.duracaoSegundos = 'A duração não pode passar do tempo entre o início e o fim.';
    else if (fim > agora.getTime() + TOLERANCIA_FUTURO_MS && !erros.inicio) {
      erros.duracaoSegundos = `Com essa duração, a sessão terminaria às ${formatarHorario(dados.fim)}, depois de agora. Ajuste o início ou a duração.`;
    }
  } else if (!instanteValido(dados.fim)) {
    erros.duracaoSegundos = 'Informe a duração da sessão.';
  }

  if ((dados.observacao?.length ?? 0) > LIMITE_OBSERVACAO_SESSAO) {
    erros.observacao = `Use no máximo ${formatarNumero(LIMITE_OBSERVACAO_SESSAO)} caracteres na observação. Agora são ${formatarNumero(dados.observacao?.length ?? 0)}.`;
  }

  return erros;
}

export function primeiroCampoComErroSessao(erros: ErrosSessao): CampoSessao | null {
  return ORDEM_CAMPOS_SESSAO.find((campo) => erros[campo]) ?? null;
}
