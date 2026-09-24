const formatadorDiaSemana = new Intl.DateTimeFormat('pt-BR', { weekday: 'long' });
const formatadorDiaMes = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long' });
const formatadorPorExtenso = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

export const NOMES_MESES = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
] as const;

export const NOMES_DIAS_SEMANA = [
  'domingo',
  'segunda-feira',
  'terça-feira',
  'quarta-feira',
  'quinta-feira',
  'sexta-feira',
  'sábado',
] as const;

export const INICIAIS_DIAS_SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'] as const;

export function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function formatarDiaSemana(data: Date): string {
  return capitalizar(formatadorDiaSemana.format(data));
}

export function formatarDiaMes(data: Date): string {
  return formatadorDiaMes.format(data);
}

export function formatarDataPorExtenso(data: Date): string {
  return formatadorPorExtenso.format(data);
}

export function dataIsoLocal(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

export function deDataIso(iso: string): Date {
  const [ano = 1970, mes = 1, dia = 1] = iso.split('-').map(Number);
  return new Date(ano, mes - 1, dia);
}

export function formatarDataCurta(iso: string): string {
  const [ano, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${ano}`;
}

export function hoje(): Date {
  const agora = new Date();
  return new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
}

export function mesmoDia(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function adicionarDias(data: Date, dias: number): Date {
  return new Date(data.getFullYear(), data.getMonth(), data.getDate() + dias);
}

export function diasNoMes(ano: number, mes: number): number {
  return new Date(ano, mes + 1, 0).getDate();
}

export function adicionarMeses(data: Date, meses: number): Date {
  const alvo = new Date(data.getFullYear(), data.getMonth() + meses, 1);
  const dia = Math.min(data.getDate(), diasNoMes(alvo.getFullYear(), alvo.getMonth()));
  return new Date(alvo.getFullYear(), alvo.getMonth(), dia);
}

export function comMesEAno(data: Date, ano: number, mes: number): Date {
  return new Date(ano, mes, Math.min(data.getDate(), diasNoMes(ano, mes)));
}

export function gradeDoMes(ano: number, mes: number): Date[] {
  const primeiro = new Date(ano, mes, 1);
  const inicio = adicionarDias(primeiro, -primeiro.getDay());
  return Array.from({ length: 42 }, (_, indice) => adicionarDias(inicio, indice));
}

export function inicioDaSemana(data: Date): Date {
  return adicionarDias(new Date(data.getFullYear(), data.getMonth(), data.getDate()), -data.getDay());
}

export function adicionarDiasIso(iso: string, dias: number): string {
  return dataIsoLocal(adicionarDias(deDataIso(iso), dias));
}

export function diasEntre(inicioIso: string, fimIso: string): number {
  return Math.round((deDataIso(fimIso).getTime() - deDataIso(inicioIso).getTime()) / 86400000);
}

export function intervaloDeDias(inicioIso: string, fimIso: string): string[] {
  const total = diasEntre(inicioIso, fimIso);
  return Array.from({ length: Math.max(0, total + 1) }, (_, indice) => adicionarDiasIso(inicioIso, indice));
}

export function hojeIso(): string {
  return dataIsoLocal(hoje());
}
