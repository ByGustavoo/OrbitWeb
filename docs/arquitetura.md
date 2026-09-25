# Arquitetura do front-end — OrbitWeb

Como o front-end do Orbit está organizado, como os dados fluem e como ele se prepara para trocar os
dados simulados pela API real (OrbitAPI, em Java + Spring Boot).

| Documento | Conteúdo |
|---|---|
| [`api-contrato.md`](api-contrato.md) | Endpoints, formatos, erros |
| [`backend.md`](backend.md) | Guia de implementação da API |
| [`regras-negocio.md`](regras-negocio.md) | Regras funcionais |
| [`historico-fases.md`](historico-fases.md) | Registro das decisões tomadas nas fases 02 a 09 |

---

## 1. Stack

| Camada | Escolha |
|---|---|
| Build | Vite 5 |
| Linguagem | TypeScript 5 (`strict`) |
| Interface | React 18 |
| Rotas | React Router 6 (com as *future flags* da v7) |
| Estilos | CSS Modules + custom properties (tokens), sem framework de UI |
| Ícones | lucide-react |
| Gráficos | Recharts (barras) e SVG/CSS próprio (mapa de calor, carga da semana) |
| Fontes | Geist e Geist Mono, servidas pelo próprio app (Fontsource) |
| HTTP | `fetch` nativo, atrás de um cliente próprio (sem Axios) |
| Testes | Vitest, para regras de negócio puras e para o tratamento de erros da API |

A proposta inicial previa JavaScript puro; a decisão D1 (Fase 02) trocou por React + TypeScript,
igual ao PrismaWeb, para os dois projetos evoluírem do mesmo jeito.

---

## 2. Camadas

```text
Página            lê os parâmetros da tela, busca os dados e orquestra os componentes
  ↓
Componente        desenha e reage a eventos; recebe dados por props
  ↓
Gancho            useDadosAssincronos: dados / carregando / erro / recarregar
  ↓
Serviço           uma função por operação (buscarTarefas, concluirTarefa…)
  ↓
Cliente HTTP      monta a requisição, cabeçalhos, tempo limite, converte erros
  ↓
Transporte        fetch (API real)  ou  simulador (dados simulados)
  ↓
API REST          OrbitAPI (Spring Boot)

Transversais: modelos/ (tipos dos DTOs), regras/ (regras puras), utilitarios/ (datas, formatação)
```

Regras que mantêm as camadas separadas (conferidas nesta fase):

1. **Componentes e páginas nunca chamam `fetch` nem `clienteHttp`.** Chamam serviços, ou recebem
   os dados prontos por props.
2. **URLs da API existem só em `src/api/rotasApi.ts`.**
3. **Variáveis de ambiente são lidas só em `src/configuracoes/ambiente.ts`.**
4. **Dados simulados existem só em `src/dados/simulacao/`** e só o `clienteHttp` os carrega.
5. **Erros da API são interpretados só em `src/api/tratamentoErros.ts`.** As telas perguntam o tipo
   (`ehErroApi`), os erros de campo (`errosDeCampo`) e a frase para a pessoa (`descreverFalha`).
6. **Regras de negócio puras ficam em `src/regras/`**, sem React e sem HTTP, com testes.
7. **Tipos dos DTOs ficam em `src/modelos/`**, com os mesmos nomes do contrato.

---

## 3. Estrutura de pastas

```text
OrbitWeb/
├── index.html              aplica o tema salvo antes da primeira pintura
├── public/
│   ├── config.js           configuração em tempo de execução (window.__ORBIT_CONFIG__)
│   └── icone.svg
├── docs/                   documentação (este arquivo, contrato, backend, regras, histórico)
├── .env.example            variáveis de ambiente de exemplo
└── src/
    ├── principal.tsx       ponto de entrada
    ├── Aplicacao.tsx       provedores + roteador
    ├── api/                clienteHttp, ErroApi, tratamentoErros, rotasApi, transportes
    ├── configuracoes/      ambiente, aplicacao (nome, chaves de armazenamento, pontos de quebra), navegacao
    ├── dados/simulacao/    simulador da API (banco no localStorage, sementes, manipuladores por recurso)
    ├── modelos/            DTOs, enumerações, rótulos em português, cores
    ├── regras/             prazo, recorrência, validações, cronômetro, lembrete, sequência,
    │                       mapa de calor, período do histórico, revisão semanal (com testes)
    ├── servicos/           um serviço por recurso
    ├── ganchos/            useDadosAssincronos, useParametrosPagina, useArmazenamentoLocal,
    │                       useConsultaMidia, useContagem, useAgora, useHojeIso,
    │                       useTituloDocumento, useTravarRolagem
    ├── provedores/         tema, notificações, alterações, ações de tarefa, cronômetro, lembretes
    ├── layouts/            LayoutAplicacao (menu lateral + cabeçalho + conteúdo)
    ├── rotas/              caminhos e tabela de rotas
    ├── paginas/            uma página por rota
    ├── componentes/
    │   ├── ui/             design system, sem conhecimento do domínio
    │   ├── layout/         MenuLateral, Cabecalho, CabecalhoPagina, BotaoTema, MiniCronometro
    │   ├── boasVindas/     tela de boas-vindas e transição
    │   ├── comum/          MarcaOrbit
    │   ├── tarefas/        ItemTarefa, ListaTarefas, FormularioTarefa, CamposRecorrencia,
    │   │                   EscolhaEscopoAlteracao, DetalhesTarefa, BarraFiltrosTarefas, selos
    │   ├── calendario/     NavegacaoCalendario, GradeMes, CelulaDia, AgendaDia
    │   ├── estudos/        Cronometro, SeletorAtividade, ResumoSessao, FormularioAtividade,
    │   │                   FormularioSessao, ListaAtividades, ListaSessoes, MetricasEstudo,
    │   │                   ProgressoMetas
    │   ├── historico/      BarraFiltrosHistorico, LinhaDoTempoHistorico, DetalhesRegistroHistorico
    │   ├── revisao/        NavegacaoSemana, ResumoSemana, FatosSemana, BarrasDaSemana,
    │   │                   EstudosDaSemana, TarefasDaSemana, ProximaSemana, NotaDaSemana
    │   ├── dashboard/      ResumoIndicadores, IndicadorNumerico, TarefasDeHoje,
    │   │                   ProximasAtividades, CargaSemana, PrioridadesEmAberto,
    │   │                   PainelProdutividade, ListaEventosRecentes, MapaCalorEstudo
    │   └── graficos/       GraficoBarras (Recharts)
    ├── utilitarios/        datas, formatacao, foco, juntarClasses, tituloDocumento
    └── estilos/            tokens.css, temas.css, global.css
```

Componentes em `PascalCase.tsx` com o `PascalCase.module.css` ao lado. Ganchos começam com `use`,
porque o React exige. Importações usam o apelido `@/` para `src/`.

---

## 4. Responsabilidades

### 4.1 Páginas

| Rota | Página | Responsabilidade | Serviços |
|---|---|---|---|
| `/` | — | Redireciona para `/dashboard` | — |
| `/dashboard` | `PaginaDashboard` | O que há para hoje e como está a semana | `servicoDashboard`, `servicoTarefas`, `servicoSessoes` |
| `/calendario` | `PaginaCalendario` | Grade do mês e agenda do dia | `servicoTarefas`, `servicoSessoes` |
| `/tarefas` | `PaginaTarefas` | Lista filtrada e paginada; visões Todas, Sem data, Atrasadas | `servicoTarefas`, `servicoCategorias` |
| `/estudos` | `PaginaEstudos` | Cronômetro, atividades, métricas e histórico recente | `servicoAtividades`, `servicoSessoes` |
| `/historico` | `PaginaHistorico` | Linha do tempo de tarefas e estudos | `servicoHistorico`, `servicoSessoes`, `servicoAtividades` |
| `/estudos/historico` | — | Redireciona para `/historico` filtrado em Estudos | — |
| `/revisao` | `PaginaRevisaoSemanal` | Revisão da semana e nota | `servicoRevisaoSemanal` |
| `/configuracoes` | `PaginaConfiguracoes` | **Provisória** ("Esta tela ainda está em construção") | — |
| `/componentes` | `PaginaComponentes` | Catálogo do design system, **só em desenvolvimento** | — |
| outras | `PaginaNaoEncontrada` | Página não encontrada | — |

As páginas são carregadas sob demanda (`React.lazy`). Filtros, mês, dia, semana e período ficam no
**estado do histórico do navegador** (`useParametrosPagina`), não na query string: a barra de
endereços mostra só o caminho, o botão Voltar funciona e recarregar mantém a tela.

### 4.2 Componentes

- **`ui/`** — peças genéricas do design system: botões, campos (texto, número, busca, data,
  horário, seleção), caixas, interruptor, grupos de opções, selos, painéis, modal empilhável,
  diálogo de confirmação, notificações com "Desfazer", esqueletos, estados vazio e de erro,
  paginação, barra de progresso. Não conhecem tarefas nem estudos.
- **Por domínio** (`tarefas/`, `calendario/`, `estudos/`, `historico/`, `revisao/`, `dashboard/`)
  — desenham um pedaço de uma tela a partir de DTOs recebidos por props e devolvem as ações por
  *callbacks* (`aoConcluir`, `aoEnviar`…).
- **Exceções conscientes:** `FormularioTarefa` carrega as listas de categorias e atividades, e
  `DetalhesRegistroHistorico` carrega os detalhes do registro, pelos serviços; os dois abrem como
  modal a partir de vários lugares.

### 4.3 Serviços

Cada serviço é um objeto com uma função por operação, uma camada fina sobre o `clienteHttp`. Toda
função aceita um `AbortSignal` opcional, que o `useDadosAssincronos` aborta quando a tela é
desmontada.

| Serviço | Função | Método e rota | Retorno |
|---|---|---|---|
| `servicoTarefas` | `buscarTarefas(filtros)` | `GET /tarefas` | `PaginaDTO<TarefaDTO>` |
| | `buscarTarefasPorData(data)` | `GET /tarefas?data&ordenacao=DATA&tamanho=100` | `TarefaDTO[]` |
| | `buscarTarefa(id)` | `GET /tarefas/{id}` | `TarefaDTO` |
| | `criarTarefa(dados)` | `POST /tarefas` | `TarefaDTO` |
| | `atualizarTarefa(id, dados, escopo)` | `PUT /tarefas/{id}?escopo` | `TarefaDTO` |
| | `alterarSituacao(id, situacao)` | `PATCH /tarefas/{id}/situacao` | `TarefaDTO` |
| | `concluirTarefa`, `reabrirTarefa`, `cancelarTarefa` | `PATCH /tarefas/{id}/situacao` | `TarefaDTO` |
| | `excluirTarefa(id, escopo)` | `DELETE /tarefas/{id}?escopo` | — |
| | `reagendarTarefas(reagendamento)` | `POST /tarefas/reagendamentos` | `TarefaDTO[]` |
| | `buscarResumoCalendario(periodo)` | `GET /tarefas/resumo-calendario` | `DiaCalendarioDTO[]` |
| `servicoCategorias` | `buscarCategorias()` | `GET /categorias` | `CategoriaDTO[]` |
| `servicoAtividades` | `buscarAtividades()` | `GET /atividades` | `AtividadeEstudoDTO[]` |
| | `criarAtividade(dados)` | `POST /atividades` | `AtividadeEstudoDTO` |
| | `atualizarAtividade(id, dados)` | `PUT /atividades/{id}` | `AtividadeEstudoDTO` |
| | `arquivarAtividade(id)`, `desarquivarAtividade(id)` | `PATCH /atividades/{id}/arquivamento` | `AtividadeEstudoDTO` |
| | `excluirAtividade(id)` | `DELETE /atividades/{id}` | — |
| `servicoSessoes` | `buscarSessoes(filtros)` | `GET /sessoes` | `PaginaDTO<SessaoEstudoDTO>` |
| | `criarSessao(dados)` | `POST /sessoes` | `SessaoEstudoDTO` |
| | `atualizarSessao(id, dados)` | `PUT /sessoes/{id}` | `SessaoEstudoDTO` |
| | `excluirSessao(id)` | `DELETE /sessoes/{id}` | — |
| | `buscarResumoEstudos(filtros)` | `GET /estudos/resumo` | `ResumoEstudosDTO` |
| | `buscarMapaCalor(periodo)` | `GET /estudos/mapa-calor` | `MapaCalorDTO` |
| | `buscarProgressoSemanal(inicioSemana)` | `GET /estudos/progresso-semanal` | `ProgressoMetaDTO[]` |
| `servicoHistorico` | `buscarHistorico(filtros)` | `GET /historico` | `PaginaDTO<RegistroHistoricoDTO>` |
| | `buscarDetalhesHistorico(id)` | `GET /historico/{id}` | `DetalheHistoricoDTO` |
| `servicoRevisaoSemanal` | `buscarRevisaoSemanal(inicioSemana)` | `GET /revisao-semanal` | `RevisaoSemanalDTO` |
| | `salvarNotaSemana(inicioSemana, texto)` | `PUT /revisao-semanal/{inicioSemana}/nota` | `NotaSemanaDTO \| null` |
| `servicoDashboard` | `buscarResumoDashboard(periodo)` | `GET /dashboard/resumo` | `ResumoDashboardDTO` |
| | `buscarSequencia(data)` | `GET /dashboard/sequencia` | `SequenciaDTO` |

Todos os serviços rejeitam com um `ErroApi` (seção 7). Os possíveis erros de cada rota estão no
[contrato](api-contrato.md).

O cronômetro **não** é um serviço: é regra (`regras/cronometro.ts`) mais estado
(`ProvedorCronometro`). Ele só fala com a API ao salvar a sessão.

### 4.4 Modelos

`src/modelos/` guarda só tipos e constantes, sem lógica:

| Arquivo | Conteúdo |
|---|---|
| `enumeracoes.ts` | Enums do contrato (`Prioridade`, `Situacao`, `Prazo`, `Frequencia`…) |
| `tarefas.ts` | `TarefaDTO`, `TarefaEnvioDTO`, `RecorrenciaDTO`, `FiltrosTarefas`, `ReagendamentoDTO`, `DiaCalendarioDTO` |
| `estudos.ts` | Atividade, sessão, resumo de estudos, metas, mapa de calor |
| `historico.ts` | `RegistroHistoricoDTO`, `DetalheHistoricoDTO`, filtros e períodos |
| `revisao.ts` | `RevisaoSemanalDTO` e partes; limite da nota |
| `painel.ts` | `ResumoDashboardDTO`, `EventoRecenteDTO`, `SequenciaDTO` |
| `comum.ts` | `PaginaDTO`, `ErrorResponseDTO`, `ErroCampoDTO`, `CategoriaDTO` |
| `rotulos.ts` | Texto em português de cada valor de enum |
| `cores.ts` | Tokens CSS de cada cor da paleta e de cada prioridade |

### 4.5 Provedores (estado global)

Só o que precisa sobreviver à troca de página vira estado global:

| Provedor | Conteúdo | Persistência |
|---|---|---|
| `ProvedorTema` | Modo (`claro`, `escuro`, `sistema`) e tema resolvido | `localStorage` |
| `ProvedorNotificacoes` | Fila de avisos (toasts), com ação opcional | memória |
| `ProvedorAlteracoes` | Versão por recurso (`tarefas`, `sessoes`, `atividades`, `categorias`) | memória |
| `ProvedorAcoesTarefa` | Formulário, detalhes e diálogos de tarefa; concluir com "Desfazer"; mover atrasadas | memória |
| `ProvedorCronometro` | Sessão em andamento, modo, Pomodoro | `localStorage` |
| `AgendadorLembretes` | Dispara os lembretes das tarefas de hoje | `localStorage` (lembretes já exibidos) |

Dados do domínio (tarefas, sessões, atividades) **não** ficam em estado global: cada página busca o
que precisa.

---

## 5. Fluxo de dados

### 5.1 Leitura

```text
Tela abre (ou muda um filtro)
  → useDadosAssincronos(buscar, dependências)
  → serviço → clienteHttp → transporte → API
  → { dados, carregando, erro, recarregar }
  → esqueleto → conteúdo | estado vazio | estado de erro com "Tentar novamente"
```

Se a tela for desmontada ou os filtros mudarem antes da resposta, o `AbortSignal` cancela a
requisição e a resposta antiga é descartada.

### 5.2 Escrita e sincronização entre telas

```text
Ação (concluir, salvar, excluir…)
  → serviço (POST / PUT / PATCH / DELETE)
  → sucesso: aviso curto e notificarAlteracao('tarefas' | 'sessoes' | 'atividades' | 'categorias')
  → toda região que depende daquele recurso tem a versão nas dependências e busca de novo
  → erro: o estado anterior continua na tela e o aviso explica o que houve
```

Não há atualização otimista: a tela só mostra uma mudança depois que a API confirma. Enquanto a
nova leitura chega, listas e gráficos mantêm o conteúdo anterior esmaecido, em vez de piscar o
esqueleto.

### 5.3 Integração entre telas

| Alteração | Telas que buscam de novo |
|---|---|
| Tarefa criada, editada, concluída, reaberta, cancelada, excluída ou reagendada | Dashboard, Calendário, Tarefas, Histórico, Revisão semanal, lembretes |
| Sessão salva, editada ou excluída | Dashboard (produtividade, mapa de calor, metas, sequência, atividade recente), Estudos, Calendário (estudo do dia), Histórico, Revisão semanal |
| Atividade criada, editada, arquivada ou excluída | Estudos, metas do Dashboard, formulários, Histórico, Revisão semanal |

---

## 6. Comunicação com a API

### 6.1 Configuração da API

| Variável | Finalidade | Valores | Exemplo |
|---|---|---|---|
| `VITE_FONTE_DADOS` | Origem dos dados | `simulada` (padrão) ou `api` | `api` |
| `VITE_URL_API` | URL base da API REST | URL completa, sem barra no fim | `http://localhost:8080/api` |

- **Desenvolvimento:** copie `.env.example` para `.env`. Sem `.env`, o front usa os dados
  simulados. Para usar a API, defina `VITE_FONTE_DADOS=api` e `VITE_URL_API`.
- **Produção:** as variáveis `VITE_*` são fixadas no *build*. Para a mesma imagem servir qualquer
  ambiente, `public/config.js` define `window.__ORBIT_CONFIG__`; se `urlApi` estiver preenchido
  ali, ele **tem prioridade** sobre `VITE_URL_API`. O `config.js` é carregado antes do app no
  `index.html` e pode ser reescrito no *deploy*:

  ```js
  window.__ORBIT_CONFIG__ = { urlApi: 'https://api.exemplo.com/orbit', versao: '1.0.0' };
  ```

- **Ordem de prioridade da URL:** `window.__ORBIT_CONFIG__.urlApi` → `VITE_URL_API` →
  `http://localhost:8080/api`.
- Nenhum outro arquivo lê `import.meta.env`; todo o código usa o objeto `ambiente`
  (`src/configuracoes/ambiente.ts`).
- Não existe URL da API fixa espalhada pelo código: os caminhos ficam em `rotasApi.ts` e a base, em
  `ambiente.urlApi`.

A URL definitiva do OrbitAPI (porta, *context-path*, versão) é **A DEFINIR NO BACKEND**.

### 6.2 Cliente HTTP

`src/api/clienteHttp.ts` é o único ponto que faz requisições. Ele expõe `get`, `post`, `put`,
`patch` e `delete` e, a cada chamada:

1. monta os parâmetros de consulta (listas viram parâmetros repetidos; vazios são omitidos);
2. envia `Accept: application/json`, `Content-Type: application/json` quando há corpo e
   `X-Fuso-Horario` com o fuso do navegador;
3. serializa o corpo com `JSON.stringify`;
4. aplica **tempo limite de 15 s** e respeita o `AbortSignal` da tela;
5. desserializa a resposta: `204` ou corpo vazio viram `undefined`; corpo não-JSON é mantido como
   texto;
6. transforma status `>= 400`, falhas de rede, tempo esgotado e cancelamentos num `ErroApi`;
7. registra falhas no console (seção 7).

Não há nova tentativa automática: quem tenta de novo é a pessoa, pelo botão "Tentar novamente".

A autenticação futura (`Authorization`) será acrescentada só neste arquivo.

### 6.3 Transportes

```text
servico → clienteHttp → transporteFetch     → OrbitAPI (VITE_FONTE_DADOS=api)
                      ↘ transporteSimulado  → dados/simulacao (VITE_FONTE_DADOS=simulada)
```

Os dois têm a mesma assinatura (`src/api/transporte.ts`): recebem método, caminho, consulta, corpo,
cabeçalhos e sinal, e devolvem `{ status, corpo }`. O simulador é carregado com `import()`
dinâmico: com `VITE_FONTE_DADOS=api`, ele nem entra no pacote de produção.

---

## 7. Tratamento de erros

```text
API                resposta 4xx/5xx com ErrorResponseDTO, falha de rede ou demora
 ↓
clienteHttp        lerErrorResponse → ErroApi { tipo, status, resposta }; registrarErro
 ↓
Serviço            rejeita a Promise com o ErroApi (não trata)
 ↓
tratamentoErros    ehErroApi(erro, tipo) · errosDeCampo(erro) · descreverFalha(erro)
 ↓
Interface          EstadoErro, aviso (toast), mensagem no campo ou no topo do formulário
```

- **`ErroApi`** (`src/api/ErroApi.ts`): `tipo` (`REDE`, `TEMPO_ESGOTADO`, `VALIDACAO`,
  `NAO_ENCONTRADO`, `CONFLITO`, `SERVIDOR`, `CANCELADO`), `status` HTTP e `resposta` (o
  `ErrorResponseDTO` lido, ou `null`).
- **`lerErrorResponse`** aceita o corpo só se ele tiver o formato do `ErrorResponseDTO`
  (`status`, `title`, `instance`, `type`, `detail` e, opcionalmente, `errors`). Uma página HTML de
  erro de um *proxy* vira `resposta = null`, e o status decide sozinho.
- **`descreverFalha`** devolve a frase para a pessoa: o `detail` da API em validação, "não
  encontrado" e conflito; uma frase própria em rede, tempo esgotado e erro de servidor (o `detail`
  técnico de um `500` nunca aparece).
- **`errosDeCampo`** transforma `errors` em `{ campo: mensagem }` para os formulários.
- **`registrarErro`** escreve `[Orbit] MÉTODO /rota falhou: TIPO` e o `ErrorResponseDTO` no
  console: sempre para rede, tempo esgotado e servidor; os demais, só em desenvolvimento.
- `EstadoErro` recebe o erro (`erro={resultado.erro}`) e escolhe a descrição com
  `descreverFalha`; o título continua específico de cada região ("Não foi possível carregar as
  tarefas").

Tabela completa de status × tipo × mensagem em
[`api-contrato.md` › 2.3](api-contrato.md#23-como-o-front-classifica-e-apresenta-os-erros).

---

## 8. Estados da interface

Todos os estados usam os componentes do design system em `src/componentes/ui/`.

| Estado | Componente | Comportamento |
|---|---|---|
| Carregando | `Esqueleto`, `EsqueletoLista`, `EsqueletoCartao` | Esqueleto no formato do conteúdo; aparece só depois de 300 ms (evita piscar em respostas rápidas); imediato ao trocar filtro, visão ou página |
| Sucesso | `Notificacao` (via `ProvedorNotificacoes`) | Aviso curto ("Tarefa criada."), com "Desfazer" quando a ação permite |
| Vazio | `EstadoVazio` | Explica o que aparece ali e oferece a ação que preenche ("Nova tarefa", "Lançar sessão") |
| Sem resultados | `EstadoVazio` | Com filtros ativos: "Nenhum resultado encontrado." e "Limpar filtros" |
| Erro ao carregar | `EstadoErro` | Título da região + causa (`descreverFalha`) + "Tentar novamente"; cada região falha sozinha, sem derrubar a página |
| Erro ao salvar | Aviso no topo do formulário, mensagens nos campos | O que foi digitado continua no formulário |
| Erro numa ação | `Notificacao` de erro | "Não foi possível concluir a tarefa." + causa |
| Salvando | `Botao` com `carregando` | Botão bloqueado com indicador; o item da lista mostra o envio |
| Atualizando | Conteúdo anterior esmaecido (`aria-busy`) | Depois de uma alteração, a lista ou o gráfico ficam até a nova leitura chegar |
| Excluindo | `DialogoConfirmacao` + `Botao` com `carregando` | Sempre com confirmação; tarefa lembra que cancelar mantém o histórico |

Por tela:

| Tela | Carregando | Vazio | Erro |
|---|---|---|---|
| Dashboard | Um esqueleto por painel | Por painel ("Nenhuma tarefa para hoje"…) | Por painel, com "Tentar novamente" |
| Calendário | Grade com marcadores carregando; agenda esmaecida ao trocar de dia | "Nada foi agendado para esta data." / "Planeje algo…" | Falha nos marcadores vira aviso de uma linha (os dias continuam clicáveis); falha na agenda, `EstadoErro` |
| Tarefas | Esqueleto imediato ao trocar filtro | Por visão (Todas, Sem data, Atrasadas) e "Nenhum resultado" com filtros | `EstadoErro` na lista; aviso ao falhar "Mover todas para hoje" |
| Estudos | Por região (cronômetro, métricas, atividades, histórico) | "Crie uma atividade…", "As sessões que você salvar…" | `EstadoErro` compacto por região; sessão não salva continua no navegador |
| Histórico | Esqueleto imediato ao trocar filtro | "Nenhuma atividade registrada." / "Nenhum resultado encontrado." | `EstadoErro`; aviso ao falhar "Mostrar mais registros" |
| Revisão semanal | Esqueleto por bloco | "Nenhuma atividade registrada nesta semana." (mantém próxima semana e nota) | `EstadoErro` com "Tentar novamente"; erro da nota junto do campo |

---

## 9. Estratégia de dados simulados

- `src/dados/simulacao/transporteSimulado.ts` atende **as mesmas rotas, com os mesmos formatos e
  os mesmos erros (`ErrorResponseDTO`)** da API, usando as funções de `src/regras/` (prazo,
  recorrência, validações, sequência).
- Os dados ficam no `localStorage` (`orbit:simulacao:banco`), então sobrevivem a recarregar. O
  banco tem versão; quando o formato muda, ele é gerado de novo.
- As sementes são geradas **em relação à data de hoje**, com situações do dia a dia (contas,
  mercado, consultas, trabalho e estudos), para sempre haver tarefas de hoje, atrasadas, da semana e
  sessões nos últimos meses.
- Latência simulada de 200 a 500 ms.
- Controles no console, só em desenvolvimento:

  ```js
  orbitSimulacao.restaurar()          // gera de novo os dados de exemplo
  orbitSimulacao.esvaziar()           // apaga tudo, para ver os estados vazios
  orbitSimulacao.falhar('/tarefas')   // rotas que começam assim respondem 503 ('*' = todas; false desliga)
  orbitSimulacao.latencia(8000)       // latência fixa, para ver os esqueletos (false volta ao normal)
  ```

- Os valores de `type` e `title` que o simulador devolve são provisórios; os definitivos são do
  backend.

## 10. Preparação para o backend

Trocar o simulador pela API é mudar **uma variável**:

```bash
VITE_FONTE_DADOS=api
VITE_URL_API=http://localhost:8080/api
```

Nenhuma página, componente ou serviço muda. O que o backend precisa garantir está em
[`backend.md`](backend.md); em resumo:

- as 27 rotas do contrato, com os mesmos nomes de campos e enums;
- `PaginaDTO` e os parâmetros `pagina`/`tamanho`/`ordenacao`;
- `ErrorResponseDTO` em toda resposta de erro;
- `X-Fuso-Horario` liberado no CORS e usado para "hoje";
- horários em `HH:mm` e instantes em ISO 8601.

Depois que todas as rotas estiverem no backend, a pasta `src/dados/simulacao/` pode ser apagada
inteira (junto com a escolha de transporte no `clienteHttp`).

---

## 11. Tema

- Cores só como custom properties: escala em `src/estilos/tokens.css`, valores de cada tema em
  `src/estilos/temas.css`, sob `[data-tema='claro']` e `[data-tema='escuro']`. Nenhum componente
  declara cor em hexadecimal.
- Três modos: claro, escuro e sistema (acompanha o dispositivo). O botão do cabeçalho alterna entre
  claro e escuro; a preferência fica em `localStorage` (`orbit:tema`).
- Um script no `index.html` aplica o tema salvo antes do React montar, sem "piscar" o tema errado.
- A troca de tema é um esmaecimento de 600 ms (View Transitions API), com alternativa em CSS.
- Os gráficos do Recharts são pintados por CSS com os tokens e trocam de tema junto com a página.
- Contraste mínimo: 4,5:1 para texto e 3:1 para bordas de controle, nos dois temas.

## 12. Responsividade

| Largura | Comportamento |
|---|---|
| ≥ 1100 px | Menu lateral fixo, com modo recolhido (preferência salva) |
| < 1100 px | Menu vira gaveta com véu, prende o foco, fecha ao navegar e no `Esc` |
| < 768 px | Layout de celular: uma coluna, espaçamentos menores |
| < 600 px | Modais viram folhas que sobem da base da tela |
| `pointer: coarse` | Alvos de toque de 44 px e texto de campo de 16 px (evita o zoom do Safari no iOS) |

Dashboard, Calendário e Revisão semanal usam *container queries*: respondem à largura real do
conteúdo (com ou sem menu lateral), e não à da janela. `prefers-reduced-motion` é respeitado em
toda a aplicação.

## 13. Armazenamento local

| Chave | Conteúdo |
|---|---|
| `orbit:tema` | Modo de tema |
| `orbit:menu-recolhido` | Menu lateral recolhido |
| `orbit:cronometro:sessao` | Sessão de estudo em andamento |
| `orbit:cronometro:preferencias` | Última atividade e modo usados |
| `orbit:lembretes-exibidos` | Lembretes já mostrados |
| `orbit:boas-vindas-vista` (`sessionStorage`) | Boas-vindas já exibida nesta aba |
| `orbit:simulacao:*` | Banco, falhas e latência do simulador (só com dados simulados) |

## 14. Testes

```bash
npm run test        # Vitest
npm run typecheck   # tsc -b
```

Testes em `src/regras/*.test.ts` (prazo, recorrência, validações, cronômetro, lembrete, sequência,
mapa de calor, período do histórico, revisão semanal), `src/utilitarios/formatacao.test.ts` e
`src/api/tratamentoErros.test.ts` (leitura do `ErrorResponseDTO` e mensagens de erro).
