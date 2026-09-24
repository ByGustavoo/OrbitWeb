import type { DiaSemana } from '@/modelos/enumeracoes';
import { DIAS_SEMANA } from '@/modelos/enumeracoes';
import type { RecorrenciaDTO } from '@/modelos/tarefas';
import { adicionarDiasIso, dataIsoLocal, deDataIso, diasNoMes, NOMES_MESES } from '@/utilitarios/datas';
import { formatarDataLonga } from '@/utilitarios/formatacao';

const LIMITE_ITERACOES = 5000;

const pluralDia: Record<DiaSemana, { nome: string; feminino: boolean }> = {
  DOMINGO: { nome: 'domingos', feminino: false },
  SEGUNDA: { nome: 'segundas', feminino: true },
  TERCA: { nome: 'terças', feminino: true },
  QUARTA: { nome: 'quartas', feminino: true },
  QUINTA: { nome: 'quintas', feminino: true },
  SEXTA: { nome: 'sextas', feminino: true },
  SABADO: { nome: 'sábados', feminino: false },
};

export function diaSemanaDe(iso: string): DiaSemana {
  return DIAS_SEMANA[deDataIso(iso).getDay()] ?? 'DOMINGO';
}

export function ordenarDiasSemana(dias: DiaSemana[]): DiaSemana[] {
  return [...new Set(dias)].sort((a, b) => DIAS_SEMANA.indexOf(a) - DIAS_SEMANA.indexOf(b));
}

function diaNoMes(ano: number, mes: number, dia: number): string {
  return dataIsoLocal(new Date(ano, mes, Math.min(dia, diasNoMes(ano, mes))));
}

export function gerarDatasOcorrencias(recorrencia: RecorrenciaDTO, inicioSerie: string, de: string, ate: string): string[] {
  const limite = recorrencia.dataFim && recorrencia.dataFim < ate ? recorrencia.dataFim : ate;
  const datas: string[] = [];
  const incluir = (data: string) => {
    if (data >= de && data <= limite && data >= inicioSerie) datas.push(data);
  };

  if (recorrencia.frequencia === 'MENSAL' || recorrencia.frequencia === 'ANUAL') {
    const inicio = deDataIso(inicioSerie);
    const passoMeses = recorrencia.frequencia === 'MENSAL' ? 1 : 12;
    for (let indice = 0; indice < LIMITE_ITERACOES; indice += 1) {
      const data = diaNoMes(inicio.getFullYear(), inicio.getMonth() + indice * passoMeses, inicio.getDate());
      if (data > limite) break;
      incluir(data);
    }
    return datas;
  }

  const passo = recorrencia.frequencia === 'SEMANAL' ? 7 : 1;
  const dias = new Set(recorrencia.diasSemana ?? []);
  let cursor = inicioSerie;
  for (let indice = 0; indice < LIMITE_ITERACOES * 2 && cursor <= limite; indice += 1) {
    const valida =
      recorrencia.frequencia !== 'DIAS_DA_SEMANA' || cursor === inicioSerie || dias.has(diaSemanaDe(cursor));
    if (valida) incluir(cursor);
    cursor = adicionarDiasIso(cursor, passo);
  }
  return datas;
}

function juntarLista(itens: string[]): string {
  if (itens.length <= 1) return itens.join('');
  return `${itens.slice(0, -1).join(', ')} e ${itens[itens.length - 1]}`;
}

function descreverDiasSemana(dias: DiaSemana[]): string {
  const ordenados = ordenarDiasSemana(dias);
  if (ordenados.length === 7) return 'Todos os dias';
  const uteis: DiaSemana[] = ['SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA'];
  if (ordenados.length === 5 && uteis.every((dia) => ordenados.includes(dia))) return 'De segunda a sexta';

  let generoAnterior: boolean | null = null;
  const partes = ordenados.map((dia) => {
    const { nome, feminino } = pluralDia[dia];
    const comArtigo = generoAnterior !== feminino;
    generoAnterior = feminino;
    return comArtigo ? `${feminino ? 'às' : 'aos'} ${nome}` : nome;
  });
  const frase = juntarLista(partes);
  return frase.charAt(0).toUpperCase() + frase.slice(1);
}

export function descreverRecorrencia(recorrencia: RecorrenciaDTO, inicioSerie: string): string {
  const inicio = deDataIso(inicioSerie);
  let base: string;

  switch (recorrencia.frequencia) {
    case 'DIARIA':
      base = 'Todos os dias';
      break;
    case 'DIAS_DA_SEMANA':
      base = descreverDiasSemana(recorrencia.diasSemana ?? []);
      break;
    case 'SEMANAL': {
      const { nome, feminino } = pluralDia[diaSemanaDe(inicioSerie)];
      base = `Toda semana, ${feminino ? 'às' : 'aos'} ${nome}`;
      break;
    }
    case 'MENSAL': {
      const dia = inicio.getDate();
      base = dia > 28 ? `Todo mês, no dia ${dia} (ou no último dia, nos meses mais curtos)` : `Todo mês, no dia ${dia}`;
      break;
    }
    case 'ANUAL':
      base = `Todo ano, em ${inicio.getDate()} de ${NOMES_MESES[inicio.getMonth()]}`;
      break;
  }

  return recorrencia.dataFim ? `${base}, até ${formatarDataLonga(recorrencia.dataFim)}` : base;
}

export function mesmaRecorrencia(a: RecorrenciaDTO | null, b: RecorrenciaDTO | null): boolean {
  if (a === null || b === null) return a === b;
  const diasA = ordenarDiasSemana(a.diasSemana ?? []).join(',');
  const diasB = ordenarDiasSemana(b.diasSemana ?? []).join(',');
  return a.frequencia === b.frequencia && diasA === diasB && (a.dataFim ?? null) === (b.dataFim ?? null);
}
