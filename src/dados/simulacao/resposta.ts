import type { RespostaTransporte } from '@/api/transporte';
import type { ErroCampoDTO, ErrorResponseDTO } from '@/modelos/comum';

export const TIPOS_PROBLEMA_SIMULADOS = {
  validacao: '/problems/validation-error',
  requisicaoInvalida: '/problems/invalid-request',
  naoEncontrado: '/problems/entity-not-found',
  rotaInexistente: '/problems/resource-not-found',
  conflito: '/problems/data-conflict',
  indisponivel: '/problems/service-unavailable',
} as const;

export function ok(corpo: unknown): RespostaTransporte {
  return { status: 200, corpo };
}

export function problema(status: number, titulo: string, tipo: string, detalhe: string, erros?: ErroCampoDTO[]): RespostaTransporte {
  const corpo: ErrorResponseDTO = { status, title: titulo, instance: '', type: tipo, detail: detalhe };
  if (erros && erros.length > 0) corpo.errors = erros;
  return { status, corpo };
}

export function naoEncontrado(detalhe: string): RespostaTransporte {
  return problema(404, 'Registro não encontrado!', TIPOS_PROBLEMA_SIMULADOS.naoEncontrado, detalhe);
}

export function rotaInexistente(detalhe: string): RespostaTransporte {
  return problema(404, 'Recurso não encontrado!', TIPOS_PROBLEMA_SIMULADOS.rotaInexistente, detalhe);
}

export function requisicaoInvalida(detalhe: string): RespostaTransporte {
  return problema(400, 'Requisição Inválida!', TIPOS_PROBLEMA_SIMULADOS.requisicaoInvalida, detalhe);
}

export function criado(corpo: unknown): RespostaTransporte {
  return { status: 201, corpo };
}

export function semConteudo(): RespostaTransporte {
  return { status: 204, corpo: undefined };
}

export function dadosInvalidos(erros: ErroCampoDTO[]): RespostaTransporte {
  return problema(400, 'Erro de Validação!', TIPOS_PROBLEMA_SIMULADOS.validacao, 'Revise os campos destacados e tente de novo.', erros);
}

export function conflito(detalhe: string, erros: ErroCampoDTO[] = []): RespostaTransporte {
  return problema(409, 'Conflito de Dados!', TIPOS_PROBLEMA_SIMULADOS.conflito, detalhe, erros);
}

export function servicoIndisponivel(detalhe: string): RespostaTransporte {
  return problema(503, 'Serviço Indisponível!', TIPOS_PROBLEMA_SIMULADOS.indisponivel, detalhe);
}
