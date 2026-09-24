import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

type ParametrosGuardados = Record<string, string>;

interface EstadoComParametros {
  parametros?: ParametrosGuardados;
}

type ProximosParametros = URLSearchParams | ((atuais: URLSearchParams) => URLSearchParams);

function lerParametros(estado: unknown): ParametrosGuardados {
  const parametros = (estado as EstadoComParametros | null)?.parametros;
  return parametros && typeof parametros === 'object' ? parametros : {};
}

export function estadoComParametros(parametros: ParametrosGuardados): EstadoComParametros {
  return { parametros };
}

export function useParametrosPagina() {
  const localizacao = useLocation();
  const navegar = useNavigate();
  const guardados = lerParametros(localizacao.state);
  const chave = JSON.stringify(guardados);
  const parametros = useMemo(() => new URLSearchParams(guardados), [chave]);
  const parametrosRef = useRef(parametros);
  parametrosRef.current = parametros;

  useEffect(() => {
    if (!localizacao.search) return;
    const daUrl = Object.fromEntries(new URLSearchParams(localizacao.search));
    navegar(
      { pathname: localizacao.pathname, search: '', hash: localizacao.hash },
      { replace: true, state: estadoComParametros({ ...lerParametros(localizacao.state), ...daUrl }) },
    );
  }, [localizacao.search, localizacao.pathname, localizacao.hash, localizacao.state, navegar]);

  const definirParametros = useCallback(
    (proximos: ProximosParametros, opcoes: { replace?: boolean } = {}) => {
      const resolvidos = typeof proximos === 'function' ? proximos(new URLSearchParams(parametrosRef.current)) : proximos;
      parametrosRef.current = resolvidos;
      navegar(
        { pathname: localizacao.pathname, search: '', hash: localizacao.hash },
        { replace: opcoes.replace ?? false, state: estadoComParametros(Object.fromEntries(resolvidos)) },
      );
    },
    [localizacao.pathname, localizacao.hash, navegar],
  );

  return [parametros, definirParametros] as const;
}
