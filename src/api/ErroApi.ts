import type { ErroCampoDTO } from '@/modelos/comum';

export type TipoErroApi =
  | 'REDE'
  | 'TEMPO_ESGOTADO'
  | 'VALIDACAO'
  | 'NAO_ENCONTRADO'
  | 'CONFLITO'
  | 'SERVIDOR'
  | 'CANCELADO';

export class ErroApi extends Error {
  readonly tipo: TipoErroApi;
  readonly status: number;
  readonly erros: ErroCampoDTO[];

  constructor(tipo: TipoErroApi, mensagem: string, status = 0, erros: ErroCampoDTO[] = []) {
    super(mensagem);
    this.name = 'ErroApi';
    this.tipo = tipo;
    this.status = status;
    this.erros = erros;
  }
}

export function ehCancelamento(erro: unknown): boolean {
  return (
    (erro instanceof ErroApi && erro.tipo === 'CANCELADO') ||
    (erro instanceof DOMException && erro.name === 'AbortError')
  );
}

export function tipoPorStatus(status: number): TipoErroApi {
  if (status === 400 || status === 422) return 'VALIDACAO';
  if (status === 404) return 'NAO_ENCONTRADO';
  if (status === 409) return 'CONFLITO';
  return 'SERVIDOR';
}
