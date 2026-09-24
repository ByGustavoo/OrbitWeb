# OrbitWeb — Arquitetura e planejamento técnico

Documento da **Fase 02**. Transforma os requisitos de `REQUISITOS.md` numa estrutura técnica.
Os requisitos continuam sendo a fonte de verdade do produto; este documento diz **como** eles
serão construídos. As decisões técnicas aprovadas estão na seção 14.

---

## 1. Arquitetura

### Stack

A mesma do PrismaWeb (decisão D1), para que os dois projetos se mantenham e evoluam do mesmo jeito.

| Camada | Escolha |
|---|---|
| Build | Vite 5 |
| Interface | React 18 + TypeScript 5 (`strict`) |
| Rotas | React Router 6, com as future flags da v7 ligadas |
| Estilos | CSS Modules + custom properties, sem framework de UI |
| Ícones | lucide-react |
| Gráficos | Recharts (barras e rosca) + SVG/CSS próprio no mapa de calor, como no PrismaWeb (D5) |
| Testes | Vitest, só para `regras/` |

Verificação obrigatória antes de dar uma tarefa por concluída: `npm run typecheck` (`tsc -b`, como
no PrismaWeb) e `npm run test`.

### Camadas

```text
Página            lê a URL, busca os dados e orquestra os componentes
  ↓
Componente        desenha e reage a eventos; não conhece HTTP
  ↓
Gancho            useDadosAssincronos: carregando / erro / dados / recarregar
  ↓
Serviço           uma função por operação do domínio (buscarTarefas, concluirTarefa…)
  ↓
Cliente HTTP      monta URL, cabeçalhos, tempo limite e trata erros
  ↓
Transporte        fetch (API real)  ou  simulador (dados simulados)
  ↓
API REST          Spring Boot
```

Regras que mantêm as camadas separadas:

1. **Componentes nunca chamam `fetch` nem `clienteHttp`.** Chamam serviços, ou recebem os dados
   prontos da página.
2. **URLs de API existem só em `api/rotasApi.ts`.**
3. **Variáveis de ambiente são lidas só em `configuracoes/ambiente.ts`.**
4. **Dados simulados existem só em `dados/simulacao/`.** Nenhum componente, página ou serviço
   importa algo de lá; só o `clienteHttp` escolhe o transporte.
5. **Regras de negócio puras ficam em `regras/`**, sem React e sem HTTP, e têm teste.
6. **Tipos dos DTOs ficam em `modelos/`**, e os nomes são os mesmos do contrato com o Spring Boot.

### Estado global

Só o que precisa sobreviver à troca de página vira estado global, cada um num provedor (contexto
React), como no PrismaWeb:

| Provedor | Conteúdo | Persistência |
|---|---|---|
| `ProvedorTema` | modo (`claro`, `escuro`, `sistema`) e tema resolvido | `localStorage` |
| `ProvedorNotificacoes` | fila de toasts | memória |
| `ProvedorCronometro` | sessão em andamento, modo, fase do Pomodoro, marcos de tempo | `localStorage` |
| `ProvedorPreferencias` | durações do Pomodoro, sidebar recolhida | `localStorage` |
| `ProvedorConexao` | API disponível ou não | memória |
| `ProvedorAlteracoes` | contador de versão por recurso (`tarefas`, `sessoes`, `atividades`, `categorias`) | memória |

Dados do domínio (tarefas, sessões, atividades) **não** ficam em contexto global: cada página busca
o que precisa com `useDadosAssincronos`. Para as telas se atualizarem umas às outras, quem altera
algo chama `notificarAlteracao('tarefas')`; quem depende de tarefas coloca
`versoes.tarefas` nas dependências do gancho e busca de novo sozinho.

---

## 2. Estrutura de pastas

As pastas seguem a organização do PrismaWeb, com nomes em português (regra de nomenclatura do
projeto). Componentes em `PascalCase.tsx` com `PascalCase.module.css` ao lado; ganchos começam
com `use`, porque o React exige.

```text
OrbitWeb/
├── index.html                       script que aplica o tema antes da primeira pintura
├── public/
│   └── config.js                    configuração em tempo de execução (vazio no desenvolvimento)
├── docker/                          nginx + geração do config.js, como no PrismaWeb
├── vite.config.ts
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
├── package.json
├── .env.example
├── REQUISITOS.md
├── ARQUITETURA.md
└── src/
    ├── principal.tsx                ponto de entrada
    ├── Aplicacao.tsx                provedores + roteador
    ├── rotas/
    │   ├── caminhos.ts              caminhos da aplicação
    │   └── RotasAplicacao.tsx       tabela de rotas com páginas carregadas sob demanda
    ├── configuracoes/
    │   ├── ambiente.ts              única leitura de import.meta.env e window.__ORBIT_CONFIG__
    │   ├── aplicacao.ts             nome, prefixo do localStorage, pontos de quebra
    │   └── navegacao.ts             itens da sidebar
    ├── api/
    │   ├── clienteHttp.ts
    │   ├── ErroApi.ts
    │   ├── rotasApi.ts              única fonte de URLs da API
    │   └── transporteFetch.ts
    ├── modelos/
    │   ├── enumeracoes.ts           Prioridade, Situacao, Prazo, Frequencia…
    │   ├── tarefas.ts               TarefaDTO, TarefaEnvioDTO, RecorrenciaDTO, filtros
    │   ├── estudos.ts               AtividadeEstudoDTO, SessaoEstudoDTO, SessaoEmAndamento
    │   ├── painel.ts                ResumoDashboardDTO, MapaCalorDTO, SequenciaDTO, RevisaoSemanalDTO
    │   ├── comum.ts                 PaginaDTO, ProblemaDTO, CategoriaDTO, Cor
    │   ├── rotulos.ts               texto exibido para cada valor de enumeração
    │   └── cores.ts                 paleta fixa de cores de categoria e atividade
    ├── regras/
    │   ├── prazo.ts                 atrasada, não realizada, concluída com atraso
    │   ├── recorrencia.ts           próximas datas, descrição ("toda segunda")
    │   ├── cronometro.ts            tempo decorrido a partir dos marcos, pausas
    │   ├── pomodoro.ts              fases e ciclos
    │   ├── sequencia.ts             sequência de dias
    │   ├── validacaoTarefa.ts
    │   ├── validacaoSessao.ts
    │   └── *.test.ts
    ├── servicos/
    │   ├── servicoTarefas.ts
    │   ├── servicoCategorias.ts
    │   ├── servicoAtividades.ts
    │   ├── servicoSessoes.ts
    │   ├── servicoDashboard.ts
    │   ├── servicoRevisao.ts
    │   └── index.ts
    ├── dados/
    │   └── simulacao/
    │       ├── transporteSimulado.ts    atende as mesmas rotas de rotasApi.ts
    │       ├── bancoSimulado.ts         coleções em memória, salvas no localStorage
    │       ├── sementes.ts              dados iniciais gerados em relação a "hoje"
    │       └── manipuladores/           um arquivo por recurso
    ├── provedores/
    │   ├── ProvedoresAplicacao.tsx
    │   ├── ProvedorTema.tsx
    │   ├── ProvedorNotificacoes.tsx
    │   ├── ProvedorCronometro.tsx
    │   ├── ProvedorPreferencias.tsx
    │   ├── ProvedorConexao.tsx
    │   ├── ProvedorAlteracoes.tsx
    │   └── AgendadorLembretes.tsx
    ├── ganchos/
    │   ├── useDadosAssincronos.ts
    │   ├── useParametrosUrl.ts      lê e grava filtros, mês e dia na URL
    │   ├── useConsultaMidia.ts
    │   ├── useArmazenamentoLocal.ts
    │   ├── useTravarRolagem.ts
    │   ├── useValidacaoFormulario.ts
    │   ├── useContagem.ts           animação dos números dos indicadores
    │   └── useAtalhoTeclado.ts
    ├── layouts/
    │   └── LayoutAplicacao.tsx      sidebar + cabeçalho + conteúdo
    ├── componentes/
    │   ├── ui/                      peças genéricas, sem conhecimento do domínio
    │   ├── layout/                  casca da aplicação
    │   ├── tarefas/
    │   ├── calendario/
    │   ├── estudos/
    │   ├── dashboard/
    │   └── graficos/
    ├── paginas/
    │   ├── PaginaDashboard.tsx
    │   ├── PaginaCalendario.tsx
    │   ├── PaginaTarefas.tsx
    │   ├── PaginaEstudos.tsx
    │   ├── PaginaHistoricoEstudos.tsx
    │   ├── PaginaRevisaoSemanal.tsx
    │   ├── PaginaConfiguracoes.tsx
    │   └── PaginaNaoEncontrada.tsx  (cada uma com seu .module.css)
    ├── utilitarios/
    │   ├── datas.ts                 datas ISO locais, início de semana, intervalos
    │   ├── formatacao.ts            duração, data por extenso, horário
    │   ├── juntarClasses.ts
    │   └── foco.ts
    └── estilos/
        ├── tokens.css               cores, espaçamento, tipografia, raios, sombras, z-index
        ├── temas.css                valores dos tokens para claro e escuro
        └── global.css               reset, elementos HTML e poucas classes utilitárias
```

### Responsabilidade de cada pasta

| Pasta | Responsabilidade | Não pode |
|---|---|---|
| `rotas/` | Caminhos e tabela de rotas | Conter regra de negócio |
| `configuracoes/` | Ambiente, constantes da aplicação e navegação | Importar componentes |
| `api/` | Cliente HTTP, erros e URLs da API | Conhecer telas |
| `modelos/` | Tipos dos DTOs, enumerações, rótulos e cores | Ter lógica |
| `regras/` | Regras de negócio puras e testadas | Usar React ou HTTP |
| `servicos/` | Uma função por operação da API | Usar React |
| `dados/simulacao/` | Imitar a API enquanto ela não existe | Ser importada fora de `clienteHttp` |
| `provedores/` | Estado que sobrevive à troca de página | Guardar listas do domínio |
| `ganchos/` | Lógica de React reutilizável | Chamar `clienteHttp` direto |
| `layouts/` | Casca comum das páginas | Buscar dados de uma página |
| `componentes/` | Peças de interface reutilizáveis | Chamar `clienteHttp` |
| `paginas/` | Montar cada rota e orquestrar componentes e serviços | Ser importada por outra página |
| `utilitarios/` | Funções auxiliares genéricas, sem domínio | Conhecer tarefas ou estudos |
| `estilos/` | Tokens, temas e estilos globais | Conter estilos de componente |

A diferença entre `regras/` e `utilitarios/`: `utilitarios/datas.ts` sabe somar dias a uma data;
`regras/prazo.ts` sabe quando uma tarefa está atrasada.

Importações usam o apelido `@/` para `src/`, como no PrismaWeb.

---

## 3. Navegação

### Rotas

| Caminho | Página | Parâmetros de URL |
|---|---|---|
| `/` | Dashboard (página inicial) | `periodo=7\|30` |
| `/calendario` | Calendário | `mes=2026-09`, `dia=2026-09-22` |
| `/tarefas` | Tarefas | `visao=todas\|sem-data\|atrasadas`, filtros, `pagina` |
| `/estudos` | Estudos (cronômetro, atividades e metas) | `atividade=3` |
| `/estudos/historico` | Histórico de estudos | `dataInicial`, `dataFinal`, `atividade` |
| `/revisao` | Revisão semanal | `semana=2026-09-20` |
| `/configuracoes` | Configurações | `secao=aparencia\|pomodoro\|categorias` |
| qualquer outro | Página não encontrada | — |

O mês, o dia selecionado, os filtros e a semana vão para a URL. Assim o botão Voltar do navegador
funciona, e recarregar a página mantém o que a pessoa estava vendo.

As páginas são carregadas sob demanda (`React.lazy`): abrir o Dashboard não baixa o código do
Histórico. Em produção, o Nginx redireciona qualquer caminho para `index.html`
(`try_files $uri /index.html`), como no PrismaWeb.

### Sidebar

```text
Orbit
────────────────
Dashboard
Planejamento
   Calendário
   Tarefas
Estudos
   Cronômetro
   Histórico
Acompanhamento
   Revisão semanal
────────────────
Configurações
Recolher menu
```

### Cabeçalho

Botão de menu e marca (só abaixo de 1100px) · data de hoje · busca que abre a paleta (`Ctrl+K`) ·
**mini cronômetro** (visível sempre que houver sessão em andamento; clicar leva a `/estudos`) ·
botão "Nova tarefa" · troca de tema.

### Comportamento por largura

Segue o PrismaWeb:

| Largura | Sidebar | Conteúdo |
|---|---|---|
| ≥ 1100px | Fixa à esquerda; pode ser recolhida só com ícones (preferência salva) | Colunas completas |
| 768–1099px | Vira **gaveta**: fica escondida, abre pelo botão de menu com fundo escurecido; fecha com `Esc`, clique fora ou ao navegar | Duas colunas onde couber |
| < 768px | Mesma gaveta | Uma coluna; espaçamentos menores |

A gaveta prende o foco enquanto aberta e o devolve ao botão de menu ao fechar.

### Formulário de tarefa

A criação e a edição de tarefa acontecem num **modal global**, aberto por
`useFormularioTarefa().abrir({ tarefa?, dataPadrao? })` de qualquer lugar: cabeçalho, Dashboard,
agenda do dia, lista de tarefas e paleta de comandos. No celular o modal ocupa a tela inteira. Não
há rota própria para o formulário.

---

## 4. Páginas

### Dashboard — `/`

- **Objetivo:** responder "o que eu tenho para hoje e como está minha semana".
- **Informações:** tarefas de hoje (por horário e prioridade); contadores de concluídas,
  pendentes, atrasadas e urgentes; sequência de dias; tarefas concluídas por dia; minutos de
  estudo por dia; distribuição por prioridade; mapa de calor de estudo; progresso das metas da
  semana; eventos recentes; atalho para a revisão semanal.
- **Componentes:** `CabecalhoPagina`, `ResumoIndicadores` (com `IndicadorNumerico` e a
  sequência), `TarefasDeHoje` (com `ItemTarefa`), `ProximasAtividades` (com `CargaSemana`),
  `PrioridadesEmAberto`, `PainelProdutividade` (com `GraficoBarras` e o período 7/30 dias),
  `ListaEventosRecentes`, `MapaCalorEstudo`, `ProgressoMetas`. Detalhes na seção 16.
- **Ações:** concluir ou iniciar tarefa, abrir tarefa, nova tarefa, "mover todas as atrasadas para
  hoje", trocar período, ir para a revisão semanal.
- **Dados:** `buscarResumoDashboard`, `buscarSequencia`, `buscarTarefas({ data: hoje })`,
  `buscarTarefas({ prazo: ATRASADA })`, `buscarTarefas` dos próximos 7 dias,
  `buscarResumoCalendario` da semana, `buscarMapaCalor`, `buscarProgressoSemanal`.

### Calendário — `/calendario`

- **Objetivo:** planejar e consultar a agenda pelo mês.
- **Informações:** grade do mês com marcadores de tarefas por dia (cor da prioridade mais alta e
  quantidade); agenda do dia selecionado.
- **Componentes:** `NavegacaoCalendario` (mês anterior/próximo, seletor de mês e ano, "Hoje"),
  `GradeMes`, `CelulaDia`, `AgendaDia` (painel lateral ou folha inferior), `ItemTarefa`.
- **Ações:** navegar entre meses e anos, voltar para hoje, selecionar dia, nova tarefa na data
  selecionada, abrir, editar e concluir tarefa.
- **Dados:** `buscarResumoCalendario({ dataInicial, dataFinal })` para as seis semanas visíveis,
  `buscarTarefas({ data })` para a agenda do dia.

### Tarefas — `/tarefas`

- **Objetivo:** encontrar, filtrar e manter tarefas em lista.
- **Informações:** lista paginada; visões rápidas **Todas**, **Sem data** e **Atrasadas**; filtros.
- **Componentes:** `BarraFiltrosTarefas`, `ListaTarefas`, `ItemTarefa`, `Paginacao`,
  `EstadoVazio`.
- **Ações:** filtrar, buscar por texto, criar, editar, alterar situação, cancelar, excluir,
  reagendar atrasadas em lote.
- **Dados:** `buscarTarefas(filtros)`.

### Estudos — `/estudos`

- **Objetivo:** estudar com o cronômetro e acompanhar as metas.
- **Informações:** cronômetro (modo livre ou Pomodoro), atividade selecionada, progresso da meta
  semanal de cada atividade, sessões de hoje.
- **Componentes:** `Cronometro`, `SeletorModoCronometro`, `SeletorAtividade`,
  `ListaAtividades`, `FormularioAtividade` (modal), `FormularioSessao` (modal, ao finalizar e
  para sessão manual), `ProgressoMetas`, `ListaSessoes`.
- **Ações:** iniciar, pausar, continuar, finalizar e salvar sessão; descartar sessão; lançar
  sessão manual; criar, editar e arquivar atividade; definir meta.
- **Dados:** `buscarAtividades`, `buscarProgressoSemanal`, `buscarSessoes({ data: hoje })`.

### Histórico de estudos — `/estudos/historico`

- **Objetivo:** ver e corrigir o tempo estudado.
- **Informações:** total do período, minutos por atividade, minutos por dia, lista de sessões.
- **Componentes:** `SeletorIntervalo`, `GraficoBarras`, `GraficoRosca`, `ListaSessoes`,
  `Paginacao`, `FormularioSessao`.
- **Ações:** filtrar por período e atividade; editar e excluir sessão; lançar sessão manual.
- **Dados:** `buscarSessoes(filtros)`, `buscarResumoEstudos(filtros)`.

### Revisão semanal — `/revisao`

- **Objetivo:** olhar a semana que passou e decidir o que fazer com o que ficou para trás.
- **Informações:** concluídas (e quantas com atraso), atrasadas, não realizadas, canceladas,
  horas por atividade, metas batidas, comparação com a semana anterior.
- **Componentes:** `NavegacaoSemana`, `IndicadorNumerico`, `ListaTarefas`, `GraficoBarras`,
  `ProgressoMetas`.
- **Ações:** navegar entre semanas, reagendar atrasadas, abrir tarefa.
- **Dados:** `buscarRevisaoSemanal({ inicioSemana })`.

### Configurações — `/configuracoes`

- **Objetivo:** ajustar a aplicação.
- **Seções:** Aparência (tema), Pomodoro (durações e ciclos), Categorias (criar, editar, excluir).
- **Dados:** `buscarCategorias`; tema e Pomodoro vêm do `localStorage`.

As **atividades de estudo** são gerenciadas na página Estudos, junto das metas, porque é lá que a
pessoa as usa.

---

## 5. Componentes reutilizáveis

Antes de criar cada um, confira o equivalente no PrismaWeb (`src/components/ui`): o objetivo é a
mesma qualidade e o mesmo comportamento, adaptados ao Orbit, e não uma cópia.

### `componentes/ui/` — genéricos

| Componente | Responsabilidade |
|---|---|
| `Botao` | Variantes primária, secundária, fantasma e perigo; tamanhos; ícone; estado carregando |
| `CampoTexto`, `AreaTexto` | Label, ajuda, erro associado por `aria-describedby` |
| `CampoSelecao` | Select estilizado |
| `SeletorData`, `CampoHorario` | Data e horário com o mesmo visual dos demais campos |
| `Interruptor` | Liga/desliga (dia inteiro, tarefa recorrente) |
| `GrupoOpcoes` | Botões segmentados (período 7/30, modo livre/Pomodoro, dias da semana) |
| `Modal` | Foco preso, `Esc`, clique fora, rolagem travada, devolução de foco; tela cheia no celular |
| `DialogoConfirmacao` | Confirmação de ações destrutivas |
| `Painel` | Contêiner com cabeçalho, corpo e ação (o "card") |
| `Selo` | Rótulo curto com tom (situação, prazo) |
| `BarraProgresso` | Metas |
| `Esqueleto`, `BlocoCarregando`, `EstadoVazio`, `EstadoErro` | Estados de carregamento, vazio e erro |
| `Notificacao` | Toast, com ação opcional ("Desfazer") |
| `Paginacao` | Navegação entre páginas de uma lista |

### `componentes/layout/`

`MenuLateral`, `Cabecalho`, `CabecalhoPagina`, `MiniCronometro`, `PaletaComandos`,
`AvisoConexao` (faixa quando a API está fora), `SeletorPeriodo`.

### `componentes/tarefas/`

| Componente | Responsabilidade |
|---|---|
| `ItemTarefa` | Uma linha de tarefa: concluir, título, horário, categoria, prioridade, prazo, recorrência |
| `ListaTarefas` | Lista com agrupamento opcional (por dia ou por situação) e estados |
| `IndicadorPrioridade` | Prioridade com ícone e texto, nunca só cor |
| `FormularioTarefa` | Criar e editar, incluindo a recorrência |
| `CamposRecorrencia` | Frequência, dias da semana, término |
| `EscolhaEscopoAlteracao` | "Só esta" ou "esta e as próximas" |
| `BarraFiltrosTarefas` | Filtros da página Tarefas |

### `componentes/calendario/`

`NavegacaoCalendario`, `GradeMes`, `CelulaDia`, `AgendaDia`.

### `componentes/estudos/`

`Cronometro`, `SeletorAtividade`, `ListaAtividades`, `FormularioAtividade`, `FormularioSessao`,
`ListaSessoes`, `ProgressoMetas`.

### `componentes/dashboard/`

`ResumoIndicadores`, `IndicadorNumerico`, `TarefasDeHoje`, `ProximasAtividades`, `CargaSemana`,
`PrioridadesEmAberto`, `PainelProdutividade`, `MapaCalorEstudo` (mesmo desenho do
`CalendarioGastos` do PrismaWeb), `ListaEventosRecentes`.

### `componentes/graficos/`

`GraficoBarras` (Recharts, com a dica embutida e uma tabela equivalente para leitores de tela).
`GraficoRosca` fica para quando alguma tela precisar dele. As cores **não** passam por JavaScript:
o CSS do componente pinta os elementos do Recharts com os tokens (`--grafico-1`,
`--grafico-grade`, `--texto-terciario`), então o gráfico troca de tema junto com o resto da página.
O `usePaletaGrafico` previsto foi descartado: lendo `getComputedStyle` durante a renderização, ele
pegava as cores do tema anterior, porque o `data-tema` só muda no efeito do `ProvedorTema`, depois
dos filhos. O Recharts fica num chunk próprio (`graficos`), fora do código das páginas.

---

## 6. Modelos de dados

Convenções: nomes em português; datas como texto ISO (`"2026-09-22"`); horários como `"HH:mm"`;
instantes como ISO 8601 com fuso (`"2026-09-22T19:00:00-03:00"`); durações em **segundos**;
enumerações em MAIÚSCULAS, exatamente como o Spring Boot serializa um `enum` Java.

### Enumerações (`modelos/enumeracoes.ts`)

```typescript
export type Prioridade = 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE';

export type Situacao = 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA';

export type Prazo =
  | 'SEM_DATA'
  | 'NO_PRAZO'
  | 'ATRASADA'
  | 'NAO_REALIZADA'
  | 'CONCLUIDA_NO_PRAZO'
  | 'CONCLUIDA_COM_ATRASO';

export type Frequencia = 'DIARIA' | 'DIAS_DA_SEMANA' | 'SEMANAL' | 'MENSAL' | 'ANUAL';

export type DiaSemana = 'DOMINGO' | 'SEGUNDA' | 'TERCA' | 'QUARTA' | 'QUINTA' | 'SEXTA' | 'SABADO';

export type EscopoAlteracao = 'SOMENTE_ESTA' | 'ESTA_E_PROXIMAS';

export type ModoCronometro = 'LIVRE' | 'POMODORO';

export type OrigemSessao = 'CRONOMETRO' | 'MANUAL';

export type Cor = 'AZUL' | 'VERDE' | 'AMARELO' | 'LARANJA' | 'VERMELHO' | 'ROSA' | 'ROXO' | 'CIANO' | 'CINZA';
```

`Situacao` é o que a pessoa escolhe e o backend grava. `Prazo` é **calculado pelo backend** a cada
consulta (decisão 1, regra R4 e D3) e nunca é enviado pelo frontend. As cores são guardadas pelo
nome, não em hexadecimal: cada nome tem um valor para o tema claro e outro para o escuro.

### Tarefa (`modelos/tarefas.ts`)

```typescript
export interface ResumoCategoriaDTO {
  id: number;
  nome: string;
  cor: Cor;
}

export interface ResumoAtividadeDTO {
  id: number;
  nome: string;
  cor: Cor;
}

export interface RecorrenciaDTO {
  frequencia: Frequencia;
  diasSemana: DiaSemana[] | null;
  dataFim: string | null;
}

export interface TarefaDTO {
  id: number;
  titulo: string;
  descricao: string | null;
  data: string | null;
  diaInteiro: boolean;
  horarioInicio: string | null;
  horarioFim: string | null;
  prioridade: Prioridade;
  situacao: Situacao;
  prazo: Prazo;
  categoria: ResumoCategoriaDTO | null;
  atividade: ResumoAtividadeDTO | null;
  lembreteMinutosAntes: 0 | 5 | 15 | 30 | 60 | null;
  serieId: number | null;
  recorrencia: RecorrenciaDTO | null;
  dataConclusao: string | null;
  criadoEm: string;
  atualizadoEm: string;
}

export interface TarefaEnvioDTO {
  titulo: string;
  descricao: string | null;
  data: string | null;
  diaInteiro: boolean;
  horarioInicio: string | null;
  horarioFim: string | null;
  prioridade: Prioridade;
  situacao: Situacao;
  categoriaId: number | null;
  atividadeId: number | null;
  lembreteMinutosAntes: 0 | 5 | 15 | 30 | 60 | null;
  recorrencia: RecorrenciaDTO | null;
}
```

Exemplo:

```typescript
const tarefa: TarefaDTO = {
  id: 42,
  titulo: 'Estudar Banco de Dados',
  descricao: 'Revisar relacionamentos',
  data: '2026-09-22',
  diaInteiro: false,
  horarioInicio: '19:00',
  horarioFim: '20:30',
  prioridade: 'ALTA',
  situacao: 'PENDENTE',
  prazo: 'NO_PRAZO',
  categoria: { id: 2, nome: 'Faculdade', cor: 'ROXO' },
  atividade: { id: 1, nome: 'Banco de Dados', cor: 'AZUL' },
  lembreteMinutosAntes: 15,
  serieId: null,
  recorrencia: null,
  dataConclusao: null,
  criadoEm: '2026-09-21T21:10:00-03:00',
  atualizadoEm: '2026-09-21T21:10:00-03:00',
};
```

| Campo | Regra |
|---|---|
| `titulo` | Obrigatório, até 120 caracteres |
| `descricao` | Até 2000 caracteres |
| `data` | `null` = tarefa sem data (decisão 2) |
| `diaInteiro` | Se `true`, os horários são `null` |
| `horarioInicio`, `horarioFim` | Exigem data; fim exige início e precisa ser depois dele (decisão 3) |
| `prioridade` | Padrão `MEDIA` |
| `situacao` | Padrão `PENDENTE` |
| `prazo` | Somente leitura, calculado pelo backend |
| `categoria`, `atividade` | No envio, vão só os ids (decisões 9 e 10) |
| `lembreteMinutosAntes` | `0` = no horário; exige data e horário de início |
| `serieId` | Liga as ocorrências da mesma série recorrente (D2) |
| `recorrencia` | A regra da série; exige data (é a data da primeira ocorrência) |
| `dataConclusao` | Preenchida pelo backend ao concluir; limpa ao reabrir |

`diasSemana` só existe em `DIAS_DA_SEMANA`. Em `MENSAL`, o dia vem da data inicial; em meses sem
aquele dia (31 em setembro), a ocorrência cai no último dia do mês.

### Categoria

```typescript
export interface CategoriaDTO {
  id: number;
  nome: string;
  cor: Cor;
}
```

Nome obrigatório e único. Excluir uma categoria deixa as tarefas dela sem categoria.

### AtividadeEstudo (`modelos/estudos.ts`)

```typescript
export interface AtividadeEstudoDTO {
  id: number;
  nome: string;
  cor: Cor;
  metaSemanalMinutos: number | null;
  arquivada: boolean;
}
```

Nome obrigatório e único entre as não arquivadas. `metaSemanalMinutos` é opcional (regra M1). Uma
atividade com sessões é **arquivada**, não excluída, para não apagar o histórico; sem sessões,
pode ser excluída.

### SessaoEstudo

```typescript
export interface SessaoEstudoDTO {
  id: number;
  atividade: ResumoAtividadeDTO;
  tarefa: { id: number; titulo: string } | null;
  modo: ModoCronometro;
  origem: OrigemSessao;
  inicio: string;
  fim: string;
  duracaoSegundos: number;
  ciclosConcluidos: number | null;
  observacao: string | null;
}
```

`duracaoSegundos` é o tempo **efetivo**, sem pausas e, no Pomodoro, só o tempo de foco. Por isso
ele pode ser menor que `fim − inicio`. Na sessão manual (decisão 13), a pessoa informa atividade,
data, horário de início e duração, e o `fim` é calculado. Uma sessão por vez.

### Sessão em andamento (só no frontend, D4)

Guardada no `localStorage` para sobreviver a recarregamentos (decisão 12). Não guarda um contador
que "anda": guarda **marcos de tempo**. O tempo decorrido é sempre recalculado a partir deles, então
não se perde nada se a aba ficar em segundo plano ou a página recarregar.

```typescript
export interface SessaoEmAndamento {
  atividadeId: number;
  tarefaId: number | null;
  modo: ModoCronometro;
  iniciadaEm: string;
  estado: 'RODANDO' | 'PAUSADA';
  segundosAcumulados: number;
  retomadaEm: string | null;
  pomodoro: {
    fase: 'FOCO' | 'PAUSA_CURTA' | 'PAUSA_LONGA';
    ciclo: number;
    faseIniciadaEm: string;
    aguardandoConfirmacao: boolean;
  } | null;
}
```

### DTOs de leitura agregada (`modelos/painel.ts`)

```typescript
export interface ResumoDashboardDTO {
  dataInicial: string;
  dataFinal: string;
  inicioSemana: string;
  fimSemana: string;
  contagens: {
    concluidas: number;
    pendentes: number;
    emAndamento: number;
    atrasadas: number;
    urgentes: number;
    hoje: number;
  };
  concluidasPorDia: { data: string; quantidade: number }[];
  minutosEstudoPorDia: { data: string; minutos: number }[];
  distribuicaoPrioridade: { prioridade: Prioridade; quantidade: number }[];
  minutosPorAtividade: { atividade: ResumoAtividadeDTO; minutos: number }[];
  eventosRecentes: EventoRecenteDTO[];
}

export interface EventoRecenteDTO {
  tipo: 'TAREFA_CRIADA' | 'TAREFA_CONCLUIDA' | 'TAREFA_CANCELADA' | 'SESSAO_SALVA';
  descricao: string;
  ocorridoEm: string;
  referenciaId: number;
}

export interface MapaCalorDTO {
  dias: { data: string; minutos: number }[];
  atividadeMaisEstudada: (ResumoAtividadeDTO & { minutos: number }) | null;
}

export interface SequenciaDTO {
  atual: number;
  recorde: number;
  contaHoje: boolean;
}

export interface ProgressoMetaDTO {
  atividade: ResumoAtividadeDTO;
  metaMinutos: number;
  minutosRealizados: number;
}

export interface DiaCalendarioDTO {
  data: string;
  quantidade: number;
  maiorPrioridade: Prioridade | null;
  atrasadas: number;
  concluidas: number;
}

export interface PaginaDTO<T> {
  itens: T[];
  pagina: number;
  tamanho: number;
  totalItens: number;
  totalPaginas: number;
}
```

"Eventos recentes" usa a palavra *evento*, não *atividade*, para não confundir com
`AtividadeEstudoDTO`.

---

## 7. Serviços

Mesmo formato do PrismaWeb: cada serviço é um objeto com uma função por operação, uma camada fina
sobre o `clienteHttp`. Toda função aceita um `signal` opcional, que o `useDadosAssincronos`
aborta quando a página é desmontada.

```typescript
export const servicoTarefas = {
  buscarTarefas(filtros: FiltrosTarefas, signal?: AbortSignal): Promise<PaginaDTO<TarefaDTO>> {
    return clienteHttp.get<PaginaDTO<TarefaDTO>>(rotasApi.tarefas.lista, { consulta: filtros, signal });
  },

  concluirTarefa(id: number, signal?: AbortSignal): Promise<TarefaDTO> {
    return clienteHttp.patch<TarefaDTO>(rotasApi.tarefas.situacao(id), { situacao: 'CONCLUIDA' }, { signal });
  },
};
```

| Serviço | Funções |
|---|---|
| `servicoTarefas` | `buscarTarefas`, `buscarTarefa`, `criarTarefa`, `atualizarTarefa(id, dados, escopo)`, `alterarSituacao`, `concluirTarefa`, `reabrirTarefa`, `cancelarTarefa`, `excluirTarefa(id, escopo)`, `reagendarTarefas`, `buscarResumoCalendario` |
| `servicoCategorias` | `buscarCategorias`, `criarCategoria`, `atualizarCategoria`, `excluirCategoria` |
| `servicoAtividades` | `buscarAtividades`, `criarAtividade`, `atualizarAtividade`, `arquivarAtividade`, `desarquivarAtividade`, `excluirAtividade` |
| `servicoSessoes` | `buscarSessoes`, `criarSessao`, `atualizarSessao`, `excluirSessao`, `buscarResumoEstudos`, `buscarProgressoSemanal`, `buscarMapaCalor` |
| `servicoDashboard` | `buscarResumoDashboard`, `buscarSequencia` |
| `servicoRevisao` | `buscarRevisaoSemanal` |

O **cronômetro** não é um serviço: é regra (`regras/cronometro.ts`, `regras/pomodoro.ts`) mais
estado (`ProvedorCronometro`). Ele só fala com a API ao salvar, por `servicoSessoes.criarSessao`
(D4).

---

## 8. Contrato REST previsto

Base: `/api`. JSON em todas as respostas.

### Tarefas

| Operação | Método e caminho |
|---|---|
| Listar e filtrar (paginado) | `GET /api/tarefas` |
| Buscar uma | `GET /api/tarefas/{id}` |
| Criar (simples ou recorrente) | `POST /api/tarefas` |
| Atualizar | `PUT /api/tarefas/{id}?escopo=SOMENTE_ESTA\|ESTA_E_PROXIMAS` |
| Alterar situação | `PATCH /api/tarefas/{id}/situacao` com `{ situacao }` |
| Excluir | `DELETE /api/tarefas/{id}?escopo=…` |
| Reagendar em lote (e desfazer) | `POST /api/tarefas/reagendamentos` com `{ itens: [{ id, data }] }` |
| Resumo do calendário | `GET /api/tarefas/resumo-calendario?dataInicial&dataFinal` |

O mesmo endpoint de reagendamento serve para mover e para desfazer: o frontend guarda as datas
anteriores e, se a pessoa clicar em "Desfazer", envia as datas antigas de volta.

### Recorrência no backend (D2)

Cada ocorrência é uma **tarefa de verdade** no banco, ligada às irmãs por `serieId`:

- Criar uma tarefa com `recorrencia` cria a série e gera as ocorrências dos próximos 12 meses (ou
  até `dataFim`, se vier antes).
- O backend estende a janela quando ela fica a menos de 3 meses do fim, para séries sem término.
- `SOMENTE_ESTA` altera só aquela linha, que continua na série.
- `ESTA_E_PROXIMAS` altera a linha e as seguintes (`WHERE serie_id = ? AND data >= ?`). Se a
  regra de recorrência mudar, o backend apaga as ocorrências futuras **ainda pendentes** e gera de
  novo; as concluídas e canceladas são preservadas.
- Excluir com `ESTA_E_PROXIMAS` apaga as futuras pendentes e encerra a série na véspera.

### Categorias e atividades

| Operação | Método e caminho |
|---|---|
| CRUD de categorias | `GET/POST /api/categorias`, `PUT/DELETE /api/categorias/{id}` |
| CRUD de atividades | `GET/POST /api/atividades`, `PUT/DELETE /api/atividades/{id}` |
| Arquivar / desarquivar | `PATCH /api/atividades/{id}/arquivamento` com `{ arquivada }` |

### Estudos

| Operação | Método e caminho |
|---|---|
| Listar sessões (paginado) | `GET /api/sessoes?dataInicial&dataFinal&atividadeId&pagina&tamanho` |
| Salvar sessão (cronômetro ou manual) | `POST /api/sessoes` |
| Corrigir / excluir sessão | `PUT/DELETE /api/sessoes/{id}` |
| Resumo por período | `GET /api/estudos/resumo?dataInicial&dataFinal&atividadeId` |
| Progresso das metas | `GET /api/estudos/progresso-semanal?inicioSemana` |
| Mapa de calor | `GET /api/estudos/mapa-calor?dataInicial&dataFinal` |

### Dashboard e revisão

| Operação | Método e caminho |
|---|---|
| Resumo | `GET /api/dashboard/resumo?dataInicial&dataFinal` |
| Sequência de dias | `GET /api/dashboard/sequencia?data` |
| Revisão semanal | `GET /api/revisao-semanal?inicioSemana` |

As "tarefas do dia" não têm endpoint próprio: são `GET /api/tarefas?data=2026-09-22`.

---

## 9. Filtros e consultas

Só os filtros que alguma tela usa.

`GET /api/tarefas`:

| Parâmetro | Uso |
|---|---|
| `data` | Dashboard (hoje) e agenda do dia |
| `dataInicial`, `dataFinal` | Tarefas por período |
| `semData=true` | Visão "Sem data" |
| `situacao` (repetível) | Filtro da página Tarefas |
| `prioridade` (repetível) | Filtro da página Tarefas; `URGENTE` alimenta "urgentes" |
| `prazo` | `ATRASADA` na visão "Atrasadas" e no reagendamento em lote |
| `categoriaId` | Filtro da página Tarefas |
| `busca` | Texto no título e na descrição; paleta de comandos |
| `ordenacao` | `DATA` (padrão), `PRIORIDADE`, `ATUALIZACAO` |
| `pagina`, `tamanho` | Paginação (padrão 20) |

`GET /api/sessoes`: `dataInicial`, `dataFinal`, `atividadeId`, `pagina`, `tamanho`.

Consultas prontas, montadas pelo frontend com os filtros acima:

| Consulta | Filtros |
|---|---|
| Tarefas de hoje | `data=hoje` |
| Atrasadas | `prazo=ATRASADA` |
| Urgentes | `prioridade=URGENTE&situacao=PENDENTE&situacao=EM_ANDAMENTO` |
| Concluídas | `situacao=CONCLUIDA` + período |
| Sem data | `semData=true` |

---

## 10. Fluxo de dados

### Leitura (exemplo: agenda do dia)

```text
Clique no dia 22
  → PaginaCalendario grava ?dia=2026-09-22 na URL (useParametrosUrl)
  → useDadosAssincronos chama servicoTarefas.buscarTarefas({ data }, signal)
  → clienteHttp monta GET /api/tarefas?data=2026-09-22 e envia pelo transporte configurado
  → transporte fetch (API) ou simulado (dados/simulacao)
  → a página recebe { dados, carregando, erro, recarregar }
  → esqueleto → lista, ou EstadoVazio, ou EstadoErro com "Tentar de novo"
  → AgendaDia recebe as tarefas por props e desenha ItemTarefa
```

### Escrita (exemplo: concluir tarefa)

```text
Clique em "Concluir" no ItemTarefa
  → componente chama a prop aoConcluir recebida da página
  → página chama servicoTarefas.concluirTarefa(id)
  → o item mostra estado de envio
  → sucesso: toast "Tarefa concluída." e notificarAlteracao('tarefas')
  → toda tela montada que depende de tarefas busca de novo
  → erro: o item volta ao estado anterior e o toast explica o problema
```

Não há atualização otimista na primeira versão: a interface só mostra a tarefa como concluída
depois que a API confirma. É mais simples e nunca mostra algo que não foi salvo.

---

## 11. Dados simulados e preparação para o backend

### Como a troca funciona

O `clienteHttp` recebe as requisições dos serviços e as entrega a um **transporte**:

```text
servicoTarefas → clienteHttp → transporteFetch     → Spring Boot
                            ↘ transporteSimulado  → dados/simulacao
```

A escolha é feita por uma variável de ambiente:

```text
VITE_FONTE_DADOS=simulada     desenvolvimento sem backend
VITE_FONTE_DADOS=api          com o Spring Boot rodando
VITE_URL_API=http://localhost:8080/api
```

O transporte simulado responde **às mesmas rotas, com os mesmos formatos**, de `api/rotasApi.ts`.
Ele guarda os dados no `localStorage` (prefixo `orbit:simulacao:`), então o que for criado continua
lá depois de recarregar. Também simula latência (200–500ms) e pode simular falhas, para testar os
estados de erro. O simulador aplica as mesmas regras que o backend terá (prazo, recorrência,
sequência), usando as funções de `regras/`.

O transporte simulado é importado de forma dinâmica: com `VITE_FONTE_DADOS=api`, ele nem entra no
pacote de produção.

Quando o backend existir, a troca é mudar `VITE_FONTE_DADOS` para `api`. Nenhuma página,
componente ou serviço muda. Depois que todas as rotas estiverem no Spring Boot, a pasta
`dados/simulacao/` pode ser apagada inteira.

As sementes são geradas **em relação à data de hoje**, para que sempre haja tarefas de hoje,
atrasadas e da semana, e sessões nos últimos meses para o mapa de calor.

### Conexão com o Spring Boot

| Assunto | Combinado |
|---|---|
| URL base | `VITE_URL_API` no build, sobrescrita por `window.__ORBIT_CONFIG__.urlApi` em produção (mesmo modelo do PrismaWeb) |
| CORS | O backend libera `http://localhost:5173` em desenvolvimento |
| Fuso | O frontend envia `X-Fuso-Horario: America/Sao_Paulo` (fuso do navegador). O backend usa esse fuso para decidir "hoje", "atrasada" e a sequência |
| Datas | `LocalDate` ↔ `"2026-09-22"`, `LocalTime` ↔ `"19:00"`, `OffsetDateTime` ↔ ISO com fuso |
| Enumerações | `enum` Java com os mesmos nomes de `modelos/enumeracoes.ts` |
| Paginação | `{ itens, pagina, tamanho, totalItens, totalPaginas }` (fácil de montar a partir de um `Page` do Spring); `pagina` começa em 0 |
| Erros | `ProblemDetail` (RFC 9457) do Spring, com uma lista `erros: [{ campo, mensagem }]` para validação |
| Futuro login | Todas as requisições passam pelo `clienteHttp`; adicionar `Authorization` depois muda só esse arquivo |

Enquanto o backend estiver sendo construído, um `API_CONTRACT.md` na raiz pode listar o que ainda
falta implementar, como no PrismaWeb.

---

## 12. Estados da aplicação

### Tratamento de erros

O `clienteHttp` transforma toda falha num `ErroApi` com um `tipo`:

| Tipo | Quando | O que a interface faz |
|---|---|---|
| `REDE` | API fora do ar ou sem conexão | Estado de erro na região + faixa global `AvisoConexao` |
| `TEMPO_ESGOTADO` | Mais de 15 segundos sem resposta | Estado de erro com "Tentar de novo" |
| `VALIDACAO` (400/422) | Dados inválidos | Mensagem em cada campo do formulário |
| `NAO_ENCONTRADO` (404) | Registro não existe mais | Toast e atualização da lista |
| `CONFLITO` (409) | Ex.: nome de categoria repetido | Mensagem no campo |
| `SERVIDOR` (5xx) | Erro inesperado no backend | Estado de erro com "Tentar de novo" |
| `CANCELADO` | Página desmontada durante a requisição | Nada (é ignorado em silêncio) |

### Estados de uma região de dados

| Estado | Comportamento | Exemplo de texto |
|---|---|---|
| Carregando | Esqueleto no formato do conteúdo, só depois de 300ms | — |
| Vazio | Explica e oferece a ação que resolve | "Nenhuma tarefa para hoje." + "Nova tarefa" |
| Erro | O que houve e como resolver, com botão | "Não foi possível carregar as tarefas. Verifique a conexão e tente de novo." |
| Sucesso de ação | Toast curto | "Tarefa criada." |

### API indisponível

- Na primeira falha de rede, `ProvedorConexao` marca a API como indisponível e aparece uma faixa
  discreta: "Sem conexão com o servidor. Algumas informações podem estar desatualizadas."
- Um teste leve de conexão a cada 30 segundos (e ao voltar o foco para a aba) tira a faixa sozinho.
- **O cronômetro não depende da API.** Ele continua contando mesmo com o servidor fora.
- Se salvar uma sessão falhar, ela **não é perdida**: fica guardada como pendente no
  `localStorage`, com o aviso "Sessão guardada neste navegador. Tente salvar de novo." e um botão.

---

## 13. Tema, responsividade e regras

### Tema

- Todas as cores são custom properties em `estilos/tokens.css`; `estilos/temas.css` define os
  valores em `:root[data-tema="claro"]` e `:root[data-tema="escuro"]`.
- Três modos: **Claro**, **Escuro** e **Sistema** (segue o sistema operacional e acompanha se ele
  mudar). O botão do cabeçalho alterna entre claro e escuro; a escolha "Sistema" fica em
  Configurações.
- `ProvedorTema` guarda a preferência em `localStorage` (`orbit:tema`) e escreve `data-tema` no
  `<html>`.
- Um script curto no `index.html` aplica o tema antes da primeira pintura, para não haver "piscada"
  do tema errado ao abrir.
- A troca de tema pelo botão é um esmaecimento cruzado da página inteira (View Transitions API),
  com 600ms e curva suave nas duas pontas. Por ser uma única animação composta, não pesa mesmo em
  telas com muitos elementos. Sem suporte, com a aba oculta ou com movimento reduzido, cai na
  transição de cores por CSS (`.trocando-tema`), com a mesma duração.
- Os gráficos do Recharts são pintados por CSS com os tokens, então acompanham a troca de tema.

### Responsividade

Pontos de quebra (os mesmos do PrismaWeb): **1100px** (sidebar vira gaveta), **768px** (layout
de celular) e **560px** (ajustes finos). Ficam em `configuracoes/aplicacao.ts` para uso em
TypeScript (`useConsultaMidia`) e repetidos nas media queries.

| Área | Estratégia |
|---|---|
| Sidebar | Fixa e recolhível no desktop; gaveta abaixo de 1100px |
| Calendário | Desktop: grade do mês + agenda em painel lateral. Tablet: grade + agenda abaixo. Celular: grade compacta com pontos por dia + agenda em folha inferior (decisão 5) |
| Cards | Grade com `auto-fill`/`minmax`, sem colunas fixas por largura |
| Formulários | Modal centrado no desktop; tela cheia no celular; campos em uma coluna abaixo de 768px |
| Gráficos | `ResponsiveContainer` do Recharts; menos rótulos no eixo em telas estreitas; dica ao tocar |
| Cronômetro | Grande e centralizado na página Estudos; mini cronômetro no cabeçalho; botões com 48px de alvo no celular |
| Listas | Itens em linha no desktop; informações secundárias quebram para uma segunda linha no celular |

### Regras de negócio que o frontend respeita

1. `Situacao` é escolhida pela pessoa; `Prazo` vem calculado e nunca é enviado.
2. **Quando fica atrasada (D3):** tarefa pendente ou em andamento com horário de fim fica atrasada
   depois do fim; sem horário de fim (só início, ou dia inteiro), quando o dia termina.
3. Tarefa `CONCLUIDA` tem `dataConclusao`; ao reabrir, `dataConclusao` é limpa. Concluída depois
   do momento em que ficaria atrasada = `CONCLUIDA_COM_ATRASO`.
4. Tarefa sem data não aparece no calendário nem nas tarefas de hoje; aparece em "Sem data".
5. Horários exigem data; fim exige início e precisa ser posterior a ele; "dia inteiro" apaga os horários.
6. Lembrete exige data e horário de início, e só dispara com o app aberto (decisão 17).
7. Recorrência exige data; alterar ou excluir uma ocorrência pergunta o escopo (R3).
8. Em tarefas recorrentes, só a ocorrência atrasada mais recente é `ATRASADA`; as anteriores não
   feitas são `NAO_REALIZADA` (R4).
9. Tarefas canceladas ficam fora das contagens de pendentes e atrasadas, mas aparecem no histórico
   e na revisão (decisão 16).
10. "Urgentes" = prioridade `URGENTE` com situação pendente ou em andamento.
11. Reagendar em lote muda só a data; horários, prioridade e situação continuam iguais.
12. Só existe uma sessão de estudo em andamento por vez.
13. Pausar nunca perde tempo: o tempo é sempre recalculado a partir dos marcos (decisão 12).
14. No Pomodoro, só o tempo de foco conta como estudo; ao fim de cada fase, a próxima começa
    **só com confirmação** (a pessoa pode estar longe do computador).
15. Uma sessão precisa de atividade e de pelo menos 1 minuto para ser salva.
16. A meta semanal usa semanas de domingo a sábado.
17. A sequência conta dias com sessão de estudo **ou** tarefa concluída (S1). Se hoje ainda não
    tem nenhuma das duas, a sequência que vem até ontem continua valendo; ela só quebra quando um
    dia termina vazio.

---

## 14. Decisões técnicas aprovadas

| # | Tema | Decisão |
|---|---|---|
| D1 | Framework | **React + TypeScript, igual ao PrismaWeb** (substitui o JavaScript puro da proposta inicial) |
| D2 | Recorrência no backend | **Cada ocorrência é uma tarefa no banco**, ligada por `serieId`, gerada numa janela de 12 meses |
| D3 | Quando fica atrasada | **Com horário de fim, depois do fim; sem horário de fim, quando o dia termina** |
| D4 | Sessão em andamento | **Só no navegador**; a API recebe a sessão pronta ao salvar |
| D5 | Gráficos | **Parecidos com o PrismaWeb**: Recharts, a mesma biblioteca dele, e mapa de calor próprio |

Decisões de baixo impacto seguidas sem objeção: rotas sem `#`; páginas sob demanda; CSS Modules;
lucide-react; Vitest só para `regras/`; paleta fixa de 9 cores; atividade com sessões é arquivada;
recorrência mensal no dia 31 cai no último dia do mês; fase do Pomodoro só avança com
confirmação; sessões com menos de 1 minuto não são salvas; a sequência só quebra quando um dia
termina vazio; sem atualização otimista na primeira versão.

## Status

Fase 02 aprovada. Fase 03 concluída. Fase 04 (Dashboard) concluída, aguardando aprovação.
Próxima fase: **Fase 05 — Calendário e gerenciamento de tarefas**.

---

## 15. Identidade visual e design system (Fase 03)

### Direção

O Orbit precisa transmitir **foco e calma**: é uma ferramenta aberta o dia inteiro, então a
interface fica quieta e deixa a cor para o que pede atenção (prioridade, atraso, ação principal).
Referências estudadas: Linear (densidade e hierarquia por peso tipográfico, cor usada com
parcimônia), Todoist e Things (lista de tarefas legível, selos curtos) e Sunsama (ritmo calmo).

| Elemento | Escolha | Diferença para o PrismaWeb |
|---|---|---|
| Cor de destaque | Azul-marinho (`#1f3b73` claro, `#8faae6` escuro) | Sóbrio, para não competir com o conteúdo; a prioridade média passou a usar ciano para não se confundir com ele |
| Neutros | Cinzas levemente azulados | — |
| Frase de efeito | "Organize o que move o seu dia." como título da tela de boas-vindas, no título da aba da página inicial e na descrição do site | — |
| Tipografia | Geist (interface) + Geist Mono (números e cronômetro), servidas pelo próprio app | Prisma usa Instrument Sans + Archivo pelo Google Fonts |
| Corpo de texto | 15px | Prisma usa 14px; aqui se lê título de tarefa o dia inteiro |
| Marca | Quadrado azul-marinho com um núcleo e um satélite em órbita | — |
| Botão principal | Azul-marinho sólido | Prisma usa preto que vira azul no hover |

### Tokens

Todos em `src/estilos/tokens.css` (escala) e `src/estilos/temas.css` (cores por tema). Nenhum valor
de cor, espaço, raio, sombra ou duração fica solto nos componentes.

| Grupo | Tokens |
|---|---|
| Superfícies | `--fundo`, `--superficie`, `--superficie-suave`, `--superficie-elevada`, `--superficie-invertida` |
| Bordas | `--borda`, `--borda-forte`, `--borda-controle` (3:1, para campos, caixas e interruptores) |
| Texto | `--texto`, `--texto-secundario`, `--texto-terciario` (todos ≥ 4,5:1), `--texto-desabilitado`, `--texto-invertido` |
| Estados | `--destaque`, `--sucesso`, `--aviso`, `--erro`, `--info`, cada um com `-suave` e, quando preciso, `-grafico` |
| Prioridade | `--prioridade-{baixa,media,alta,urgente}` e `-suave` |
| Paleta de categorias | `--cor-{azul,verde,amarelo,laranja,vermelho,rosa,roxo,ciano,cinza}` e `-suave` |
| Mapa de calor e gráficos | `--calor-0..4`, `--grafico-grade`, `--grafico-1..6`, `--carga-concluida`, `--carga-a-fazer` |
| Tipografia | `--tamanho-{xs,sm,base,md,lg,xl,2xl,destaque,cronometro}`, `--peso-*`, `--altura-linha-*` |
| Espaço | `--espaco-1..16` (base 4px) |
| Raio | `--raio-{xs,sm,md,lg,xl,pilula}` |
| Elevação | `--sombra-cartao`, `--sombra-controle`, `--sombra-flutuante`, `--sombra-sobreposicao`, `--anel-foco` |
| Movimento | `--duracao-{rapida,base,lenta}` (120/200/360ms), `--curva-{saida,entrada,mola}`, `--duracao-tema` (600ms) e `--curva-tema` para a troca de tema |
| Camadas | `--camada-{cabecalho,menu,sobreposicao,modal,flutuante,notificacao}` |

O contraste de todos os pares texto × fundo foi conferido nos dois temas (WCAG AA).

### Layout

- **Menu lateral** com a altura toda da tela (marca no topo), seções *Planejamento*, *Estudos* e
  *Acompanhamento*, e Configurações no rodapé. Acima de 1100px fica fixo e pode ser recolhido só
  com ícones; abaixo disso vira gaveta.
- **Cabeçalho** com a data de hoje e a troca de tema. A busca (`Ctrl+K`), o mini cronômetro e o
  botão "Nova tarefa" entram nas fases que os implementam.
- **Conteúdo** com largura máxima de 1320px e respiro lateral de 32px (20px no celular).

### Componentes base (`src/componentes/ui/`)

`Botao` (primário, secundário, terciário, perigo; `sm`/`md`; carregando; desabilitado),
`BotaoIcone`, `CampoTexto` (texto), `CampoNumero` (botões próprios de diminuir e aumentar, segurar para repetir, setas do teclado, limites, casas decimais e sufixo), `CampoBusca`, `AreaTexto`, `CampoSelecao` (lista própria,
com ícone, descrição, opção vazia e busca por digitação), `SeletorData` (calendário próprio com
visões de dias, meses e anos), `SeletorHorario` (colunas de hora e minuto), `Flutuante` (base dos
painéis que abrem junto de um campo), `CaixaSelecao`, `GrupoRadio`, `Interruptor`, `GrupoOpcoes`, `Selo`, `Painel` +
`CabecalhoPainel`, `Modal` (folha inferior no celular), `DialogoConfirmacao`, `Notificacao`
(com ação opcional, como "Desfazer"), `Esqueleto`, `EsqueletoLista`, `EsqueletoCartao`,
`IndicadorGiratorio`, `EstadoVazio`, `EstadoErro`. Selos de domínio em
`src/componentes/tarefas/SelosTarefa.tsx`: prioridade, situação, prazo e categoria.

**Nenhum seletor nativo do navegador é usado**: data, horário e listas abrem painéis próprios, com
o visual do Orbit nos dois temas e navegação completa por teclado (setas, Home/End, PageUp/PageDown
para mês, Shift+PageUp/PageDown para ano, Enter para escolher e Esc para fechar só o painel).

A **tela de boas-vindas** (`src/componentes/boasVindas/`) aparece sempre que o Orbit é aberto numa nova aba ou janela, antes da primeira tela. Recarregar a mesma aba não a mostra de novo: a marcação fica em `sessionStorage` (`orbit:boas-vindas-vista`). O catálogo tem um botão para vê-la de novo. Ao clicar em "Começar", os blocos saem em cascata e o logo e o nome "Orbit" viajam juntos até o menu lateral (no celular, só o logo vai para o cabeçalho) pela View Transitions API, com o mesmo tempo e a mesma curva, então ficam alinhados em todos os quadros. O nome é alinhado ao logo pela altura das maiúsculas (`text-box: trim-both cap alphabetic`), e não pela caixa da linha; sem suporte, com a aba oculta ou com movimento reduzido, a aplicação entra direto.

O catálogo com todos os componentes e estados fica em `/componentes`, **só no ambiente de
desenvolvimento**.

---

## 16. Dashboard (Fase 04)

### Composição

```text
Cabeçalho da página   saudação + o que falta hoje · atalho para a Revisão semanal
Resumo                Concluídas · Pendentes · Atrasadas · Urgentes · Sequência (uma faixa só)
Tarefas de hoje       grupo "Atrasadas" (com "Mover todas para hoje") + lista do dia, com progresso
Próximas atividades   carga da semana (tarefas por dia, concluídas × a fazer) + próximos 7 dias
Em aberto por prioridade
Produtividade         abas Tarefas concluídas / Tempo de estudo + gráfico por dia · período 7/30 dias
Atividade recente
Estudo por dia        mapa de calor dos últimos 6 meses (regra H1)
Metas da semana
```

No desktop, "Tarefas de hoje" ocupa 8 de 12 colunas e duas linhas, com "Próximas atividades" e
"Em aberto por prioridade" empilhados ao lado. Abaixo de 980px de conteúdo tudo vira uma coluna, na
ordem acima, que é a ordem de importância. A grade usa *container queries*, então responde à
largura real do conteúdo (com ou sem menu lateral), e não à da janela.

### O que cada número significa

| Indicador | Regra |
|---|---|
| Concluídas | Tarefas com `dataConclusao` na semana atual (domingo a sábado) |
| Pendentes | Pendentes + em andamento com data na semana atual e ainda no prazo; o contexto mostra quantas estão em andamento |
| Atrasadas | Todas com `prazo = ATRASADA`, de qualquer data |
| Urgentes | Prioridade `URGENTE`, pendente ou em andamento, com qualquer data ou sem data |
| Sequência | `SequenciaDTO` (regra S1 e regra 17) |
| Em aberto por prioridade | Pendentes + em andamento de qualquer data, por prioridade |
| Produtividade | Tarefas concluídas por dia (pela data de conclusão) e minutos de estudo por dia, no período escolhido |

O período 7/30 dias vale só para o painel de Produtividade (decisão 15) e fica na URL
(`/?periodo=30`). Os contadores do resumo são sempre da semana atual.

### Dados que o Dashboard espera da API

| Região | Chamada | Resposta |
|---|---|---|
| Resumo, Prioridades, Produtividade, Atividade recente | `GET /api/dashboard/resumo?dataInicial&dataFinal` | `ResumoDashboardDTO`. `contagens` usa a semana atual (informada em `inicioSemana`/`fimSemana`); as séries usam `dataInicial..dataFinal`, com um item por dia, inclusive os zerados; `distribuicaoPrioridade` traz as quatro prioridades; `eventosRecentes` traz os 6 mais recentes |
| Sequência | `GET /api/dashboard/sequencia?data` | `SequenciaDTO` |
| Tarefas de hoje | `GET /api/tarefas?data=hoje&ordenacao=DATA&tamanho=50` | `PaginaDTO<TarefaDTO>` |
| Atrasadas | `GET /api/tarefas?prazo=ATRASADA&ordenacao=DATA&tamanho=50` | `PaginaDTO<TarefaDTO>` |
| Próximas atividades | `GET /api/tarefas?dataInicial=amanhã&dataFinal=hoje+7&situacao=PENDENTE&situacao=EM_ANDAMENTO&tamanho=6` | `PaginaDTO<TarefaDTO>` |
| Carga da semana | `GET /api/tarefas/resumo-calendario?dataInicial&dataFinal` | `DiaCalendarioDTO[]`, só os dias com tarefa, sem as canceladas |
| Mapa de calor | `GET /api/estudos/mapa-calor?dataInicial&dataFinal` | `MapaCalorDTO`, um item por dia do intervalo (o front pede do 1º dia de 5 meses atrás até o último dia do mês atual) |
| Metas | `GET /api/estudos/progresso-semanal?inicioSemana` | `ProgressoMetaDTO[]`, só atividades não arquivadas e com meta |
| Concluir, reabrir, desfazer | `PATCH /api/tarefas/{id}/situacao` | `TarefaDTO` atualizada |
| Mover atrasadas e desfazer | `POST /api/tarefas/reagendamentos` | `TarefaDTO[]` reagendadas |

Em `EventoRecenteDTO`, `descricao` é o **título** do item referenciado (a tarefa, ou o nome da
atividade em `SESSAO_SALVA`); a frase ("Você concluiu …") é montada pelo front. Ao reabrir uma
tarefa concluída, o evento de conclusão correspondente sai da lista.

### Interações

- **Concluir** pelo marcador redondo (a borda tem a cor da prioridade). O item mostra o envio e só
  aparece como concluído depois da resposta da API. O toast "Tarefa concluída." oferece
  "Desfazer", que devolve a situação anterior (inclusive "em andamento").
- **Mover todas para hoje** pede confirmação, muda só a data e oferece "Desfazer", que reenvia as
  datas originais pelo mesmo endpoint.
- Depois de qualquer alteração, `notificarAlteracao('tarefas')` faz todas as regiões que dependem
  de tarefas buscarem de novo. Enquanto isso, o painel de Produtividade mantém o gráfico anterior
  esmaecido, sem esqueleto.
- Cada região tem esqueleto no formato do conteúdo, estado vazio e estado de erro com
  "Tentar novamente", independentes: uma falha não derruba o resto da página.

### Visualizações

- **Gráfico de barras:** uma série só, na cor `--grafico-1`, barras de até 24px com a ponta
  arredondada; eixo de minutos com marcas redondas (30 min, 1h, 2h…). No celular, o gráfico de 7
  dias mostra só o dia da semana no eixo.
- **Carga da semana:** a altura da barra é a quantidade de tarefas do dia em relação ao dia mais
  cheio da semana; a parte verde (`--carga-concluida`) é o que já foi concluído e a azul
  (`--carga-a-fazer`), o que falta, separadas por um vão de 2px. O par foi validado nos dois temas
  para daltonismo e contraste. Não há escala de cor: a intensidade é o próprio comprimento da barra.
- **Números do resumo:** contam de 0 até o valor em cerca de 1 segundo, desacelerando no fim
  (`useContagem`); com movimento reduzido, aparecem direto.
- **Mapa de calor:** 5 níveis por quartis dos dias com estudo (`regras/escalaCalor.ts`), dias futuros
  vazados, hoje com anel. A rampa `--calor-1..4` foi reajustada nos dois temas para o nível mais
  claro ter contraste de pelo menos 2:1 com o cartão (antes ficava em 1,3:1 e sumia). No celular o
  mapa rola na horizontal e abre no mês atual.

### Simulador em desenvolvimento

No console do navegador, com `VITE_FONTE_DADOS=simulada`:

| Comando | Efeito |
|---|---|
| `orbitSimulacao.restaurar()` | Gera de novo os dados de exemplo em relação a hoje |
| `orbitSimulacao.esvaziar()` | Apaga tudo, para ver os estados vazios |
| `orbitSimulacao.falhar('/tarefas,/estudos')` | Faz as rotas que começam com esses trechos responderem 503 (`'*'` para todas; `false` desliga) |
| `orbitSimulacao.latencia(8000)` | Fixa a latência em milissegundos, para ver os esqueletos (`false` volta a 200–500ms) |

Recarregue a página depois de cada comando. Os dados simulados ficam em
`localStorage['orbit:simulacao:banco']`.
