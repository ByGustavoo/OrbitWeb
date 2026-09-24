import { describe, expect, it } from 'vitest';
import { montarEscalaCalor, nivelCalor } from './escalaCalor';

describe('escala do mapa de calor', () => {
  it('usa os quartis dos dias com valor, ignorando os zerados', () => {
    const escala = montarEscalaCalor([0, 0, 10, 20, 30, 40, 50, 60, 70, 80]);
    expect(escala).toEqual({ q1: 30, q2: 50, q3: 70 });
  });

  it('distribui os valores em cinco níveis', () => {
    const escala = { q1: 30, q2: 50, q3: 70 };
    expect([0, 5, 30, 31, 50, 70, 71, 500].map((valor) => nivelCalor(valor, escala))).toEqual([0, 1, 1, 2, 2, 3, 4, 4]);
  });

  it('sem nenhum valor, tudo fica no nível zero', () => {
    const escala = montarEscalaCalor([0, 0, 0]);
    expect(nivelCalor(0, escala)).toBe(0);
  });

  it('com um único valor, ele vai para o nível mais baixo com cor', () => {
    const escala = montarEscalaCalor([0, 45]);
    expect(nivelCalor(45, escala)).toBe(1);
  });
});
