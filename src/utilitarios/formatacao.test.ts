import { describe, expect, it } from 'vitest';
import { formatarIntervaloDias } from './formatacao';

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
