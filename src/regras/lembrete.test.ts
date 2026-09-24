import { describe, expect, it } from 'vitest';
import { chaveDoLembrete, lembreteDevido, momentoDoLembrete } from './lembrete';

const tarefa = {
  id: 7,
  data: '2026-09-24',
  diaInteiro: false,
  horarioInicio: '16:30',
  lembreteMinutosAntes: 30 as const,
  situacao: 'PENDENTE' as const,
};

const em = (texto: string) => new Date(texto);

describe('lembrete', () => {
  it('calcula o momento a partir do horário de início', () => {
    expect(momentoDoLembrete(tarefa)?.getTime()).toBe(em('2026-09-24T16:00:00').getTime());
  });

  it('dispara a partir do momento e por até 10 minutos', () => {
    expect(lembreteDevido(tarefa, em('2026-09-24T15:59:00'))).toBe(false);
    expect(lembreteDevido(tarefa, em('2026-09-24T16:00:00'))).toBe(true);
    expect(lembreteDevido(tarefa, em('2026-09-24T16:09:59'))).toBe(true);
    expect(lembreteDevido(tarefa, em('2026-09-24T16:10:00'))).toBe(false);
  });

  it('não dispara para tarefa concluída, sem horário ou sem lembrete', () => {
    const agora = em('2026-09-24T16:01:00');
    expect(lembreteDevido({ ...tarefa, situacao: 'CONCLUIDA' }, agora)).toBe(false);
    expect(lembreteDevido({ ...tarefa, diaInteiro: true }, agora)).toBe(false);
    expect(lembreteDevido({ ...tarefa, lembreteMinutosAntes: null }, agora)).toBe(false);
  });

  it('muda a chave quando o horário ou a antecedência mudam', () => {
    expect(chaveDoLembrete(tarefa)).not.toBe(chaveDoLembrete({ ...tarefa, horarioInicio: '17:00' }));
    expect(chaveDoLembrete(tarefa)).not.toBe(chaveDoLembrete({ ...tarefa, lembreteMinutosAntes: 15 }));
  });
});
