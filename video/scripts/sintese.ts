export const TAXA = 48000;

const DOIS_PI = 2 * Math.PI;

export class Faixa {
  readonly amostras: number;
  readonly esquerda: Float32Array;
  readonly direita: Float32Array;

  constructor(amostras: number) {
    this.amostras = amostras;
    this.esquerda = new Float32Array(amostras);
    this.direita = new Float32Array(amostras);
  }

  somar(indice: number, valor: number, panorama = 0): void {
    if (indice < 0 || indice >= this.amostras) return;
    const angulo = ((panorama + 1) * Math.PI) / 4;
    this.esquerda[indice] = (this.esquerda[indice] ?? 0) + valor * Math.cos(angulo);
    this.direita[indice] = (this.direita[indice] ?? 0) + valor * Math.sin(angulo);
  }

  somarFaixa(outra: Faixa, ganho = 1): void {
    for (let n = 0; n < this.amostras; n += 1) {
      this.esquerda[n] = (this.esquerda[n] ?? 0) + (outra.esquerda[n] ?? 0) * ganho;
      this.direita[n] = (this.direita[n] ?? 0) + (outra.direita[n] ?? 0) * ganho;
    }
  }
}

export type Envelope = (t: number) => number;

export function adsr(ataque: number, duracao: number, liberacao: number, sustentacao = 1): Envelope {
  return (t) => {
    const entrada = Math.min(t / ataque, 1);
    const curvaEntrada = 1 - (1 - entrada) ** 2;
    const saida = t > duracao ? Math.max(1 - (t - duracao) / liberacao, 0) : 1;
    return curvaEntrada * sustentacao * saida ** 2;
  };
}

export function percussivo(ataque: number, decaimento: number): Envelope {
  return (t) => (t < ataque ? t / ataque : Math.exp(-(t - ataque) / decaimento));
}

export function nota(nome: string): number {
  const correspondencia = /^([A-G])(#|b)?(-?\d)$/.exec(nome);
  if (!correspondencia) throw new Error(`Nota inválida: ${nome}`);
  const [, letra, acidente, oitava] = correspondencia;
  const semitons: Record<string, number> = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 };
  const deslocamento = (semitons[letra ?? 'A'] ?? 0) + (acidente === '#' ? 1 : acidente === 'b' ? -1 : 0) + (Number(oitava) - 4) * 12;
  return 440 * 2 ** (deslocamento / 12);
}

interface Voz {
  faixa: Faixa;
  inicio: number;
  duracao: number;
  envelope: Envelope;
  ganho: number;
  panorama?: number;
}

export function tocarSeno(voz: Voz & { frequencia: (t: number) => number; harmonicos?: [number, number][] }): void {
  const primeira = Math.floor(voz.inicio * TAXA);
  const total = Math.floor(voz.duracao * TAXA);
  const harmonicos = voz.harmonicos ?? [[1, 1]];
  const fases = harmonicos.map(() => 0);
  for (let n = 0; n < total; n += 1) {
    const t = n / TAXA;
    const base = voz.frequencia(t);
    let amostra = 0;
    harmonicos.forEach(([razao, peso], indice) => {
      fases[indice] = (fases[indice] ?? 0) + (DOIS_PI * base * razao) / TAXA;
      amostra += Math.sin(fases[indice] ?? 0) * peso;
    });
    voz.faixa.somar(primeira + n, amostra * voz.envelope(t) * voz.ganho, voz.panorama ?? 0);
  }
}

export function tocarPad(voz: Voz & { frequencia: number; brilho?: number }): void {
  const limite = 2600 * (voz.brilho ?? 1);
  const harmonicos: [number, number][] = [];
  for (let ordem = 1; ordem * voz.frequencia < limite && ordem <= 24; ordem += 1) harmonicos.push([ordem, 1 / ordem]);
  for (const desafinacao of [-0.004, 0.004]) {
    tocarSeno({
      ...voz,
      frequencia: () => voz.frequencia * (1 + desafinacao),
      harmonicos,
      ganho: voz.ganho * 0.5,
      panorama: (voz.panorama ?? 0) + desafinacao * 90,
    });
  }
}

export function tocarPluck(voz: Voz & { frequencia: number }): void {
  const primeira = Math.floor(voz.inicio * TAXA);
  const total = Math.floor(voz.duracao * TAXA);
  let fase = 0;
  for (let n = 0; n < total; n += 1) {
    const t = n / TAXA;
    fase += (DOIS_PI * voz.frequencia) / TAXA;
    const brilho = Math.exp(-t / 0.06);
    const amostra = Math.sin(fase) + 0.45 * brilho * Math.sin(2 * fase) + 0.18 * brilho * Math.sin(3 * fase);
    voz.faixa.somar(primeira + n, amostra * voz.envelope(t) * voz.ganho, voz.panorama ?? 0);
  }
}

export function tocarSino(voz: Voz & { frequencia: number; razao?: number; indice?: number }): void {
  const primeira = Math.floor(voz.inicio * TAXA);
  const total = Math.floor(voz.duracao * TAXA);
  const razao = voz.razao ?? 3.5;
  const indiceMaximo = voz.indice ?? 2.2;
  let fasePortadora = 0;
  let faseModuladora = 0;
  for (let n = 0; n < total; n += 1) {
    const t = n / TAXA;
    faseModuladora += (DOIS_PI * voz.frequencia * razao) / TAXA;
    fasePortadora += (DOIS_PI * voz.frequencia) / TAXA;
    const indice = indiceMaximo * Math.exp(-t / 0.35);
    const amostra = Math.sin(fasePortadora + indice * Math.sin(faseModuladora));
    voz.faixa.somar(primeira + n, amostra * voz.envelope(t) * voz.ganho, voz.panorama ?? 0);
  }
}

export function tocarBumbo(faixa: Faixa, inicio: number, ganho: number): void {
  tocarSeno({
    faixa,
    inicio,
    duracao: 0.5,
    frequencia: (t) => 54 + 96 * Math.exp(-t / 0.03),
    envelope: percussivo(0.002, 0.15),
    ganho,
  });
  tocarSeno({ faixa, inicio, duracao: 0.02, frequencia: () => 1400, envelope: percussivo(0.0005, 0.004), ganho: ganho * 0.08 });
}

export function tocarGrave(faixa: Faixa, inicio: number, ganho: number, duracao = 1.6): void {
  tocarSeno({
    faixa,
    inicio,
    duracao,
    frequencia: (t) => 41 + 40 * Math.exp(-t / 0.09),
    envelope: percussivo(0.004, duracao / 3.2),
    ganho,
  });
}

export function tocarToque(faixa: Faixa, inicio: number, ganho: number, tom = 1, panorama = 0): void {
  tocarSeno({
    faixa,
    inicio,
    duracao: 0.06,
    frequencia: (t) => 150 * tom + 90 * tom * Math.exp(-t / 0.006),
    envelope: percussivo(0.0006, 0.011),
    ganho,
    panorama,
  });
  tocarSeno({ faixa, inicio, duracao: 0.012, frequencia: () => 3100 * tom, envelope: percussivo(0.0002, 0.0016), ganho: ganho * 0.42, panorama });
  tocarSeno({ faixa, inicio, duracao: 0.008, frequencia: () => 5300 * tom, envelope: percussivo(0.0001, 0.0009), ganho: ganho * 0.2, panorama });
}

export function tocarCliqueBotao(faixa: Faixa, inicio: number, ganho: number, panorama = 0): void {
  tocarToque(faixa, inicio, ganho, 1, panorama);
  tocarToque(faixa, inicio + 0.072, ganho * 0.45, 1.3, panorama);
}

export function tocarTecla(faixa: Faixa, inicio: number, ganho: number, variacao: number, panorama = 0): void {
  tocarToque(faixa, inicio, ganho * (0.85 + variacao * 0.3), 0.78 + variacao * 0.2, panorama);
  tocarToque(faixa, inicio + 0.055 + variacao * 0.02, ganho * 0.22, 1.25 + variacao * 0.15, panorama);
}

export function swellReverso(faixa: Faixa, fim: number, frequencias: number[], duracao: number, ganho: number): void {
  frequencias.forEach((frequencia, indice) => {
    tocarPad({
      faixa,
      inicio: fim - duracao,
      duracao,
      frequencia,
      envelope: (t) => (t / duracao) ** 3,
      ganho,
      panorama: (indice / Math.max(frequencias.length - 1, 1)) * 1.2 - 0.6,
      brilho: 1.4,
    });
  });
}

export function passaBaixa(faixa: Faixa, corte: (t: number) => number, ressonancia = 0.7): void {
  filtrar(faixa, corte, ressonancia, 'BAIXA');
}

export function passaAlta(faixa: Faixa, corte: number, ressonancia = 0.7): void {
  filtrar(faixa, () => corte, ressonancia, 'ALTA');
}

function filtrar(faixa: Faixa, corte: (t: number) => number, ressonancia: number, tipo: 'BAIXA' | 'ALTA'): void {
  for (const canal of [faixa.esquerda, faixa.direita]) {
    let x1 = 0;
    let x2 = 0;
    let y1 = 0;
    let y2 = 0;
    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    let a1 = 0;
    let a2 = 0;
    for (let n = 0; n < canal.length; n += 1) {
      if (n % 64 === 0) {
        const w0 = (DOIS_PI * Math.min(corte(n / TAXA), TAXA * 0.45)) / TAXA;
        const alfa = Math.sin(w0) / (2 * ressonancia);
        const cosseno = Math.cos(w0);
        const a0 = 1 + alfa;
        const alta = tipo === 'ALTA';
        b0 = (alta ? 1 + cosseno : 1 - cosseno) / 2 / a0;
        b1 = (alta ? -(1 + cosseno) : 1 - cosseno) / a0;
        b2 = (alta ? 1 + cosseno : 1 - cosseno) / 2 / a0;
        a1 = (-2 * cosseno) / a0;
        a2 = (1 - alfa) / a0;
      }
      const x0 = canal[n] ?? 0;
      const y0 = b0 * x0 + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
      x2 = x1;
      x1 = x0;
      y2 = y1;
      y1 = y0;
      canal[n] = y0;
    }
  }
}

export function atrasoPingPong(faixa: Faixa, tempo: number, realimentacao: number, mistura: number): Faixa {
  const saida = new Faixa(faixa.amostras);
  const atraso = Math.floor(tempo * TAXA);
  const bufferEsquerdo = new Float32Array(atraso);
  const bufferDireito = new Float32Array(atraso);
  let indice = 0;
  for (let n = 0; n < faixa.amostras; n += 1) {
    const entrada = ((faixa.esquerda[n] ?? 0) + (faixa.direita[n] ?? 0)) / 2;
    const atrasadoEsquerdo = bufferEsquerdo[indice] ?? 0;
    const atrasadoDireito = bufferDireito[indice] ?? 0;
    bufferEsquerdo[indice] = entrada + atrasadoDireito * realimentacao;
    bufferDireito[indice] = atrasadoEsquerdo * realimentacao;
    saida.esquerda[n] = atrasadoEsquerdo * mistura;
    saida.direita[n] = atrasadoDireito * mistura;
    indice = (indice + 1) % atraso;
  }
  return saida;
}

class Pente {
  private readonly buffer: Float32Array;
  private readonly realimentacao: number;
  private readonly amortecimento: number;
  private indice = 0;
  private filtrado = 0;

  constructor(tamanho: number, realimentacao: number, amortecimento: number) {
    this.buffer = new Float32Array(tamanho);
    this.realimentacao = realimentacao;
    this.amortecimento = amortecimento;
  }

  processar(entrada: number): number {
    const saida = this.buffer[this.indice] ?? 0;
    this.filtrado = saida * (1 - this.amortecimento) + this.filtrado * this.amortecimento;
    this.buffer[this.indice] = entrada + this.filtrado * this.realimentacao;
    this.indice = (this.indice + 1) % this.buffer.length;
    return saida;
  }
}

class PassaTudo {
  private readonly buffer: Float32Array;
  private indice = 0;

  constructor(tamanho: number) {
    this.buffer = new Float32Array(tamanho);
  }

  processar(entrada: number): number {
    const atrasado = this.buffer[this.indice] ?? 0;
    this.buffer[this.indice] = entrada + atrasado * 0.5;
    this.indice = (this.indice + 1) % this.buffer.length;
    return atrasado - entrada;
  }
}

export function reverberar(faixa: Faixa, sala = 0.86, amortecimento = 0.35): Faixa {
  const escala = TAXA / 44100;
  const pentes = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617];
  const passaTudos = [556, 441, 341, 225];
  const realimentacao = sala * 0.28 + 0.7;
  const saida = new Faixa(faixa.amostras);
  [0, 23].forEach((espalhamento, canal) => {
    const filtrosPente = pentes.map((tamanho) => new Pente(Math.floor((tamanho + espalhamento) * escala), realimentacao, amortecimento));
    const filtrosPassaTudo = passaTudos.map((tamanho) => new PassaTudo(Math.floor((tamanho + espalhamento) * escala)));
    const destino = canal === 0 ? saida.esquerda : saida.direita;
    for (let n = 0; n < faixa.amostras; n += 1) {
      const entrada = (((faixa.esquerda[n] ?? 0) + (faixa.direita[n] ?? 0)) / 2) * 0.015;
      let amostra = 0;
      for (const pente of filtrosPente) amostra += pente.processar(entrada);
      for (const passaTudo of filtrosPassaTudo) amostra = passaTudo.processar(amostra);
      destino[n] = amostra;
    }
  });
  return saida;
}

export function medirRms(faixa: Faixa, inicio: number, fim: number): number {
  let soma = 0;
  let contagem = 0;
  for (let n = Math.floor(inicio * TAXA); n < Math.min(Math.floor(fim * TAXA), faixa.amostras); n += 1) {
    soma += ((faixa.esquerda[n] ?? 0) ** 2 + (faixa.direita[n] ?? 0) ** 2) / 2;
    contagem += 1;
  }
  return Math.sqrt(soma / Math.max(contagem, 1));
}

export function medirPico(faixa: Faixa): number {
  let pico = 0;
  for (let n = 0; n < faixa.amostras; n += 1) pico = Math.max(pico, Math.abs(faixa.esquerda[n] ?? 0), Math.abs(faixa.direita[n] ?? 0));
  return pico;
}

export function decibeis(valor: number): number {
  return 20 * Math.log10(Math.max(valor, 1e-9));
}

export function deDecibeis(valor: number): number {
  return 10 ** (valor / 20);
}

function limitar(valor: number, teto: number): number {
  const joelho = teto * 0.8;
  const absoluto = Math.abs(valor);
  if (absoluto <= joelho) return valor;
  const excesso = (absoluto - joelho) / (teto - joelho);
  return Math.sign(valor) * (joelho + (teto - joelho) * Math.tanh(excesso));
}

export function finalizar(faixa: Faixa, teto = 0.89, desvanecimentoFinal = 0): Buffer {
  for (let n = 0; n < faixa.amostras; n += 1) {
    faixa.esquerda[n] = limitar(faixa.esquerda[n] ?? 0, teto);
    faixa.direita[n] = limitar(faixa.direita[n] ?? 0, teto);
  }
  const ganho = 1;
  const amostrasDesvanecimento = Math.floor(desvanecimentoFinal * TAXA);
  const amostrasEntrada = Math.floor(0.01 * TAXA);
  const dados = Buffer.alloc(44 + faixa.amostras * 4);
  dados.write('RIFF', 0);
  dados.writeUInt32LE(36 + faixa.amostras * 4, 4);
  dados.write('WAVE', 8);
  dados.write('fmt ', 12);
  dados.writeUInt32LE(16, 16);
  dados.writeUInt16LE(1, 20);
  dados.writeUInt16LE(2, 22);
  dados.writeUInt32LE(TAXA, 24);
  dados.writeUInt32LE(TAXA * 4, 28);
  dados.writeUInt16LE(4, 32);
  dados.writeUInt16LE(16, 34);
  dados.write('data', 36);
  dados.writeUInt32LE(faixa.amostras * 4, 40);
  for (let n = 0; n < faixa.amostras; n += 1) {
    const restante = faixa.amostras - n;
    const desvanecimento = amostrasDesvanecimento > 0 ? Math.min(restante / amostrasDesvanecimento, 1) ** 2 : 1;
    const entrada = Math.min(n / amostrasEntrada, 1);
    const fator = ganho * desvanecimento * entrada;
    dados.writeInt16LE(Math.round(Math.max(-1, Math.min(1, (faixa.esquerda[n] ?? 0) * fator)) * 32767), 44 + n * 4);
    dados.writeInt16LE(Math.round(Math.max(-1, Math.min(1, (faixa.direita[n] ?? 0) * fator)) * 32767), 46 + n * 4);
  }
  return dados;
}
