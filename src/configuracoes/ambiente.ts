const configuracaoExecucao = typeof window === 'undefined' ? undefined : window.__ORBIT_CONFIG__;

export const ambiente = {
  fonteDados: import.meta.env.VITE_FONTE_DADOS === 'api' ? 'api' : 'simulada',
  urlApi: configuracaoExecucao?.urlApi || import.meta.env.VITE_URL_API || 'http://localhost:8080/api',
  versao: configuracaoExecucao?.versao || null,
  desenvolvimento: import.meta.env.DEV,
} as const;
