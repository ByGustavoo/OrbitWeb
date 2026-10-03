export const QUADROS_POR_SEGUNDO = 30;
export const LARGURA = 1920;
export const ALTURA = 1080;
export const QUADROS_POR_BATIDA = 12;
export const SOBREPOSICAO = 12;

const inicios = {
  abertura: 0,
  gancho: 72,
  tarefas: 192,
  calendario: 336,
  cronometro: 480,
  progresso: 624,
  revisao: 768,
  confianca: 912,
  encerramento: 1032,
} as const;

export const DURACAO_TOTAL = 1152;

export type NomeCena = keyof typeof inicios;

const ordem = Object.keys(inicios) as NomeCena[];

export const cenas = Object.fromEntries(
  ordem.map((nome, indice) => {
    const proxima = ordem[indice + 1];
    const fim = proxima ? inicios[proxima] + SOBREPOSICAO : DURACAO_TOTAL;
    return [nome, { inicio: inicios[nome], duracao: fim - inicios[nome] }];
  }),
) as Record<NomeCena, { inicio: number; duracao: number }>;

export const ordemCenas = ordem;

export const abertura = {
  orbitasFundo: 0,
  marca: 6,
  tracoOrbita: 12,
  nucleo: 16,
  satelite: 24,
  brilho: 44,
  nome: 44,
  intervaloLetras: 3,
  legenda: 58,
} as const;

export const SAUDACAO = 'Bom dia! Faltam 6 tarefas para hoje e 2 atrasadas de dias anteriores.';

export const gancho = {
  titulo: 4,
  cartao: 16,
  saudacao: 22,
  indicadores: [36, 40, 44, 48, 52],
  duracaoContagem: 20,
} as const;

export const tarefas = {
  titulo: 6,
  cartao: 10,
  linhas: 16,
  intervaloLinhas: 3,
  cliqueMover: 48,
  movimento: 50,
  aviso: 60,
  cliqueConcluir: 96,
} as const;

export const calendario = {
  titulo: 6,
  cartao: 8,
  marcadores: 16,
  intervaloMarcadores: 0.9,
  cliqueDia: 60,
  agenda: 62,
  linhasAgenda: [70, 76, 82],
} as const;

export const cronometro = {
  titulo: 6,
  cartao: 10,
  cliquePomodoro: 24,
  cliqueAtividade: 36,
  cliqueIniciar: 60,
  segundoInicial: 25 * 60,
} as const;

export const progresso = {
  titulo: 6,
  cartao: 10,
  metas: [18, 24, 30],
  duracaoMeta: 26,
  mapa: 36,
  intervaloSemanas: 1,
  estatisticas: [72, 76, 80, 84],
} as const;

export const revisao = {
  titulo: 6,
  cartao: 10,
  indicadores: [16, 21, 26, 31],
  duracaoContagem: 22,
  barra: 48,
  duracaoBarra: 30,
  destaques: [84, 90, 96],
} as const;

export const confianca = {
  titulo: 4,
  selos: [20, 25, 30, 35, 40],
  rodape: 56,
} as const;

export const encerramento = {
  marca: 12,
  nome: 20,
  slogan: 30,
  fechoSlogan: 48,
} as const;

export function quadroSegundoCronometro(indice: number): number {
  return cronometro.cliqueIniciar + indice * QUADROS_POR_SEGUNDO;
}
