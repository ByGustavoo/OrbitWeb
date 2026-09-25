<div align="center"> <br> 
  <img align="center" alt="orbit-react" height="150" width="150" src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg" />
</div> 

<br> 

<div align="center">
  <strong>Orbit</strong> é o frontend de uma aplicação de produtividade pessoal: <em>organize o que move o seu dia</em>. Reúne tarefas, agenda, calendário, prioridades, cronômetro de estudos e histórico de tempo em uma única interface, com dashboard do dia, tarefas recorrentes, metas semanais de estudo, mapa de calor, sequência de dias e revisão semanal. O backend será o OrbitAPI, em Java / Spring Boot; até lá, o frontend roda com dados simulados que respondem às mesmas rotas e formatos da API.
</div> 

 <br> <br>

## 🚀 Ferramentas Utilizadas

* ⚡ Vite 5

* 🧪 Vitest
  
* 📊 Recharts
  
* ⚛️ React 18

* 🖼️ Lucide React
  
* 🎨 HTML e CSS
  
* 🔷 TypeScript 5

* 🧭 React Router 6

* 🔤 Geist e Geist Mono

<br>

## 🎯 Objetivo

Ajudar uma pessoa a planejar o dia e acompanhar o próprio ritmo: o que precisa ser feito, quando,
com que prioridade, quanto tempo foi dedicado a estudar e como foi a semana. Uso individual, sem
login, na primeira versão.

<br>

> A proposta inicial previa JavaScript puro; o projeto adotou React + TypeScript (decisão D1), o
> mesmo do PrismaWeb, para os dois evoluírem do mesmo jeito.


<br>


## 📌 Status do Projeto

**Fase 10 — Integração, contrato da API e documentação final: concluída.** O front-end está
completo e preparado para o OrbitAPI:

* camada de dados centralizada nos serviços, com os dados simulados isolados em `src/dados/simulacao/`;
* tratamento de erros único, que consome o `ErrorResponseDTO` da API;
* contrato de todos os endpoints, guia do backend, regras de negócio e arquitetura documentados em [`docs/`](docs/).

As decisões ainda abertas estão na seção **Pendências**, no fim deste arquivo.


<br>


## ✨ Funcionalidades

<br>

* **Dashboard**: saudação com o que falta hoje; resumo da semana (concluídas, pendentes, atrasadas, urgentes e sequência de dias); tarefas de hoje com conclusão e "Desfazer"; atrasadas de dias anteriores com "Mover todas para hoje"; próximas atividades com a carga de tarefas da semana; tarefas em aberto por prioridade; produtividade (tarefas concluídas e tempo de estudo por dia, em 7 ou 30 dias); atividade recente; mapa de calor de estudo dos últimos 6 meses; metas da semana.
  
* **Calendário**: grade do mês com hoje e dia selecionado bem distintos, marcadores de carga (a fazer, atrasada, concluída, não realizada) e sinais de atraso e prioridade; navegação por mês, seletor de mês e ano, botão "Hoje" e teclado completo; agenda do dia ao lado no desktop e abaixo da grade no tablet e no celular, com as sessões de estudo do dia.
  
* **Tarefas**: visões Todas, Sem data e Atrasadas; busca, filtros de situação, prioridade e categoria, ordenação, agrupamento por dia e paginação; "Mover todas para hoje".
  
* **Gerenciamento de tarefas**: formulário com validação em português, recorrência (diária, dias da semana, semanal, mensal e anual, com término), escolha "só esta / esta e as próximas", detalhes, troca de situação, conclusão com "Desfazer", exclusão com confirmação e lembretes dentro do app.
  
* **Estudos**: atividades com cor e meta semanal, arquivamento, sessões manuais editáveis, histórico recente e métricas da semana.
  
* **Cronômetro**: modo livre e Pomodoro, que continua ao trocar de tela ou recarregar, mini cronômetro no cabeçalho, tempo no título da aba e início de estudo a partir de uma tarefa.
  
* **Histórico**: linha do tempo agrupada por dia com tarefas criadas, concluídas, canceladas, reabertas e não realizadas, prioridade e data alteradas e sessões de estudo; filtros Tudo, Tarefas e Estudos, período e busca; detalhes de cada registro.
  
* **Revisão semanal**: resumo comparado à semana anterior, destaques e pontos de atenção, tarefas concluídas e tempo de estudo por dia, estudos e metas por atividade, situação das tarefas planejadas, o que continua em aberto, próxima semana e nota da semana.
  
* **Configurações**: tema (claro, escuro ou automático), durações do Pomodoro com início automático da pausa e som ao fim de cada fase, e cadastro de categorias com a quantidade de tarefas de cada uma.
  
* Tema claro, escuro e sistema; menu lateral recolhível que vira gaveta abaixo de 1100px; tela de boas-vindas; design system próprio com catálogo em `/componentes` (só em desenvolvimento).
  
* Estados de carregamento, vazio, sem resultados e erro em todas as regiões de dados.

<br>

🔹 **Planejadas** (fora desta versão)
* **Paleta de comandos** (`Ctrl+K`).


<br>


## ⚙️ Como Executar

Requer Node.js 18 ou superior.

<br>

🔹 Instalação
```bash
# Instala as dependências do projeto
$ npm install
```

🔹 Ambiente (opcional)
```bash
# Cria o arquivo de variáveis a partir do exemplo; sem ele, o app usa os dados simulados
$ cp .env.example .env
```

🔹 Execução
```bash
# Sobe o servidor de desenvolvimento em http://localhost:5173
$ npm run dev
```


<br>


## 📜 Scripts Disponíveis

<br>

🔹 dev
```bash
# Servidor de desenvolvimento com HMR
$ npm run dev
```

🔹 build
```bash
# Checagem de tipos e build de produção em dist/
$ npm run build
```

🔹 preview
```bash
# Serve o build de produção localmente
$ npm run preview
```

🔹 typecheck
```bash
# Apenas a checagem de tipos
$ npm run typecheck
```

🔹 test
```bash
# Testes das regras de negócio e do tratamento de erros da API
$ npm run test
```

<br>

> O `typecheck` usa `tsc -b`, e não `tsc --noEmit`. O `tsconfig.json` da raiz é uma solução com
> `references` e `files: []`: com `--noEmit`, a checagem não olharia arquivo nenhum e passaria
> sempre. Como o `tsconfig.app.json` já tem `noEmit: true`, o `-b` checa sem gerar saída.


<br>


## 📦 Build

`npm run build` roda a checagem de tipos (`tsc -b`) e gera o build do Vite em `dist/`, com o
React, o roteador e o Recharts em pacotes separados e cada página carregada sob demanda.

* As variáveis `VITE_*` são fixadas no momento do build.
* Com `VITE_FONTE_DADOS=api`, o simulador não entra no pacote.
* O catálogo `/componentes` não é gerado no build de produção.
* O servidor que publicar o `dist/` precisa devolver o `index.html` para qualquer caminho (as
  rotas são do lado do cliente).


<br>


## 🔐 Variáveis de Ambiente

Todas as variáveis ficam no arquivo `.env`, criado a partir do `.env.example`. Nenhum outro arquivo
lê `import.meta.env`: isso acontece apenas em `src/configuracoes/ambiente.ts`.

O `.env` está no `.gitignore`; só o `.env.example` é versionado, e ele não contém segredo nenhum.

<br>

| Variável | Finalidade | Valores | Padrão |
|---|---|---|---|
| `VITE_FONTE_DADOS` | Origem dos dados | `simulada` ou `api` | `simulada` |
| `VITE_URL_API` | URL base da API REST | URL completa | `http://localhost:8080/api` |

<br>

```bash
# Origem dos dados: "simulada" (sem backend) ou "api" (Spring Boot rodando)
VITE_FONTE_DADOS=simulada

# Endereço da API REST do Spring Boot, usado quando VITE_FONTE_DADOS=api
VITE_URL_API=http://localhost:8080/api
```

<br>

* **Desenvolvimento:** sem `.env`, os dados são simulados. Com o backend rodando, use
  `VITE_FONTE_DADOS=api` e a URL local da API.
* **Produção:** `window.__ORBIT_CONFIG__.urlApi`, definido em `public/config.js`, tem prioridade
  sobre `VITE_URL_API`, para que o mesmo build sirva qualquer ambiente — o mesmo modelo do
  PrismaWeb.


<br>


## 📂 Estrutura do Projeto

<br>

```bash
docs/                  documentação (arquitetura, contrato da API, backend, regras, histórico)
public/                config.js (configuração em tempo de execução) e ícone
src/
├── api/               clienteHttp, ErroApi, tratamentoErros, rotasApi (única fonte de URLs), transportes
├── componentes/
│   ├── ui/            design system: botões, campos, seleção, selos, painéis, modal, notificações, estados
│   ├── layout/        MenuLateral, Cabecalho, CabecalhoPagina, BotaoTema, MiniCronometro
│   ├── dashboard/     indicadores, tarefas de hoje, próximas atividades, prioridades,
│   │                  produtividade, atividade recente, mapa de calor
│   ├── calendario/    NavegacaoCalendario, GradeMes, CelulaDia, AgendaDia
│   ├── tarefas/       ItemTarefa, ListaTarefas, FormularioTarefa, recorrência, detalhes, filtros
│   ├── estudos/       Cronometro, atividades, sessões, métricas, metas
│   ├── historico/     filtros, linha do tempo, detalhes do registro
│   ├── revisao/       navegação, resumo, fatos, gráficos, estudos, tarefas, próxima semana, nota
│   ├── configuracoes/ seções Aparência, Pomodoro e Categorias, formulário de categoria
│   ├── graficos/      GraficoBarras (Recharts)
│   ├── boasVindas/    tela de boas-vindas
│   └── comum/         MarcaOrbit
├── configuracoes/     ambiente, aplicacao, navegacao
├── dados/simulacao/   simulador da API: banco no localStorage, sementes e manipuladores
├── estilos/           tokens.css (escala), temas.css (cores por tema), global.css
├── ganchos/           useDadosAssincronos, useParametrosPagina e outros
├── layouts/           LayoutAplicacao
├── modelos/           DTOs, enumerações, rótulos e cores
├── paginas/           uma página por rota
├── provedores/        tema, notificações, alterações, ações de tarefa, cronômetro, lembretes
├── regras/            regras de negócio puras, com testes
├── rotas/             caminhos e tabela de rotas
├── servicos/          servicoTarefas, servicoCategorias, servicoAtividades, servicoSessoes,
│                      servicoHistorico, servicoRevisaoSemanal, servicoDashboard
└── utilitarios/       datas, formatação, foco
```

Detalhes em [`docs/arquitetura.md`](docs/arquitetura.md).


<br>


## 🔄 Camada de Dados

Os componentes nunca falam com `fetch`. Eles chamam serviços, cada serviço é uma camada fina sobre o
`clienteHttp`, e o `clienteHttp` entrega a requisição a um **transporte**: o `fetch` real ou o
simulador, escolhido por `VITE_FONTE_DADOS`.

<br>

```text
Página → Componente → Serviço → clienteHttp → transporteFetch    → OrbitAPI (Spring Boot)
                                            ↘ transporteSimulado → dados/simulacao
```

<br>

* 🧪 **Dados simulados isolados.** Respondem às mesmas rotas, formatos e erros da API e ficam só em
  `src/dados/simulacao/`. Trocar para o backend real é mudar `VITE_FONTE_DADOS` para `api`, sem
  tocar em nenhuma tela.
* 🧮 **O que é cálculo, é do servidor.** Prazo (atrasada, não realizada), ocorrências de tarefas
  recorrentes, sequência de dias, metas e resumos vêm calculados pela API.
* ⏳ **Carregamento, erro e cancelamento** passam por um gancho único, que usa o `AbortSignal` para
  descartar respostas de uma tela que já foi deixada.
* 🧯 **Erros tratados num ponto só**: o `clienteHttp` lê o `ErrorResponseDTO` da API e as telas usam
  `src/api/tratamentoErros.ts` para decidir o que mostrar.


<br>


## 🔌 Integração com a API

<br>

🔹 Configurar a URL
```bash
# .env
VITE_FONTE_DADOS=api
VITE_URL_API=http://localhost:8080/api
```

<br>

* 📄 **Contrato completo** em [`docs/api-contrato.md`](docs/api-contrato.md): 27 endpoints, com
  parâmetros, corpos, respostas, códigos HTTP e erros.
* ☕ **Guia do backend** em [`docs/backend.md`](docs/backend.md): entidades, DTOs, enums, validações e
  fluxos para o Spring Boot.
* 🧾 **Regras de negócio** em [`docs/regras-negocio.md`](docs/regras-negocio.md).
* 🕒 Datas como `"2026-09-24"`, horários como `"19:00"` e instantes em ISO 8601 com fuso.
* 🌎 O frontend envia `X-Fuso-Horario` com o fuso do navegador, para o backend decidir o que é "hoje"
  e "atrasada". O backend precisa liberar esse cabeçalho no **CORS**, para a origem do dev server
  (`http://localhost:5173`).
* 📑 Paginação em `{ itens, pagina, tamanho, totalItens, totalPaginas }`, com `pagina` começando em 0.
* ⚠️ Erros no `ErrorResponseDTO` (`status`, `title`, `instance`, `type`, `detail` e, opcionalmente,
  `errors` com os campos inválidos).

<br>

🔹 Controles do simulador (só em desenvolvimento, no console do navegador)
```js
orbitSimulacao.restaurar()                 // gera de novo os dados de exemplo
orbitSimulacao.esvaziar()                  // apaga tudo, para ver os estados vazios
orbitSimulacao.falhar('/tarefas')          // rotas que começam assim respondem 503 ('*' = todas, false = desliga)
orbitSimulacao.latencia(8000)              // latência fixa, para ver os esqueletos (false = 200–500ms)
```


<br>


## 🌗 Tema Claro e Escuro

* 🎨 Cores em `src/estilos/temas.css`, sob `[data-tema='claro']` e `[data-tema='escuro']`. Nenhum componente declara cor em hex.

* ⚡ Um script inline no `index.html` aplica o tema salvo antes do React montar, evitando o flash de tema errado.

* 🔀 Três modos: claro, escuro e sistema (acompanha o dispositivo). O botão do cabeçalho alterna entre claro e escuro, com a página esmaecendo de um tema para o outro em 600ms.

* ♿ Contraste é requisito, não acabamento: todo texto passa de 4.5:1 e toda borda de controle de 3:1, nos dois temas.


<br>


## 📱 Responsividade

* 🖥️ **Desktop**: menu lateral fixo, com modo recolhido persistido em `localStorage`.

* 📲 **Abaixo de 1100px**: o menu vira gaveta com véu, prende o foco, fecha ao navegar e no Esc, e trava a rolagem do fundo.

* 🪟 **Abaixo de 600px**: modais viram folhas que sobem da base da tela.

* 📐 Dashboard, Calendário e Revisão semanal respondem à largura real do conteúdo (*container queries*), com ou sem menu lateral.

* 👆 Alvos de toque de 44px e texto de campo de 16px em telas de toque, o mínimo que evita o zoom automático do Safari no iOS.

* 🎬 `prefers-reduced-motion` respeitado globalmente.


<br>


## 📚 Documentação

| Documento | Conteúdo |
|---|---|
| [`docs/arquitetura.md`](docs/arquitetura.md) | Camadas, pastas, serviços, fluxo de dados, erros, estados, mocks, tema e responsividade |
| [`docs/api-contrato.md`](docs/api-contrato.md) | Contrato de todos os endpoints |
| [`docs/backend.md`](docs/backend.md) | Guia de implementação do OrbitAPI |
| [`docs/regras-negocio.md`](docs/regras-negocio.md) | Regras funcionais, com exemplos |
| [`docs/historico-fases.md`](docs/historico-fases.md) | Registro das decisões das fases 02 a 10 |


<br>


## 🗺️ Pendências

* ☕ **OrbitAPI** em Java / Spring Boot, seguindo [`docs/backend.md`](docs/backend.md). URL base, banco e os valores de `type`/`title` dos erros estão marcados como **A DEFINIR NO BACKEND**.

* 🧭 **Duas decisões de produto**: a regra de "não realizada" ao mover uma recorrente para hoje, e a contagem de ocorrências futuras em "Em aberto por prioridade" ([`docs/regras-negocio.md`](docs/regras-negocio.md#12-decisões-pendentes)).

* ⌨️ **Paleta de comandos**, planejada para uma fase futura.

* 🔐 Login e múltiplos usuários, previstos para o futuro: todas as requisições já passam por um ponto único para receber o token.


<br> 
 
## 🖥️ Desenvolvedor

### 🔵 LinkedIn: [Gustavo Correa](https://www.linkedin.com/in/gustavo-chauar-correa-946168269/)
