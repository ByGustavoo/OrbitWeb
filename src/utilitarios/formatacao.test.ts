import { describe, expect, it } from 'vitest';
import { formatarInstanteOpcional, formatarIntervaloDias, formatarVersao } from './formatacao';

describe('formatarIntervaloDias', () => {
  it('no mesmo mês, repete só o dia', () => {
    expect(formatarIntervaloDias('2026-09-20', '2026-09-26')).toBe('20 — 26 de setembro de 2026');
  });

  it('entre meses, escreve os dois meses', () => {
    expect(formatarIntervaloDias('2026-09-27', '2026-10-03')).toBe('27 de setembro — 3 de outubro de 2026');
  });

  it('entre anos, escreve os dois anos', () => {
    expect(formatarIntervaloDias('2026-12-27', '2027-01-02')).toBe('27 de dezembro de 2026 — 2 de janeiro de 2027');
  });
});

describe('formatarVersao', () => {
  it('prefixa com v a versão numérica', () => {
    expect(formatarVersao('1.0.0')).toBe('v1.0.0');
  });

  it('mantém como está o que não começa com número', () => {
    expect(formatarVersao('pr-12')).toBe('pr-12');
  });
});

describe('formatarInstanteOpcional', () => {
  it('devolve null sem instante ou com instante inválido', () => {
    expect(formatarInstanteOpcional(null)).toBeNull();
    expect(formatarInstanteOpcional('')).toBeNull();
    expect(formatarInstanteOpcional('ontem')).toBeNull();
  });

  it('formata um instante válido', () => {
    expect(formatarInstanteOpcional('2026-09-29T15:00:00')).toBe('29 de set. de 2026 às 15:00');
  });
});
