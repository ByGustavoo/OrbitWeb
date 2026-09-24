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

* 📊 Recharts

* 🔷 TypeScript 5

* 🖼️ Lucide React

* 🎨 CSS Modules

* 🧭 React Router 6

* 🔤 Geist e Geist Mono (Fontsource, servidas pelo próprio app)

* 🧪 Vitest (regras de negócio)


<br>


## 📌 Status do Projeto

O projeto está na **Fase 09 — Auditoria geral, integração e QA**, concluída. A aplicação foi usada
no navegador de ponta a ponta, nos dois temas e de 360 a 1920px, e os problemas encontrados foram
corrigidos: atrasadas de hoje duplicadas no Dashboard, "Mover todas para hoje" contando tarefas que
não mudavam de data, listas da Revisão semanal espremidas no celular, cabeçalho do calendário em
telas estreitas, horário da sessão diferente entre Dashboard e Histórico, entre outros. O relatório
e as duas decisões que ficaram para o dono do produto estão na seção 21 do `ARQUITETURA.md`. As
Configurações ainda são provisórias; a **Fase 10** aguarda autorização.

Os requisitos do produto estão em [`REQUISITOS.md`](REQUISITOS.md) e as decisões técnicas em
[`ARQUITETURA.md`](ARQUITETURA.md). Os dois são a fonte de verdade: uma mudança de regra passa por
eles antes de chegar ao código.


<br>


## ✨ Funcionalidades

<br>

🔹 **Prontas**
* **Calendário**: grade do mês com hoje e dia selecionado bem distintos, marcadores de carga (a fazer, atrasada, concluída, não realizada) e sinais de atraso e prioridade; navegação por mês, seletor de mês e ano, botão "Hoje" e teclado completo (setas, Page Up/Down, Shift para ano); agenda do dia ao lado no desktop e abaixo da grade no tablet e no celular.
* **Tarefas**: visões Todas, Sem data e Atrasadas; busca, filtros de situação, prioridade e categoria, ordenação, agrupamento por dia e paginação; filtros e mês guardados no histórico do navegador, com a barra de endereços limpa; "Mover todas para hoje".
* **Gerenciamento de tarefas**: formulário com validação em português, recorrência (diária, dias da semana, semanal, mensal e anual, com término), escolha "só esta / esta e as próximas", detalhes, troca de situação, conclusão com "Desfazer", exclusão com confirmação e lembretes dentro do app. Tudo reflete no Dashboard sem recarregar.
* **Revisão semanal**: navegação entre semanas até a atual, com "Esta semana"; resumo (concluídas, criadas, atrasadas, taxa de conclusão, tempo de estudo, sessões e dias com atividade) comparado à semana anterior em tom neutro; destaques e pontos de atenção factuais; tarefas concluídas e tempo de estudo por dia; estudo por atividade e metas; situação das tarefas planejadas e o que continua em aberto, com "Mover as atrasadas para hoje"; próxima semana; nota da semana; atalhos para Histórico, Calendário e Estudos.
* **Histórico**: linha do tempo agrupada por dia (Hoje, Ontem, data por extenso) com tarefas criadas, concluídas, canceladas, reabertas e não realizadas, prioridade e data alteradas e sessões de estudo; filtros Tudo, Tarefas e Estudos, período (hoje, ontem, 7 e 30 dias, este mês ou personalizado) e busca por tarefa, categoria ou atividade; detalhes de cada registro com atalho para abrir a tarefa ou editar a sessão; "Mostrar mais registros".
* **Estudos**: cronômetro livre e Pomodoro que continua ao trocar de tela, atividades com meta semanal, sessões manuais editáveis, histórico recente e métricas da semana.
* **Dashboard**: saudação com o que falta hoje; resumo da semana (concluídas, pendentes, atrasadas, urgentes e sequência de dias); tarefas de hoje com conclusão e "Desfazer"; atrasadas com "Mover todas para hoje"; próximas atividades com a carga de tarefas da semana; tarefas em aberto por prioridade; produtividade (tarefas concluídas e tempo de estudo por dia, em 7 ou 30 dias); atividade recente; mapa de calor de estudo dos últimos 6 meses; metas da semana.
* Camada de dados: cliente HTTP único com tempo limite, erros tipados e fuso no cabeçalho; serviços por recurso; simulador que responde às mesmas rotas da API e guarda os dados no navegador.
* Tela de boas-vindas com a frase de efeito, exibida ao abrir o Orbit numa nova aba ou janela, com saída em cascata e o logo viajando até o menu lateral.
* Menu lateral com seções Planejamento, Estudos e Acompanhamento, modo recolhido persistido e gaveta abaixo de 1100px.
* Cabeçalho com a data de hoje e troca de tema animada.
* Tema claro, escuro e sistema, com transição suave de cores e sem flash de tema errado ao abrir.
* Design system completo: botões, campos de texto, número, busca, data, horário e seleção próprios (nenhum seletor nativo do navegador), caixas de seleção, opções, interruptor, grupo segmentado, selos de prioridade, situação, prazo e categoria, cartões, modal, diálogo de confirmação e notificações com ação de desfazer.
* Estados de carregamento (esqueleto contínuo), vazio e erro com "Tentar novamente".
* Catálogo de todos os componentes e estados em `/componentes`, só no ambiente de desenvolvimento.

🔹 **Planejadas** (definidas em `REQUISITOS.md`)
* **Paleta de comandos** (`Ctrl+K`) e **Configurações** (tema, Pomodoro e cadastro de categorias).


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

🔹 test
```bash
# Testes das regras de negócio (prazo, recorrência, validações, lembrete, sequência, mapa de calor, revisão semanal)
$ npm run test
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
├── api/             clienteHttp, ErroApi, rotasApi (única fonte de URLs), transportes
├── componentes/
│   ├── ui/          Botao, BotaoIcone, CampoTexto, CampoNumero, CampoBusca, AreaTexto,
│   │                CampoSelecao, SeletorData, SeletorHorario, CaixaSelecao, GrupoRadio,
│   │                Interruptor, GrupoOpcoes, Selo, Painel, Modal, DialogoConfirmacao,
│   │                Flutuante, Notificacao, Esqueleto, IndicadorGiratorio, EstadoVazio,
│   │                EstadoErro, BarraProgresso, ConteudoAssincrono, Paginacao
│   ├── calendario/  NavegacaoCalendario (com seletor de mês e ano), GradeMes, CelulaDia, AgendaDia
│   ├── layout/      MenuLateral, Cabecalho, CabecalhoPagina, BotaoTema
│   ├── boasVindas/  TelaBoasVindas e a transição para a aplicação
│   ├── dashboard/   ResumoIndicadores, TarefasDeHoje, ProximasAtividades, CargaSemana,
│   │                PrioridadesEmAberto, PainelProdutividade, MapaCalorEstudo,
│   │                ListaEventosRecentes
│   ├── estudos/     ProgressoMetas
│   ├── graficos/    GraficoBarras (Recharts)
│   ├── tarefas/     ItemTarefa, ListaTarefas, FormularioTarefa, CamposRecorrencia,
│   │                EscolhaEscopoAlteracao, DetalhesTarefa, BarraFiltrosTarefas e selos
│   └── comum/       MarcaOrbit
├── configuracoes/   ambiente, aplicacao, navegacao
├── dados/simulacao/ simulador da API: banco no localStorage, sementes e manipuladores
├── estilos/         tokens.css (escala), temas.css (cores por tema), global.css
├── ganchos/         useDadosAssincronos, useContagem, useArmazenamentoLocal,
│                    useConsultaMidia, useTravarRolagem, useTituloDocumento
├── layouts/         LayoutAplicacao (casca: menu lateral + cabeçalho + conteúdo)
├── modelos/         DTOs (tarefas, estudos, painel, comum), enumeracoes, rotulos, cores
├── paginas/         PaginaDashboard, PaginaCalendario, PaginaTarefas, páginas provisórias,
│                    PaginaComponentes, PaginaNaoEncontrada
├── provedores/      ProvedorTema, ProvedorNotificacoes, ProvedorAlteracoes,
│                    ProvedorAcoesTarefa, AgendadorLembretes
├── regras/          prazo, recorrencia, validacaoTarefa, lembrete, sequencia, escalaCalor (com testes)
├── rotas/           RotasAplicacao, caminhos (única fonte de rotas)
├── servicos/        servicoTarefas, servicoCategorias, servicoAtividades, servicoSessoes,
│                    servicoDashboard
└── utilitarios/     datas, formatacao, foco, juntarClasses
```


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

Os dados que o Dashboard espera de cada rota estão na seção 16 do `ARQUITETURA.md`; as rotas de
tarefas usadas pelo Calendário e pela página Tarefas, na seção 17.

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

* 🔀 Três modos: claro, escuro e sistema (acompanha o dispositivo). O botão do cabeçalho alterna entre claro e escuro, com os ícones de sol e lua trocando em mola e a página inteira esmaecendo de um tema para o outro em 600ms.

* 🔵 Destaque em azul-marinho (`#1f3b73` no claro, `#8faae6` no escuro): sóbrio, para não competir com o conteúdo.

* ♿ Contraste é requisito, não acabamento: todo texto passa de 4.5:1 e toda borda de controle de 3:1, nos dois temas.


<br>


## 📱 Responsividade

* 🖥️ **Desktop**: menu lateral fixo, com modo recolhido (72px) persistido em `localStorage`.

* 📲 **Abaixo de 1100px**: o menu vira gaveta com véu, prende o foco, fecha ao navegar e no Esc, e trava a rolagem do fundo.

* 🪟 **Abaixo de 600px**: modais viram folhas que sobem da base da tela.

* 📅 **Calendário**: agenda ao lado da grade quando há espaço; abaixo dela no tablet e no celular, onde a grade fica compacta (iniciais dos dias e pontos menores).

* 👆 Alvos de toque e texto de campo crescem em `@media (pointer: coarse)`: 44px de alvo e 16px de texto, o mínimo que evita o zoom automático do Safari no iOS.

* 🎬 `prefers-reduced-motion` respeitado globalmente.


<br>


## 🗺️ Próximas Etapas

* 🔌 **Fase 10**, com as Configurações e a preparação final do contrato da API.

* ☕ OrbitAPI em Java / Spring Boot, e depois Docker e esteira de publicação no mesmo modelo do PrismaWeb.

* 🔐 Login e múltiplos usuários, previstos para o futuro: a arquitetura já concentra as requisições num ponto único para receber o token.


<br> 
 
## 🖥️ Desenvolvedor

### 🔵 LinkedIn: [Gustavo Correa](https://www.linkedin.com/in/gustavo-chauar-correa-946168269/)
