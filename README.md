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

* ⚛️ React 18

* 🔷 TypeScript 5

* 🖼️ Lucide React

* 🎨 CSS Modules

* 🧭 React Router 6

* 🔤 Geist e Geist Mono (Fontsource, servidas pelo próprio app)


<br>


## 📌 Status do Projeto

O projeto está na **Fase 03 — Design System e Estrutura Visual**, concluída. Já existem a base visual
completa, o layout (menu lateral, cabeçalho e conteúdo), a tela de boas-vindas, os temas claro e
escuro, os componentes reutilizáveis e a navegação entre todas as páginas. As telas de domínio
(Dashboard, Calendário, Tarefas, Estudos, Histórico, Revisão semanal e Configurações) ainda são
provisórias e serão construídas nas próximas fases, a começar pela **Fase 04 — Dashboard**.

Os requisitos do produto estão em [`REQUISITOS.md`](REQUISITOS.md) e as decisões técnicas em
[`ARQUITETURA.md`](ARQUITETURA.md). Os dois são a fonte de verdade: uma mudança de regra passa por
eles antes de chegar ao código.


<br>


## ✨ Funcionalidades

<br>

🔹 **Prontas**
* Tela de boas-vindas com a frase de efeito, exibida ao abrir o Orbit numa nova aba ou janela, com saída em cascata e o logo viajando até o menu lateral.
* Menu lateral com seções Planejamento, Estudos e Acompanhamento, modo recolhido persistido e gaveta abaixo de 1100px.
* Cabeçalho com a data de hoje e troca de tema animada.
* Tema claro, escuro e sistema, com transição suave de cores e sem flash de tema errado ao abrir.
* Design system completo: botões, campos de texto, número, busca, data, horário e seleção próprios (nenhum seletor nativo do navegador), caixas de seleção, opções, interruptor, grupo segmentado, selos de prioridade, situação, prazo e categoria, cartões, modal, diálogo de confirmação e notificações com ação de desfazer.
* Estados de carregamento (esqueleto contínuo), vazio e erro com "Tentar novamente".
* Catálogo de todos os componentes e estados em `/componentes`, só no ambiente de desenvolvimento.

🔹 **Planejadas** (definidas em `REQUISITOS.md`)
* **Dashboard**: tarefas de hoje, concluídas, pendentes, atrasadas e urgentes, gráficos, mapa de calor de estudo, sequência de dias, metas da semana e eventos recentes.
* **Calendário**: grade do mês, agenda do dia, navegação por mês e ano e criação de tarefa na data escolhida.
* **Tarefas**: título, descrição, data opcional, horário de início e fim, prioridade, situação, categoria com cor, recorrência (diária, dias da semana, semanal, mensal e anual) e reagendamento de atrasadas em lote.
* **Estudos**: cronômetro livre e Pomodoro que continua ao trocar de tela, atividades com meta semanal, sessões manuais e histórico.
* **Revisão semanal**, **paleta de comandos** (`Ctrl+K`) e **lembretes** dentro do app.


<br>


## ⚙️ Como Executar

Requer Node.js 18 ou superior.

<br>

🔹 Instalação
```bash
# Instala as dependências do projeto
$ npm install
```

🔹 Ambiente
```bash
# Cria o arquivo de variáveis a partir do exemplo
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
# Checagem de tipos e build de produção
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

<br>

> O `typecheck` usa `tsc -b`, e não `tsc --noEmit`. O `tsconfig.json` da raiz é uma solução com
> `references` e `files: []`: com `--noEmit`, a checagem não olharia arquivo nenhum e passaria
> sempre. Como o `tsconfig.app.json` já tem `noEmit: true`, o `-b` checa sem gerar saída.


<br>


## 🔐 Variáveis de Ambiente

Todas as variáveis ficam no arquivo `.env`, criado a partir do `.env.example`. **Nenhum outro
arquivo lê `import.meta.env` diretamente**: isso acontece apenas em `src/configuracoes/ambiente.ts`,
e o resto do código consome o objeto `ambiente` exportado de lá.

O `.env` está no `.gitignore`; só o `.env.example` é versionado, e ele não contém segredo nenhum.

<br>

```bash
# Origem dos dados: "simulada" (sem backend) ou "api" (Spring Boot rodando)
VITE_FONTE_DADOS=simulada

# Endereço da API REST do Spring Boot, usado quando VITE_FONTE_DADOS=api
VITE_URL_API=http://localhost:8080/api
```

<br>

Em produção, `window.__ORBIT_CONFIG__.urlApi` (gravado em `public/config.js`) tem prioridade sobre o
`VITE_URL_API`, para que a mesma imagem sirva qualquer ambiente — o mesmo modelo do PrismaWeb.


<br>


## 📂 Estrutura do Projeto

<br>

```bash
src/
├── componentes/
│   ├── ui/          Botao, BotaoIcone, CampoTexto, CampoNumero, CampoBusca, AreaTexto,
│   │                CampoSelecao, SeletorData, SeletorHorario, CaixaSelecao, GrupoRadio,
│   │                Interruptor, GrupoOpcoes, Selo, Painel, Modal, DialogoConfirmacao,
│   │                Flutuante, Notificacao, Esqueleto, IndicadorGiratorio, EstadoVazio,
│   │                EstadoErro
│   ├── layout/      MenuLateral, Cabecalho, CabecalhoPagina, BotaoTema
│   ├── boasVindas/  TelaBoasVindas e a transição para a aplicação
│   ├── tarefas/     selos de prioridade, situação, prazo e categoria
│   └── comum/       MarcaOrbit
├── configuracoes/   ambiente, aplicacao, navegacao
├── estilos/         tokens.css (escala), temas.css (cores por tema), global.css
├── ganchos/         useArmazenamentoLocal, useConsultaMidia, useTravarRolagem,
│                    useTituloDocumento
├── layouts/         LayoutAplicacao (casca: menu lateral + cabeçalho + conteúdo)
├── modelos/         enumeracoes, rotulos, cores (contratos de domínio)
├── paginas/         páginas provisórias, PaginaComponentes, PaginaNaoEncontrada
├── provedores/      ProvedorTema, ProvedorNotificacoes, ProvedoresAplicacao
├── rotas/           RotasAplicacao, caminhos (única fonte de rotas)
└── utilitarios/     datas, foco, juntarClasses
```

<br>

As pastas `api/`, `servicos/`, `regras/` e `dados/simulacao/` entram a partir da Fase 04, conforme a
estrutura completa descrita no `ARQUITETURA.md`.


<br>


## 🔄 Camada de Dados

Os componentes nunca falam com `fetch`. Eles chamam serviços, cada serviço é uma camada fina sobre o
`clienteHttp`, e o `clienteHttp` entrega a requisição a um **transporte**: o `fetch` real ou o
simulador, escolhido por `VITE_FONTE_DADOS`.

<br>

```text
Página → Componente → Serviço → clienteHttp → transporteFetch    → Spring Boot
                                            ↘ transporteSimulado → dados/simulacao
```

<br>

* 🧪 **Dados simulados isolados.** Eles respondem às mesmas rotas e formatos da API e ficam só em
  `dados/simulacao/`. Trocar para o backend real é mudar `VITE_FONTE_DADOS` para `api`, sem tocar em
  nenhuma tela.
* 🧮 **O que é cálculo, é do servidor.** Prazo (atrasada, não realizada), ocorrências de tarefas
  recorrentes, sequência de dias e progresso de metas vêm calculados pela API.
* ⏳ **Carregamento, erro e cancelamento** passam por um gancho único, que usa o `AbortSignal` para
  descartar respostas de uma tela que já foi deixada.


<br>


## 🔌 Integração com a API

O contrato previsto está na seção 8 do `ARQUITETURA.md`. Ele é escrito em português: rota em
kebab-case sem acento (`/tarefas/resumo-calendario`), campo e query param em camelCase sem acento
(`dataConclusao`, `dataInicial`) e valor de enum em maiúsculas (`EM_ANDAMENTO`, `URGENTE`).

* 🕒 Datas como `LocalDate` (`"2026-09-22"`), horários como `LocalTime` (`"19:00"`) e instantes como
  `OffsetDateTime`.
* 🌎 O frontend envia `X-Fuso-Horario` com o fuso do navegador, para o backend decidir o que é "hoje"
  e "atrasada".
* 📄 Paginação em `{ itens, pagina, tamanho, totalItens, totalPaginas }` e erros no `ProblemDetail` do
  Spring, com a lista de campos inválidos.
* 🔁 Tarefas recorrentes guardadas como ocorrências reais no banco, ligadas por `serieId`.

O backend precisa liberar **CORS** para a origem do dev server (`http://localhost:5173`).


<br>


## 🌗 Tema Claro e Escuro

* 🎨 Cores em `src/estilos/temas.css`, sob `[data-tema='claro']` e `[data-tema='escuro']`. Nenhum componente declara cor em hex.

* ⚡ Um script inline no `index.html` aplica o tema salvo antes do React montar, evitando o flash de tema errado.

* 🔀 Três modos: claro, escuro e sistema (acompanha o dispositivo). O botão do cabeçalho alterna entre claro e escuro, com os ícones de sol e lua trocando em mola e as cores da página em transição suave.

* 🔵 Destaque em azul-marinho (`#1f3b73` no claro, `#8faae6` no escuro): sóbrio, para não competir com o conteúdo.

* ♿ Contraste é requisito, não acabamento: todo texto passa de 4.5:1 e toda borda de controle de 3:1, nos dois temas.


<br>


## 📱 Responsividade

* 🖥️ **Desktop**: menu lateral fixo, com modo recolhido (72px) persistido em `localStorage`.

* 📲 **Abaixo de 1100px**: o menu vira gaveta com véu, prende o foco, fecha ao navegar e no Esc, e trava a rolagem do fundo.

* 🪟 **Abaixo de 600px**: modais viram folhas que sobem da base da tela.

* 👆 Alvos de toque e texto de campo crescem em `@media (pointer: coarse)`: 44px de alvo e 16px de texto, o mínimo que evita o zoom automático do Safari no iOS.

* 🎬 `prefers-reduced-motion` respeitado globalmente.


<br>


## 🗺️ Próximas Etapas

* 📊 **Fase 04 — Dashboard**, seguida de Calendário, Tarefas, Estudos e Revisão semanal.

* 🧪 Camada de serviços, dados simulados e Vitest para as regras de negócio.

* ☕ OrbitAPI em Java / Spring Boot, e depois Docker e esteira de publicação no mesmo modelo do PrismaWeb.

* 🔐 Login e múltiplos usuários, previstos para o futuro: a arquitetura já concentra as requisições num ponto único para receber o token.


<br> 
 
## 🖥️ Desenvolvedor

### 🔵 LinkedIn: [Gustavo Correa](https://www.linkedin.com/in/gustavo-chauar-correa-946168269/)
