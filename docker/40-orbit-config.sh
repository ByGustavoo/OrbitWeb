#!/bin/sh
set -eu

escapar() {
  printf '%s' "$1" | sed -e 's/[\\"]/\\&/g'
}

url_api=$(escapar "${ORBIT_API_URL:-}")
versao=$(escapar "${ORBIT_VERSION:-}")
data_lancamento=$(escapar "${ORBIT_RELEASE_DATE:-}")

printf 'window.__ORBIT_CONFIG__ = { urlApi: "%s", versao: "%s", dataLancamento: "%s" };\n' \
  "$url_api" "$versao" "$data_lancamento" \
  > /usr/share/nginx/html/config.js

echo "Orbit: config.js gerado (versão ${ORBIT_VERSION:-sem versão}, API ${ORBIT_API_URL:-padrão do build})"
