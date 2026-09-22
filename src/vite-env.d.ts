/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FONTE_DADOS?: 'simulada' | 'api';
  readonly VITE_URL_API?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface ConfiguracaoExecucaoOrbit {
  readonly urlApi?: string;
  readonly versao?: string;
}

interface Window {
  __ORBIT_CONFIG__?: ConfiguracaoExecucaoOrbit;
}

declare module '*.module.css' {
  const classes: Record<string, string>;
  export default classes;
}
