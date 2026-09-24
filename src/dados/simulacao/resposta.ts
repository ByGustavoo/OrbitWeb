import type { RespostaTransporte } from '@/api/transporte';

export function ok(corpo: unknown): RespostaTransporte {
  return { status: 200, corpo };
}

export function problema(status: number, titulo: string, detalhe: string): RespostaTransporte {
  return { status, corpo: { status, title: titulo, detail: detalhe } };
}

export function naoEncontrado(detalhe: string): RespostaTransporte {
  return problema(404, 'Não encontrado', detalhe);
}

export function requisicaoInvalida(detalhe: string): RespostaTransporte {
  return problema(400, 'Requisição inválida', detalhe);
}
