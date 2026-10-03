export const cores = {
  fundo: '#0d0f12',
  superficie: '#15181c',
  superficieSuave: '#1c2025',
  superficieElevada: '#1a1e23',
  borda: '#262a31',
  bordaForte: '#373c45',
  bordaControle: '#646b77',
  texto: '#eaecef',
  textoSecundario: '#a6acb6',
  textoTerciario: '#8b919c',
  destaque: '#8faae6',
  destaqueForte: '#a9c0f0',
  destaqueSuave: '#18233b',
  destaqueContraste: '#0b1630',
  sucesso: '#4ade80',
  sucessoSuave: '#10301c',
  aviso: '#efb54c',
  avisoSuave: '#2f2413',
  erro: '#ff7666',
  erroSuave: '#37191a',
  info: '#79acff',
  infoSuave: '#16233d',
  neutroSuave: '#23272d',
  marcaFundo: '#2f5299',
  marcaTraco: '#ffffff',
  segmentoAtivo: '#2a2f36',
  cargaConcluida: '#27ad5d',
  cargaAFazer: '#5b8ef0',
  naoRealizada: '#7a808b',
  calor: ['#20242a', '#2d4b88', '#4768ad', '#6d8dd0', '#a9c0f0'],
  linhaOrbita: '#2c323b',
} as const;

export const prioridades = {
  BAIXA: { rotulo: 'Baixa', cor: '#a7afbf', suave: '#23262e' },
  MEDIA: { rotulo: 'Média', cor: '#52c7d4', suave: '#0f2b30' },
  ALTA: { rotulo: 'Alta', cor: '#ffa05c', suave: '#33210f' },
  URGENTE: { rotulo: 'Urgente', cor: '#ff7666', suave: '#37191a' },
} as const;

export type Prioridade = keyof typeof prioridades;

export const coresCategoria = {
  azul: { cor: '#7fb0ff', suave: '#172440' },
  verde: { cor: '#52d89c', suave: '#112d21' },
  amarelo: { cor: '#efc152', suave: '#2e2512' },
  laranja: { cor: '#ffa05c', suave: '#33210f' },
  rosa: { cor: '#ff88c6', suave: '#361a2a' },
  roxo: { cor: '#b9a7ff', suave: '#251f42' },
} as const;

export type CorCategoria = keyof typeof coresCategoria;

export const fontes = {
  texto: "'Geist', system-ui, sans-serif",
  mono: "'Geist Mono', ui-monospace, monospace",
} as const;
