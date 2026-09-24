import { capitalizar, deDataIso, diasEntre } from './datas';

const formatadorNumero = new Intl.NumberFormat('pt-BR');
const formatadorDecimal = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });
const formatadorDiaCurto = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' });
const formatadorDiaMesCurto = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short' });
const formatadorDiaCompleto = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
const formatadorMes = new Intl.DateTimeFormat('pt-BR', { month: 'long' });
const formatadorHorario = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' });
const formatadorRelativo = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' });

export function formatarNumero(valor: number): string {
  return formatadorNumero.format(valor);
}

export function formatarDecimal(valor: number): string {
  return formatadorDecimal.format(valor);
}

export function formatarDuracao(minutosTotais: number): string {
  const minutos = Math.max(0, Math.round(minutosTotais));
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  return resto === 0 ? `${horas}h` : `${horas}h ${resto}min`;
}

export function formatarDuracaoPorExtenso(minutosTotais: number): string {
  const minutos = Math.max(0, Math.round(minutosTotais));
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  const partes: string[] = [];
  if (horas > 0) partes.push(`${horas} ${horas === 1 ? 'hora' : 'horas'}`);
  if (resto > 0 || horas === 0) partes.push(`${resto} ${resto === 1 ? 'minuto' : 'minutos'}`);
  return partes.join(' e ');
}

export function formatarDiaCurto(iso: string): string {
  return capitalizar(formatadorDiaCurto.format(deDataIso(iso)));
}

export function formatarDiaMesCurto(iso: string): string {
  return formatadorDiaMesCurto.format(deDataIso(iso));
}

export function formatarDiaCompleto(iso: string): string {
  return capitalizar(formatadorDiaCompleto.format(deDataIso(iso)));
}

export function formatarNomeMes(iso: string): string {
  return capitalizar(formatadorMes.format(deDataIso(iso)));
}

export function formatarDiaRelativo(iso: string, hojeIso: string): string {
  const distancia = diasEntre(hojeIso, iso);
  if (distancia === 0) return 'Hoje';
  if (distancia === 1) return 'Amanhã';
  if (distancia === -1) return 'Ontem';
  return formatarDiaCurto(iso);
}

export function formatarHorario(instante: string): string {
  return formatadorHorario.format(new Date(instante));
}

export function formatarTempoRelativo(instante: string, agora: Date = new Date()): string {
  const momento = new Date(instante);
  const segundos = Math.round((momento.getTime() - agora.getTime()) / 1000);
  if (Math.abs(segundos) < 60) return 'Agora mesmo';
  if (Math.abs(segundos) < 3600) return capitalizar(formatadorRelativo.format(Math.round(segundos / 60), 'minute'));

  const inicioHoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
  const inicioMomento = new Date(momento.getFullYear(), momento.getMonth(), momento.getDate());
  const dias = Math.round((inicioMomento.getTime() - inicioHoje.getTime()) / 86400000);

  if (dias === 0) return capitalizar(formatadorRelativo.format(Math.round(segundos / 3600), 'hour'));
  if (dias === -1) return `Ontem, às ${formatarHorario(instante)}`;
  if (dias > -7) return capitalizar(formatadorRelativo.format(dias, 'day'));
  return capitalizar(formatadorDiaMesCurto.format(momento));
}

export function pluralizar(quantidade: number, singular: string, plural: string): string {
  return `${formatarNumero(quantidade)} ${quantidade === 1 ? singular : plural}`;
}

const formatadorMesAno = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' });
const formatadorInstante = new Intl.DateTimeFormat('pt-BR', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export function formatarMesAno(data: Date): string {
  return capitalizar(formatadorMesAno.format(data));
}

export function formatarInstante(instante: string): string {
  return formatadorInstante.format(new Date(instante)).replace(',', ' às');
}

export function formatarIntervaloHorario(inicio: string | null, fim: string | null, diaInteiro: boolean): string {
  if (diaInteiro || !inicio) return 'Dia inteiro';
  return fim ? `${inicio} – ${fim}` : `A partir das ${inicio}`;
}

const doisDigitos = (valor: number) => String(valor).padStart(2, '0');

export function formatarRelogio(segundosTotais: number): string {
  const segundos = Math.max(0, Math.floor(segundosTotais));
  const horas = Math.floor(segundos / 3600);
  const minutos = Math.floor((segundos % 3600) / 60);
  return `${doisDigitos(horas)}:${doisDigitos(minutos)}:${doisDigitos(segundos % 60)}`;
}

export function formatarContagemRegressiva(segundosTotais: number): string {
  const segundos = Math.max(0, Math.ceil(segundosTotais));
  return `${doisDigitos(Math.floor(segundos / 60))}:${doisDigitos(segundos % 60)}`;
}

export function formatarDuracaoSegundos(segundosTotais: number): string {
  const segundos = Math.max(0, Math.floor(segundosTotais));
  if (segundos < 60) return `${segundos} s`;
  const minutos = Math.floor(segundos / 60);
  if (minutos < 60) return segundos % 60 === 0 ? `${minutos} min` : `${minutos} min ${segundos % 60} s`;
  return formatarDuracao(minutos);
}

export function formatarDuracaoSegundosPorExtenso(segundosTotais: number): string {
  const segundos = Math.max(0, Math.floor(segundosTotais));
  const horas = Math.floor(segundos / 3600);
  const minutos = Math.floor((segundos % 3600) / 60);
  const resto = segundos % 60;
  const partes: string[] = [];
  if (horas > 0) partes.push(`${horas} ${horas === 1 ? 'hora' : 'horas'}`);
  if (minutos > 0) partes.push(`${minutos} ${minutos === 1 ? 'minuto' : 'minutos'}`);
  if (resto > 0 || partes.length === 0) partes.push(`${resto} ${resto === 1 ? 'segundo' : 'segundos'}`);
  return partes.length > 1 ? `${partes.slice(0, -1).join(', ')} e ${partes[partes.length - 1]}` : partes[0] ?? '';
}

const formatadorDiaMesLongo = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long' });

export function formatarDataLonga(iso: string): string {
  const data = deDataIso(iso);
  return `${formatadorDiaMesLongo.format(data)} de ${data.getFullYear()}`;
}

export function formatarIntervaloDias(inicioIso: string, fimIso: string): string {
  const inicio = deDataIso(inicioIso);
  const fim = deDataIso(fimIso);
  const ano = fim.getFullYear();
  if (inicio.getFullYear() !== ano) {
    return `${formatadorDiaMesLongo.format(inicio)} de ${inicio.getFullYear()} — ${formatadorDiaMesLongo.format(fim)} de ${ano}`;
  }
  if (inicio.getMonth() !== fim.getMonth()) {
    return `${formatadorDiaMesLongo.format(inicio)} — ${formatadorDiaMesLongo.format(fim)} de ${ano}`;
  }
  return `${inicio.getDate()} — ${formatadorDiaMesLongo.format(fim)} de ${ano}`;
}
