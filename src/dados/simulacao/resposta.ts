import type { RespostaTransporte } from '@/api/transporte';
import type { ErroCampoDTO } from '@/modelos/comum';

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

export function criado(corpo: unknown): RespostaTransporte {
  return { status: 201, corpo };
}

export function semConteudo(): RespostaTransporte {
  return { status: 204, corpo: undefined };
}

export function dadosInvalidos(erros: ErroCampoDTO[]): RespostaTransporte {
  return {
    status: 400,
    corpo: { status: 400, title: 'Dados inválidos', detail: 'Revise os campos destacados e tente de novo.', erros },
  };
}

export function conflito(detalhe: string, erros: ErroCampoDTO[] = []): RespostaTransporte {
  return { status: 409, corpo: { status: 409, title: 'Conflito', detail: detalhe, erros } };
}
