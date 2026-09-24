import { describe, expect, it } from 'vitest';
import {
  continuarSessao,
  encerrarSessao,
  iniciarProximaFase,
  iniciarSessao,
  lerCronometro,
  lerSessaoSalva,
  montarEnvioSessao,
  pausarSessao,
  pularPausa,
  retomarSessao,
} from './cronometro';

const atividade = { id: 3, nome: 'Leitura', cor: 'LARANJA' as const };
const inicio = new Date('2026-09-24T14:00:00.000Z');

function depois(segundos: number): Date {
  return new Date(inicio.getTime() + Math.round(segundos * 1000));
}

describe('cronômetro livre', () => {
  it('conta o tempo real a partir do início, sem depender de um contador', () => {
    const sessao = iniciarSessao({ atividade, modo: 'LIVRE' }, inicio);
    expect(lerCronometro(sessao, depois(0)).segundosEstudo).toBe(0);
    expect(lerCronometro(sessao, depois(1458)).segundosEstudo).toBe(1458);
  });

  it('continua certo depois de um longo período com a aba em segundo plano', () => {
    const sessao = iniciarSessao({ atividade, modo: 'LIVRE' }, inicio);
    expect(lerCronometro(sessao, depois(3 * 3600 + 7)).segundosEstudo).toBe(10807);
  });

  it('não conta o tempo em que ficou pausada', () => {
    let sessao = iniciarSessao({ atividade, modo: 'LIVRE' }, inicio);
    sessao = pausarSessao(sessao, depois(600));
    expect(lerCronometro(sessao, depois(1500)).segundosEstudo).toBe(600);
    sessao = retomarSessao(sessao, depois(1500));
    expect(lerCronometro(sessao, depois(1800)).segundosEstudo).toBe(900);
    expect(sessao.pausas).toBe(1);
  });

  it('mantém a precisão em várias pausas curtas seguidas', () => {
    let sessao = iniciarSessao({ atividade, modo: 'LIVRE' }, inicio);
    let momento = 0;
    for (let volta = 0; volta < 10; volta += 1) {
      momento += 0.6;
      sessao = pausarSessao(sessao, depois(momento));
      momento += 5;
      sessao = retomarSessao(sessao, depois(momento));
    }
    expect(lerCronometro(sessao, depois(momento)).segundosEstudo).toBe(6);
  });

  it('ignora pausar uma sessão pausada e retomar uma que está rodando', () => {
    const sessao = iniciarSessao({ atividade, modo: 'LIVRE' }, inicio);
    expect(retomarSessao(sessao, depois(10))).toBe(sessao);
    const pausada = pausarSessao(sessao, depois(10));
    expect(pausarSessao(pausada, depois(20))).toBe(pausada);
  });

  it('congela a leitura ao encerrar e, ao continuar, não conta o tempo do resumo aberto', () => {
    let sessao = iniciarSessao({ atividade, modo: 'LIVRE' }, inicio);
    sessao = encerrarSessao(sessao, depois(300));
    expect(lerCronometro(sessao, depois(900)).segundosEstudo).toBe(300);
    sessao = continuarSessao(sessao, depois(900));
    expect(sessao.estado).toBe('RODANDO');
    expect(lerCronometro(sessao, depois(1000)).segundosEstudo).toBe(400);
    expect(sessao.pausas).toBe(0);
  });

  it('continuar uma sessão que estava pausada mantém a pausa', () => {
    let sessao = pausarSessao(iniciarSessao({ atividade, modo: 'LIVRE' }, inicio), depois(120));
    sessao = continuarSessao(encerrarSessao(sessao, depois(500)), depois(600));
    expect(sessao.estado).toBe('PAUSADA');
    expect(lerCronometro(sessao, depois(900)).segundosEstudo).toBe(120);
  });

  it('monta o envio com início, fim, duração efetiva e observação limpa', () => {
    let sessao = iniciarSessao({ atividade, tarefa: { id: 9, titulo: 'Ler o capítulo 3' }, modo: 'LIVRE' }, inicio);
    sessao = pausarSessao(sessao, depois(600));
    sessao = retomarSessao(sessao, depois(900));
    sessao = encerrarSessao(sessao, depois(1500));
    expect(montarEnvioSessao(sessao, { observacao: '  capítulo 3  ' }, depois(2000))).toEqual({
      atividadeId: 3,
      tarefaId: 9,
      modo: 'LIVRE',
      origem: 'CRONOMETRO',
      inicio: inicio.toISOString(),
      fim: depois(1500).toISOString(),
      duracaoSegundos: 1200,
      ciclosConcluidos: null,
      observacao: 'capítulo 3',
    });
  });

  it('usa a duração ajustada quando a pessoa corrige o tempo', () => {
    const sessao = encerrarSessao(iniciarSessao({ atividade, modo: 'LIVRE' }, inicio), depois(7200));
    expect(montarEnvioSessao(sessao, { duracaoSegundos: 2700, observacao: '' }, depois(7200))).toMatchObject({
      duracaoSegundos: 2700,
      observacao: null,
    });
  });
});

describe('cronômetro Pomodoro', () => {
  it('conta só até o fim do foco e espera a confirmação', () => {
    const sessao = iniciarSessao({ atividade, modo: 'POMODORO' }, inicio);
    const leitura = lerCronometro(sessao, depois(40 * 60));
    expect(leitura.segundosEstudo).toBe(1500);
    expect(leitura.faseConcluida).toBe(true);
    expect(leitura.segundosRestantesFase).toBe(0);
    expect(leitura.ciclosConcluidos).toBe(1);
    expect(leitura.proximaFase).toBe('PAUSA_CURTA');
  });

  it('não conta a pausa como estudo', () => {
    let sessao = iniciarSessao({ atividade, modo: 'POMODORO' }, inicio);
    sessao = iniciarProximaFase(sessao, depois(1500));
    expect(sessao.pomodoro?.fase).toBe('PAUSA_CURTA');
    const leitura = lerCronometro(sessao, depois(1500 + 240));
    expect(leitura.segundosEstudo).toBe(1500);
    expect(leitura.segundosRestantesFase).toBe(60);
  });

  it('faz a pausa longa depois do quarto ciclo', () => {
    let sessao = iniciarSessao({ atividade, modo: 'POMODORO' }, inicio);
    let momento = 0;
    for (let ciclo = 1; ciclo <= 3; ciclo += 1) {
      momento += 1500;
      sessao = iniciarProximaFase(sessao, depois(momento));
      expect(sessao.pomodoro?.fase).toBe('PAUSA_CURTA');
      momento += 300;
      sessao = iniciarProximaFase(sessao, depois(momento));
    }
    momento += 1500;
    sessao = iniciarProximaFase(sessao, depois(momento));
    expect(sessao.pomodoro?.fase).toBe('PAUSA_LONGA');
    expect(sessao.pomodoro?.ciclosConcluidos).toBe(4);
    expect(lerCronometro(sessao, depois(momento + 900)).segundosEstudo).toBe(6000);
  });

  it('pular a pausa volta ao foco contando o ciclo concluído', () => {
    let sessao = iniciarSessao({ atividade, modo: 'POMODORO' }, inicio);
    expect(pularPausa(sessao, depois(600))).toBe(sessao);
    sessao = pularPausa(sessao, depois(1600));
    expect(sessao.pomodoro?.fase).toBe('FOCO');
    expect(sessao.pomodoro?.ciclosConcluidos).toBe(1);
    expect(lerCronometro(sessao, depois(1700)).segundosEstudo).toBe(1600);
  });

  it('pausar no meio do foco preserva o tempo que falta', () => {
    let sessao = iniciarSessao({ atividade, modo: 'POMODORO' }, inicio);
    sessao = pausarSessao(sessao, depois(600));
    sessao = retomarSessao(sessao, depois(4000));
    const leitura = lerCronometro(sessao, depois(4300));
    expect(leitura.segundosEstudo).toBe(900);
    expect(leitura.segundosRestantesFase).toBe(600);
  });

  it('envia os ciclos concluídos, inclusive o foco que acabou de terminar', () => {
    const sessao = encerrarSessao(iniciarSessao({ atividade, modo: 'POMODORO' }, inicio), depois(1600));
    expect(montarEnvioSessao(sessao, {}, depois(1600))).toMatchObject({ modo: 'POMODORO', duracaoSegundos: 1500, ciclosConcluidos: 1 });
  });
});

describe('lerSessaoSalva', () => {
  it('aceita uma sessão válida guardada no navegador', () => {
    const sessao = pausarSessao(iniciarSessao({ atividade, modo: 'POMODORO' }, inicio), depois(60));
    expect(lerSessaoSalva(JSON.parse(JSON.stringify(sessao)))).toEqual(sessao);
  });

  it('descarta dados corrompidos em vez de quebrar a tela', () => {
    expect(lerSessaoSalva(null)).toBeNull();
    expect(lerSessaoSalva({ versao: 1, atividade })).toBeNull();
    expect(lerSessaoSalva({ ...iniciarSessao({ atividade, modo: 'LIVRE' }, inicio), iniciadaEm: 'ontem' })).toBeNull();
  });
});
