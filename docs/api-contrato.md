# Contrato da API — OrbitAPI

Este documento descreve **todas as rotas que o OrbitWeb consome** e exatamente como ele as consome:
parâmetros, corpos, respostas, códigos HTTP, erros e regras. Ele foi escrito a partir do código do
front-end (`src/servicos/`, `src/modelos/`, `src/api/`) e do simulador da API
(`src/dados/simulacao/`), que hoje é a implementação de referência do comportamento esperado.

Nenhuma rota aqui é hipotética: cada uma é chamada por pelo menos uma tela. Rotas que o front não
usa **não** estão no contrato.

Documentos relacionados:

- [`backend.md`](backend.md) — guia de implementação em Java + Spring Boot (entidades, DTOs,
  enums, validações, fluxos).
- [`regras-negocio.md`](regras-negocio.md) — regras funcionais, com exemplos.
- [`arquitetura.md`](arquitetura.md) — como o front-end está organizado.

Onde algo depende de uma decisão do backend que ainda não foi tomada, o texto diz
**A DEFINIR NO BACKEND**.

---

## Sumário

1. [Convenções gerais](#1-convenções-gerais)
2. [Modelo de erro — `ErrorResponseDTO`](#2-modelo-de-erro--errorresponsedto)
3. [Índice de endpoints](#3-índice-de-endpoints)
4. [Modelos (DTOs)](#4-modelos-dtos)
5. [Tarefas](#5-tarefas)
6. [Categorias](#6-categorias)
7. [Atividades de estudo](#7-atividades-de-estudo)
8. [Sessões de estudo](#8-sessões-de-estudo)
9. [Estudos (leituras agregadas)](#9-estudos-leituras-agregadas)
10. [Histórico](#10-histórico)
11. [Revisão semanal](#11-revisão-semanal)
12. [Dashboard](#12-dashboard)
13. [Fluxos entre telas sustentados pelo contrato](#13-fluxos-entre-telas-sustentados-pelo-contrato)
14. [Pendências do contrato](#14-pendências-do-contrato)

---

## 1. Convenções gerais

### 1.1 URL base

Todas as rotas deste documento são relativas à **URL base da API**, que o front lê da variável
`VITE_URL_API` (ou de `window.__ORBIT_CONFIG__.urlApi` em produção; ver
[`arquitetura.md`](arquitetura.md#61-configuração-da-api)).

| Item | Valor |
|---|---|
| URL base usada hoje no desenvolvimento | `http://localhost:8080/api` (padrão do front) |
| Porta, *context-path* e prefixo de versão do OrbitAPI | **A DEFINIR NO BACKEND** (o PrismaAPI, do mesmo autor, usa `/PrismaAPI/v1`) |

Exemplo: `GET /tarefas` significa `GET {URL base}/tarefas`, ou seja,
`GET http://localhost:8080/api/tarefas` com a configuração atual.

### 1.2 Cabeçalhos

O front envia estes cabeçalhos em **todas** as requisições (`src/api/clienteHttp.ts` e
`src/api/transporteFetch.ts`):

| Cabeçalho | Quando | Valor | Uso no backend |
|---|---|---|---|
| `Accept` | Sempre | `application/json` | — |
| `Content-Type` | Só quando há corpo (POST, PUT, PATCH) | `application/json` | — |
| `X-Fuso-Horario` | Sempre | Fuso IANA do navegador, ex.: `America/Sao_Paulo` | Define "hoje", o dia de cada instante e quando uma tarefa fica atrasada (ver 1.4) |

Não há autenticação na primeira versão (uso individual, sem login). Quando houver, o cabeçalho
`Authorization` será acrescentado num único ponto (`clienteHttp.ts`).

**CORS:** `X-Fuso-Horario` é um cabeçalho próprio e dispara *preflight*. O backend precisa
permitir, para a origem do front (`http://localhost:5173` no desenvolvimento):

- métodos `GET`, `POST`, `PUT`, `PATCH`, `DELETE` e `OPTIONS`;
- cabeçalhos `Content-Type`, `Accept` e `X-Fuso-Horario`.

Se `X-Fuso-Horario` faltar ou for inválido: **A DEFINIR NO BACKEND**. Sugestão:
`America/Sao_Paulo`, o mesmo valor que o front usa quando o navegador não informa o fuso.

### 1.3 Formato do corpo

- JSON em UTF-8, nas requisições e nas respostas.
- Nomes de campos em português e *camelCase*, sem acento (`dataConclusao`, `horarioInicio`).
- Rotas em *kebab-case*, sem acento (`/tarefas/resumo-calendario`).
- Campos opcionais sem valor são enviados e devolvidos como `null` (não são omitidos).
- Enums são texto em maiúsculas, exatamente como o Spring serializa um `enum` Java
  (`"EM_ANDAMENTO"`).

### 1.4 Datas, horários, instantes e fuso

| Tipo no contrato | Tipo Java sugerido | Formato | Exemplo | Onde aparece |
|---|---|---|---|---|
| Data | `LocalDate` | `AAAA-MM-DD` | `"2026-09-24"` | `data` da tarefa, filtros de período, `inicioSemana` |
| Horário | `LocalTime` | `HH:mm` (sem segundos) | `"19:30"` | `horarioInicio`, `horarioFim` |
| Instante | `OffsetDateTime` ou `Instant` | ISO 8601 com fuso | `"2026-09-24T22:30:00.000Z"` ou `"2026-09-24T19:30:00-03:00"` | `criadoEm`, `dataConclusao`, `inicio`/`fim` da sessão, `ocorridoEm` |
| Duração de sessão | `int` | segundos | `2700` | `duracaoSegundos` |
| Tempo agregado | `int` | minutos | `45` | metas, gráficos, revisão |

Regras:

1. **O front envia instantes em UTC** (`toISOString()`, terminando em `Z`). O backend deve aceitar
   qualquer ISO 8601 com fuso e pode responder com `Z` ou com deslocamento; o front lê os dois.
2. **Horários vão e voltam como `HH:mm`.** Se o Jackson serializar `LocalTime` com segundos
   (`"19:30:00"`), o front exibe os segundos e as comparações de texto deixam de valer: use
   `@JsonFormat(pattern = "HH:mm")`.
3. **`dataConclusao` é um instante**, não uma data: registra quando a pessoa concluiu.
4. **O fuso do cabeçalho `X-Fuso-Horario` decide:**
   - qual é a data de hoje;
   - em que dia cai um instante (a sessão conta no dia do seu `inicio`; a conclusão, no dia da
     `dataConclusao`; um evento, no dia do `ocorridoEm`);
   - o momento em que uma tarefa passa a estar atrasada (data + horário interpretados nesse fuso).
5. **Semana:** de domingo a sábado. `inicioSemana` é sempre um domingo.

### 1.5 Paginação

Listas paginadas usam parâmetros e resposta próprios — **não** o formato padrão do Spring
(`page`, `size`, `sort` e o JSON de `Page`). O backend deve ler estes parâmetros e montar esta
resposta.

Parâmetros:

| Parâmetro | Tipo | Padrão | Regra |
|---|---|---|---|
| `pagina` | inteiro | `0` | Começa em **0** |
| `tamanho` | inteiro | depende da rota (20 ou 30) | Entre 1 e 100 |

Resposta (`PaginaDTO<T>`):

```json
{
  "itens": [],
  "pagina": 0,
  "tamanho": 20,
  "totalItens": 57,
  "totalPaginas": 3
}
```

| Campo | Tipo | Significado |
|---|---|---|
| `itens` | lista de `T` | Itens da página pedida |
| `pagina` | inteiro | Página devolvida (0 = primeira) |
| `tamanho` | inteiro | Tamanho efetivamente usado |
| `totalItens` | inteiro | Total de itens que atendem aos filtros |
| `totalPaginas` | inteiro | `ceil(totalItens / tamanho)`; `0` quando não há itens |

`tamanho` fora de 1..100: o simulador ajusta para o limite mais próximo. No backend, ajustar ou
responder `400` é **A DEFINIR NO BACKEND**; o front nunca envia fora do intervalo.

A ordenação é escolhida pelo parâmetro `ordenacao` (só em `GET /tarefas`), com valores do enum
`OrdenacaoTarefas`. As demais listas têm ordem fixa, descrita em cada rota.

### 1.6 Parâmetros repetíveis

Filtros de múltipla escolha são enviados **repetindo o parâmetro**, e não separados por vírgula:

```text
GET /tarefas?situacao=PENDENTE&situacao=EM_ANDAMENTO
```

No Spring, isso é um `@RequestParam List<Situacao> situacao`.

Parâmetros vazios, `null` ou ausentes não são enviados.

### 1.7 Respostas de sucesso

| Operação | Status | Corpo |
|---|---|---|
| Leitura | `200` | O recurso ou a lista |
| Criação (`POST` de tarefa, atividade, sessão) | `201` | O recurso criado |
| Alteração (`PUT`, `PATCH`) | `200` | O recurso atualizado |
| Reagendamento (`POST /tarefas/reagendamentos`) | `200` | As tarefas reagendadas |
| Exclusão (`DELETE`) | `204` | Sem corpo |

O front não depende do cabeçalho `Location` nas criações.

---

## 2. Modelo de erro — `ErrorResponseDTO`

### 2.1 Estrutura

Toda resposta com status `4xx` ou `5xx` traz no corpo um `ErrorResponseDTO`:

```json
{
  "status": 400,
  "title": "Requisição Inválida!",
  "instance": "/PrismaAPI/tarefas",
  "type": "/PrismaAPI/problems/unreadable-message",
  "detail": "O corpo da requisição está malformado ou tem um valor em formato inválido!"
}
```

*(Exemplo de estrutura; os valores são do PrismaAPI.)*

| Campo | Tipo | Obrigatório | Significado | Como o front usa |
|---|---|---|---|---|
| `status` | inteiro | Sim | Código HTTP do erro | Classifica o erro (tabela 2.3) |
| `title` | texto | Sim | Título curto do problema | Registrado no console para diagnóstico; não é exibido |
| `instance` | texto | Sim | URI da requisição que falhou (`request.getRequestURI()`) | Registrado no console |
| `type` | texto (URI) | Sim | Identificador do tipo específico do problema | Registrado no console; é o campo a usar quando o front precisar distinguir um problema específico |
| `detail` | texto | Sim | Explicação do problema, escrita para a pessoa | **Exibido** em erros `400`, `404`, `409` e `422` |

### 2.2 Campos complementares

O `ErrorResponseDTO` do PrismaAPI, que serve de modelo, tem mais dois campos:

| Campo | Tipo | Como o front usa |
|---|---|---|
| `errors` | lista de `{ "campo": texto, "mensagem": texto }` ou ausente | **Opcional.** Se vier, cada mensagem aparece junto do campo do formulário com o mesmo nome. Se não vier, o front mostra `detail` num aviso no topo do formulário |
| `timestamp` | texto (`dd/MM/yyyy - HH:mm:ss` no PrismaAPI) | Ignorado |

Se o OrbitAPI vai incluir `errors` nas respostas de validação: **A DEFINIR NO BACKEND**
(recomendado, porque permite marcar o campo certo no formulário).

Se incluir, `campo` deve ser o nome do campo no DTO de entrada (`titulo`, `horarioFim`,
`categoriaId`…). Campos aninhados podem vir com caminho (`recorrencia.dataFim`): o front também
procura pelo último trecho (`dataFim`). Os nomes que cada formulário reconhece estão nas seções de
cada endpoint.

### 2.3 Como o front classifica e apresenta os erros

O tratamento é centralizado: `src/api/clienteHttp.ts` converte toda falha num `ErroApi`, e
`src/api/tratamentoErros.ts` decide o que a interface mostra. Nenhuma tela lê o corpo da resposta
diretamente.

| Situação | `ErroApi.tipo` | O que a pessoa vê |
|---|---|---|
| `400` ou `422` | `VALIDACAO` | Mensagens nos campos (`errors`) ou o `detail` |
| `404` | `NAO_ENCONTRADO` | O `detail`, ou um texto próprio da tela ("Esta tarefa não existe mais…"); a lista é recarregada |
| `409` | `CONFLITO` | O `detail` (no formulário de atividade, junto do campo `nome`) |
| Outro `4xx` ou `5xx` | `SERVIDOR` | "O servidor encontrou um problema. Tente de novo daqui a pouco." — o `detail` **não** é exibido |
| Sem resposta (rede, CORS, servidor fora) | `REDE` | "Verifique a conexão e tente de novo." |
| Mais de 15 s sem resposta | `TEMPO_ESGOTADO` | "O servidor demorou demais para responder. Tente de novo." |
| Tela fechada antes da resposta | `CANCELADO` | Nada (ignorado) |

Consequências para o backend:

- **Escreva `detail` para a pessoa** em `400`, `404`, `409` e `422`, em português, sem nomes de
  classe, SQL ou pilha: ele aparece na tela.
- **Em `5xx`, `detail` pode ser genérico**; o front não o exibe.
- Se a resposta de erro não for JSON (página HTML de um *proxy*, por exemplo), o front usa só o
  status HTTP.
- Falhas `REDE`, `TEMPO_ESGOTADO` e `SERVIDOR` são registradas no console com o
  `ErrorResponseDTO` completo; as demais, só no ambiente de desenvolvimento.

### 2.4 Códigos HTTP usados pelo contrato

| Código | Quando |
|---|---|
| `200` | Leitura ou alteração bem-sucedida |
| `201` | Criação |
| `204` | Exclusão |
| `400` | Corpo malformado, parâmetro inválido, regra de validação violada |
| `404` | Registro inexistente (id no caminho, ou id citado no corpo, como nos reagendamentos) |
| `409` | Conflito com dados gravados (nome de atividade repetido; atividade com sessões) |
| `500` | Erro inesperado |

`422` é tratado pelo front como validação, mas nenhuma rota deste contrato exige usá-lo. Usar `422`
em vez de `400` para regras de negócio é **A DEFINIR NO BACKEND**; o front aceita os dois.

### 2.5 Tipos de erro (`type`)

Os valores definitivos de `type` e `title` são **A DEFINIR NO BACKEND**. O front não compara `type`
com nenhum valor hoje; ele decide pelo `status`.

Como referência, estes são os tipos genéricos que o PrismaAPI já usa, com o prefixo trocado por
`{base}` (o *context-path* do OrbitAPI, também a definir):

| `status` | `type` no PrismaAPI | Origem no Spring |
|---|---|---|
| 400 | `{base}/problems/validation-error` | `MethodArgumentNotValidException` (Bean Validation) |
| 400 | `{base}/problems/unreadable-message` | `HttpMessageNotReadableException` (JSON malformado, enum inválido) |
| 400 | `{base}/problems/invalid-parameters` | `MethodArgumentTypeMismatchException` (query param em formato inválido) |
| 400 | `{base}/problems/invalid-request` | Exceção de regra de negócio da aplicação |
| 404 | `{base}/problems/entity-not-found` | Registro não encontrado |
| 404 | `{base}/problems/resource-not-found` | Rota inexistente (`NoResourceFoundException`) |
| 405 | `{base}/problems/method-not-allowed` | Método não suportado |
| 409 | `{base}/problems/data-integrity-violation` | `DataIntegrityViolationException` |
| 500 | `{base}/problems/internal-server-error` | Qualquer exceção não tratada |

O simulador do front usa valores provisórios parecidos (`/api/problems/validation-error`,
`/api/problems/entity-not-found`, `/api/problems/data-conflict`…), só para ter um corpo completo.
Eles **não** são definitivos.

### 2.6 Exemplos

Validação com erros de campo (`POST /tarefas`):

```json
{
  "status": 400,
  "title": "A DEFINIR NO BACKEND",
  "instance": "/api/tarefas",
  "type": "A DEFINIR NO BACKEND",
  "detail": "Revise os campos destacados e tente de novo.",
  "errors": [
    { "campo": "titulo", "mensagem": "Informe um título para a tarefa." },
    { "campo": "horarioFim", "mensagem": "O fim precisa ser depois do início (19:00)." }
  ]
}
```

Registro não encontrado (`PATCH /tarefas/15/situacao`):

```json
{
  "status": 404,
  "title": "A DEFINIR NO BACKEND",
  "instance": "/api/tarefas/15/situacao",
  "type": "A DEFINIR NO BACKEND",
  "detail": "Esta tarefa não existe mais."
}
```

Conflito (`DELETE /atividades/3`):

```json
{
  "status": 409,
  "title": "A DEFINIR NO BACKEND",
  "instance": "/api/atividades/3",
  "type": "A DEFINIR NO BACKEND",
  "detail": "Esta atividade tem sessões registradas. Arquive-a para manter o histórico."
}
```

Nas seções seguintes, a coluna **`detail` sugerido** traz o texto que o simulador usa hoje. É uma
sugestão de redação para a pessoa, não um valor definitivo.

---

## 3. Índice de endpoints

| # | Método | Rota | Serviço do front | Função |
|---|---|---|---|---|
| 1 | GET | `/tarefas` | `servicoTarefas` | `buscarTarefas`, `buscarTarefasPorData` |
| 2 | GET | `/tarefas/{id}` | `servicoTarefas` | `buscarTarefa` |
| 3 | POST | `/tarefas` | `servicoTarefas` | `criarTarefa` |
| 4 | PUT | `/tarefas/{id}` | `servicoTarefas` | `atualizarTarefa` |
| 5 | PATCH | `/tarefas/{id}/situacao` | `servicoTarefas` | `alterarSituacao`, `concluirTarefa`, `reabrirTarefa`, `cancelarTarefa` |
| 6 | DELETE | `/tarefas/{id}` | `servicoTarefas` | `excluirTarefa` |
| 7 | POST | `/tarefas/reagendamentos` | `servicoTarefas` | `reagendarTarefas` |
| 8 | GET | `/tarefas/resumo-calendario` | `servicoTarefas` | `buscarResumoCalendario` |
| 9 | GET | `/categorias` | `servicoCategorias` | `buscarCategorias` |
| 10 | POST | `/categorias` | `servicoCategorias` | `criarCategoria` |
| 11 | PUT | `/categorias/{id}` | `servicoCategorias` | `atualizarCategoria` |
| 12 | DELETE | `/categorias/{id}` | `servicoCategorias` | `excluirCategoria` |
| 13 | GET | `/atividades` | `servicoAtividades` | `buscarAtividades` |
| 14 | POST | `/atividades` | `servicoAtividades` | `criarAtividade` |
| 15 | PUT | `/atividades/{id}` | `servicoAtividades` | `atualizarAtividade` |
| 16 | PATCH | `/atividades/{id}/arquivamento` | `servicoAtividades` | `arquivarAtividade`, `desarquivarAtividade` |
| 17 | DELETE | `/atividades/{id}` | `servicoAtividades` | `excluirAtividade` |
| 18 | GET | `/sessoes` | `servicoSessoes` | `buscarSessoes` |
| 19 | POST | `/sessoes` | `servicoSessoes` | `criarSessao` |
| 20 | PUT | `/sessoes/{id}` | `servicoSessoes` | `atualizarSessao` |
| 21 | DELETE | `/sessoes/{id}` | `servicoSessoes` | `excluirSessao` |
| 22 | GET | `/estudos/resumo` | `servicoSessoes` | `buscarResumoEstudos` |
| 23 | GET | `/estudos/progresso-semanal` | `servicoSessoes` | `buscarProgressoSemanal` |
| 24 | GET | `/estudos/mapa-calor` | `servicoSessoes` | `buscarMapaCalor` |
| 25 | GET | `/historico` | `servicoHistorico` | `buscarHistorico` |
| 26 | GET | `/historico/{id}` | `servicoHistorico` | `buscarDetalhesHistorico` |
| 27 | GET | `/revisao-semanal` | `servicoRevisaoSemanal` | `buscarRevisaoSemanal` |
| 28 | PUT | `/revisao-semanal/{inicioSemana}/nota` | `servicoRevisaoSemanal` | `salvarNotaSemana` |
| 29 | GET | `/dashboard/resumo` | `servicoDashboard` | `buscarResumoDashboard` |
| 30 | GET | `/dashboard/sequencia` | `servicoDashboard` | `buscarSequencia` |

As URLs existem num só lugar do front: `src/api/rotasApi.ts`.

---

## 4. Modelos (DTOs)

Tipos TypeScript em `src/modelos/`. `?` não é usado: todo campo listado está sempre presente; os
que admitem `null` estão marcados.

### 4.1 Enums

Significado de cada valor em [`backend.md`](backend.md#3-enums).

| Enum | Valores |
|---|---|
| `Prioridade` | `BAIXA`, `MEDIA`, `ALTA`, `URGENTE` |
| `Situacao` | `PENDENTE`, `EM_ANDAMENTO`, `CONCLUIDA`, `CANCELADA` |
| `Prazo` (somente leitura) | `SEM_DATA`, `NO_PRAZO`, `ATRASADA`, `NAO_REALIZADA`, `CONCLUIDA_NO_PRAZO`, `CONCLUIDA_COM_ATRASO` |
| `Cor` | `AZUL`, `VERDE`, `AMARELO`, `LARANJA`, `VERMELHO`, `ROSA`, `ROXO`, `CIANO`, `CINZA` |
| `Frequencia` | `DIARIA`, `DIAS_DA_SEMANA`, `SEMANAL`, `MENSAL`, `ANUAL` |
| `DiaSemana` | `DOMINGO`, `SEGUNDA`, `TERCA`, `QUARTA`, `QUINTA`, `SEXTA`, `SABADO` |
| `EscopoAlteracao` | `SOMENTE_ESTA`, `ESTA_E_PROXIMAS` |
| `OrdenacaoTarefas` | `DATA`, `PRIORIDADE`, `ATUALIZACAO` |
| `ModoCronometro` | `LIVRE`, `POMODORO` |
| `OrigemSessao` | `CRONOMETRO`, `MANUAL` |
| `TipoEventoHistorico` | `TAREFA_CRIADA`, `TAREFA_CONCLUIDA`, `TAREFA_CANCELADA`, `TAREFA_REABERTA`, `TAREFA_NAO_REALIZADA`, `PRIORIDADE_ALTERADA`, `DATA_ALTERADA`, `SESSAO_ESTUDO` |
| `TipoEventoRecente` | `TAREFA_CRIADA`, `TAREFA_CONCLUIDA`, `TAREFA_CANCELADA`, `TAREFA_REABERTA`, `SESSAO_SALVA` |
| `AreaHistorico` | `TAREFAS`, `ESTUDOS` |

`lembreteMinutosAntes` não é enum, mas só aceita `0`, `5`, `15`, `30`, `60` ou `null`.

### 4.2 Resumos embutidos

```ts
ResumoCategoriaDTO   { id: number; nome: string; cor: Cor }
ResumoAtividadeDTO   { id: number; nome: string; cor: Cor }
ResumoTarefaSessaoDTO { id: number; titulo: string }
```

Sempre refletem o estado **atual** da categoria, atividade ou tarefa (renomear uma atividade muda
o nome em todas as tarefas e sessões).

### 4.3 Tarefa

**`TarefaDTO`** (resposta):

| Campo | Tipo | `null`? | Descrição |
|---|---|---|---|
| `id` | inteiro | Não | Identificador |
| `titulo` | texto | Não | 1 a 120 caracteres |
| `descricao` | texto | Sim | Até 2000 caracteres |
| `data` | data | Sim | `null` = tarefa sem data |
| `diaInteiro` | booleano | Não | `true` quando não há horário |
| `horarioInicio` | horário | Sim | |
| `horarioFim` | horário | Sim | |
| `prioridade` | `Prioridade` | Não | |
| `situacao` | `Situacao` | Não | Escolhida pela pessoa |
| `prazo` | `Prazo` | Não | **Calculado pelo backend a cada leitura** ([regras](regras-negocio.md#2-prazo-atrasada-e-não-realizada)) |
| `categoria` | `ResumoCategoriaDTO` | Sim | |
| `atividade` | `ResumoAtividadeDTO` | Sim | Atividade de estudo ligada à tarefa |
| `lembreteMinutosAntes` | `0 \| 5 \| 15 \| 30 \| 60` | Sim | `0` = no horário de início |
| `serieId` | inteiro | Sim | Série recorrente da qual a tarefa é uma ocorrência |
| `recorrencia` | `RecorrenciaDTO` | Sim | Regra da série (igual em todas as ocorrências) |
| `dataConclusao` | instante | Sim | Preenchido só quando `situacao = CONCLUIDA` |
| `criadoEm` | instante | Não | |
| `atualizadoEm` | instante | Não | Muda a cada alteração |

**`RecorrenciaDTO`**:

| Campo | Tipo | `null`? | Descrição |
|---|---|---|---|
| `frequencia` | `Frequencia` | Não | |
| `diasSemana` | lista de `DiaSemana` | Sim | Só em `DIAS_DA_SEMANA` (pelo menos um); `null` nas demais |
| `dataFim` | data | Sim | Último dia possível da série; `null` = nunca termina |

**`TarefaEnvioDTO`** (corpo de `POST` e `PUT`): os mesmos campos editáveis, com ids no lugar dos
resumos.

| Campo | Tipo | `null`? |
|---|---|---|
| `titulo` | texto | Não |
| `descricao` | texto | Sim |
| `data` | data | Sim |
| `diaInteiro` | booleano | Não |
| `horarioInicio` | horário | Sim |
| `horarioFim` | horário | Sim |
| `prioridade` | `Prioridade` | Não |
| `situacao` | `Situacao` | Não |
| `categoriaId` | inteiro | Sim |
| `atividadeId` | inteiro | Sim |
| `lembreteMinutosAntes` | `0 \| 5 \| 15 \| 30 \| 60` | Sim |
| `recorrencia` | `RecorrenciaDTO` | Sim |

`prazo`, `serieId`, `dataConclusao`, `criadoEm` e `atualizadoEm` nunca são enviados.

Exemplo de `TarefaDTO`:

```json
{
  "id": 42,
  "titulo": "Levar o carro para a revisão",
  "descricao": "Pedir para olhar o barulho no freio.",
  "data": "2026-09-24",
  "diaInteiro": false,
  "horarioInicio": "09:00",
  "horarioFim": "10:30",
  "prioridade": "ALTA",
  "situacao": "PENDENTE",
  "prazo": "NO_PRAZO",
  "categoria": { "id": 3, "nome": "Casa e família", "cor": "LARANJA" },
  "atividade": null,
  "lembreteMinutosAntes": 30,
  "serieId": null,
  "recorrencia": null,
  "dataConclusao": null,
  "criadoEm": "2026-09-20T13:12:00.000Z",
  "atualizadoEm": "2026-09-22T18:40:00.000Z"
}
```

**`ReagendamentoDTO`**: `{ "itens": [ { "id": 42, "data": "2026-09-24" } ] }`.

**`DiaCalendarioDTO`**:

| Campo | Tipo | Descrição |
|---|---|---|
| `data` | data | Dia |
| `quantidade` | inteiro | Tarefas do dia, sem as canceladas |
| `maiorPrioridade` | `Prioridade` ou `null` | Maior prioridade entre as tarefas contadas |
| `atrasadas` | inteiro | Tarefas do dia com `prazo = ATRASADA` |
| `concluidas` | inteiro | Tarefas do dia com `situacao = CONCLUIDA` |

### 4.4 Categoria

**`CategoriaDTO`** (resposta): `{ id: number; nome: string; cor: Cor; quantidadeTarefas: number }`.

**`CategoriaEnvioDTO`** (corpo de `POST` e `PUT`): `{ nome: string; cor: Cor }`.

`quantidadeTarefas` conta todas as tarefas ligadas à categoria, em qualquer situação, inclusive as
ocorrências futuras já geradas de tarefas recorrentes. Dentro de uma tarefa, a categoria continua
vindo como `ResumoCategoriaDTO` (`{ id, nome, cor }`), sem a contagem.

### 4.5 Estudos

**`AtividadeEstudoDTO`**:

| Campo | Tipo | `null`? | Descrição |
|---|---|---|---|
| `id` | inteiro | Não | |
| `nome` | texto | Não | 1 a 40 caracteres |
| `cor` | `Cor` | Não | |
| `metaSemanalMinutos` | inteiro | Sim | 1 a 6000 (100 h); `null` = sem meta |
| `arquivada` | booleano | Não | |

**`AtividadeEnvioDTO`**: `{ nome, cor, metaSemanalMinutos }`.

**`SessaoEstudoDTO`**:

| Campo | Tipo | `null`? | Descrição |
|---|---|---|---|
| `id` | inteiro | Não | |
| `atividade` | `ResumoAtividadeDTO` | Não | |
| `tarefa` | `ResumoTarefaSessaoDTO` | Sim | Tarefa a partir da qual o estudo começou |
| `modo` | `ModoCronometro` | Não | |
| `origem` | `OrigemSessao` | Não | |
| `inicio` | instante | Não | Define o dia da sessão |
| `fim` | instante | Não | |
| `duracaoSegundos` | inteiro | Não | Tempo **efetivo** de estudo: sem pausas; no Pomodoro, só foco. Pode ser menor que `fim − inicio` |
| `ciclosConcluidos` | inteiro | Sim | Só em `POMODORO` |
| `observacao` | texto | Sim | Até 500 caracteres |

**`SessaoEnvioDTO`**: `{ atividadeId, tarefaId, modo, origem, inicio, fim, duracaoSegundos, ciclosConcluidos, observacao }`
(`tarefaId`, `ciclosConcluidos` e `observacao` podem ser `null`).

**`ResumoEstudosDTO`**:

| Campo | Tipo | Descrição |
|---|---|---|
| `totalSegundos` | inteiro | Soma de `duracaoSegundos` |
| `totalSessoes` | inteiro | |
| `mediaSegundosPorSessao` | inteiro | Arredondada; `0` sem sessões |
| `porDia` | lista de `{ data, segundos, sessoes }` | Um item por dia do período (inclusive zerados); vazia se o período não for informado |
| `porAtividade` | lista de `EstudoPorAtividadeDTO` | Só atividades com sessão no período, da mais estudada para a menos |

`EstudoPorAtividadeDTO`: `{ atividade: ResumoAtividadeDTO; segundos; sessoes; ultimaSessaoEm: instante | null }`.

**`ProgressoMetaDTO`**: `{ atividade: ResumoAtividadeDTO; metaMinutos; minutosRealizados }`.

**`MapaCalorDTO`**: `{ dias: { data, minutos }[]; atividadeMaisEstudada: { id, nome, cor, minutos } | null }`.

### 4.6 Histórico

**`RegistroHistoricoDTO`**:

| Campo | Tipo | `null`? | Descrição |
|---|---|---|---|
| `id` | texto | Não | `evento-{id}`, `sessao-{id}` ou `nao-realizada-{idTarefa}` |
| `tipo` | `TipoEventoHistorico` | Não | |
| `area` | `AreaHistorico` | Não | `ESTUDOS` só em `SESSAO_ESTUDO` |
| `ocorridoEm` | instante | Não | Momento do registro (ver 10.1) |
| `comHorario` | booleano | Não | `false` quando o instante é só uma referência de dia (não realizada sem horário) |
| `titulo` | texto | Não | Título da tarefa **no momento do evento**; nome da atividade nas sessões |
| `tarefaId` | inteiro | Sim | |
| `sessaoId` | inteiro | Sim | |
| `categoria` | `ResumoCategoriaDTO` | Sim | Categoria **atual** da tarefa |
| `atividade` | `ResumoAtividadeDTO` | Sim | Só nas sessões |
| `alteracao` | `{ anterior: texto \| null; novo: texto \| null }` | Sim | Em `PRIORIDADE_ALTERADA` (valores de `Prioridade`), `DATA_ALTERADA` (datas ou `null`) e `TAREFA_REABERTA` (valores de `Situacao`) |
| `duracaoSegundos` | inteiro | Sim | Só nas sessões |

**`DetalheHistoricoDTO`**: `{ registro: RegistroHistoricoDTO; tarefa: TarefaDTO | null; sessao: SessaoEstudoDTO | null }`.

### 4.7 Revisão semanal

Descrita campo a campo em [11.1](#111-get-revisao-semanal).

### 4.8 Dashboard

Descritos em [12.1](#121-get-dashboardresumo) e [12.2](#122-get-dashboardsequencia).

---

## 5. Tarefas

### 5.1 `GET /tarefas`

**Objetivo:** listar tarefas com filtros, ordenação e paginação. É a base de quase todas as telas:
lista de Tarefas, tarefas de hoje e atrasadas no Dashboard, agenda do dia no Calendário,
contagens das visões e lembretes.

**Path parameters:** nenhum.

**Query parameters:**

| Nome | Tipo | Obrigatório | Padrão | Descrição |
|---|---|---|---|---|
| `data` | data | Não | — | Só tarefas deste dia |
| `dataInicial` | data | Não | — | Só tarefas com `data >= dataInicial` (exclui as sem data) |
| `dataFinal` | data | Não | — | Só tarefas com `data <= dataFinal` (exclui as sem data) |
| `semData` | booleano | Não | `false` | `true` = só tarefas sem data |
| `situacao` | `Situacao`, repetível | Não | todas | Uma ou mais situações |
| `prioridade` | `Prioridade`, repetível | Não | todas | Uma ou mais prioridades |
| `prazo` | `Prazo` | Não | — | Filtra pelo prazo **calculado** (`ATRASADA` é o único valor que o front envia) |
| `categoriaId` | inteiro | Não | — | Categoria |
| `busca` | texto | Não | — | Contém o texto no título ou na descrição, sem diferenciar maiúsculas |
| `ordenacao` | `OrdenacaoTarefas` | Não | `DATA` | Ver regras |
| `pagina` | inteiro | Não | `0` | |
| `tamanho` | inteiro | Não | `20` | Máximo 100 |

Os filtros se combinam com **E**.

**Headers:** padrão (1.2). **Request body:** nenhum.

**Response `200`:** `PaginaDTO<TarefaDTO>`.

```json
{
  "itens": [ { "id": 42, "titulo": "Levar o carro para a revisão", "...": "..." } ],
  "pagina": 0,
  "tamanho": 20,
  "totalItens": 1,
  "totalPaginas": 1
}
```

**Status HTTP:**

| Status | Quando |
|---|---|
| `200` | Sempre que os parâmetros forem válidos, mesmo sem resultados |
| `400` | Parâmetro em formato inválido (data, enum, número) |
| `500` | Erro inesperado |

**Erros:** `ErrorResponseDTO`; `type`, `title` e `detail` **A DEFINIR NO BACKEND**.

**Regras de negócio:**

1. **Ordenação `DATA`** (padrão): data crescente, tarefas sem data por último; no mesmo dia,
   tarefas sem horário (dia inteiro) primeiro, depois por `horarioInicio`; empate, prioridade
   decrescente (`URGENTE` antes de `BAIXA`).
2. **`PRIORIDADE`**: prioridade decrescente; empate, a ordenação `DATA`.
3. **`ATUALIZACAO`**: `atualizadoEm` decrescente.
4. `prazo` é calculado antes de filtrar. Em séries recorrentes, só a ocorrência atrasada mais
   recente é `ATRASADA`; as anteriores são `NAO_REALIZADA`
   ([regra](regras-negocio.md#2-prazo-atrasada-e-não-realizada)).
5. `totalItens` conta todos os itens filtrados, não só os da página.

**Consultas que o front monta:**

| Tela | Parâmetros |
|---|---|
| Tarefas › Todas | `situacao=PENDENTE&situacao=EM_ANDAMENTO` (padrão "Em aberto") + filtros + `ordenacao` + `pagina` + `tamanho=20` |
| Tarefas › Sem data | `semData=true` + filtros |
| Tarefas › Atrasadas | `prazo=ATRASADA` + filtros (sem `situacao`) |
| Tarefas › contagem "Sem data" | `semData=true&situacao=PENDENTE&situacao=EM_ANDAMENTO&tamanho=1` (lê `totalItens`) |
| Tarefas › contagem "Atrasadas" | `prazo=ATRASADA&tamanho=1` |
| Tarefas › "Mover todas para hoje" | `prazo=ATRASADA&dataFinal={ontem}&ordenacao=DATA&tamanho=100` |
| Dashboard › Hoje | `data={hoje}&ordenacao=DATA&tamanho=50` |
| Dashboard › Atrasadas | `prazo=ATRASADA&ordenacao=DATA&tamanho=50` |
| Dashboard › Próximas atividades | `dataInicial={amanhã}&dataFinal={hoje+7}&situacao=PENDENTE&situacao=EM_ANDAMENTO&ordenacao=DATA&tamanho=6` |
| Calendário › agenda do dia; lembretes | `data={dia}&ordenacao=DATA&tamanho=100` |

### 5.2 `GET /tarefas/{id}`

**Objetivo:** ler uma tarefa atualizada ao abrir os detalhes.

**Path parameters:** `id` (inteiro, obrigatório).

**Query parameters:** nenhum. **Request body:** nenhum.

**Response `200`:** `TarefaDTO`, com `prazo` calculado.

**Status HTTP:**

| Status | Quando | `detail` sugerido |
|---|---|---|
| `200` | Encontrada | — |
| `404` | Id inexistente | "Esta tarefa não existe mais." |

**Comportamento no front em `404`:** fecha os detalhes, avisa "Esta tarefa não existe mais." e
recarrega as listas.

### 5.3 `POST /tarefas`

**Objetivo:** criar uma tarefa, simples ou recorrente.

**Request body:** `TarefaEnvioDTO`.

```json
{
  "titulo": "Academia",
  "descricao": null,
  "data": "2026-09-28",
  "diaInteiro": false,
  "horarioInicio": "07:00",
  "horarioFim": "08:00",
  "prioridade": "BAIXA",
  "situacao": "PENDENTE",
  "categoriaId": 4,
  "atividadeId": null,
  "lembreteMinutosAntes": 15,
  "recorrencia": { "frequencia": "DIAS_DA_SEMANA", "diasSemana": ["SEGUNDA", "QUARTA", "SEXTA"], "dataFim": null }
}
```

**Response `201`:** `TarefaDTO` da tarefa criada (a primeira ocorrência, se recorrente).

**Normalização antes de validar** (o front já envia normalizado; o backend deve repetir):

| Situação | Resultado |
|---|---|
| `titulo` | Espaços das pontas removidos |
| `descricao` vazia ou só espaços | `null` |
| `data` vazia | `null` |
| Sem `data` | `diaInteiro = false`, horários `null`, `lembreteMinutosAntes = null`, `recorrencia = null` |
| `diaInteiro = true` | horários `null` |
| Com data, sem `horarioInicio` e sem `horarioFim` | `diaInteiro = true` |
| Sem horário de início (ou dia inteiro) | `lembreteMinutosAntes = null` |
| `recorrencia.frequencia` diferente de `DIAS_DA_SEMANA` | `diasSemana = null` |
| `recorrencia.dataFim` vazia | `null` |

**Validações** (mesmas de `src/regras/validacaoTarefa.ts`):

| Campo (`errors[].campo`) | Regra | Mensagem sugerida |
|---|---|---|
| `titulo` | Obrigatório | "Informe um título para a tarefa." |
| `titulo` | Até 120 caracteres | "Use no máximo 120 caracteres no título. Agora são N." |
| `descricao` | Até 2000 caracteres | "Use no máximo 2.000 caracteres na descrição. Agora são N." |
| `data` | Data válida | "Informe uma data válida." |
| `horarioInicio` | Horário válido | "Informe um horário válido, como 08:30." |
| `horarioInicio` | Exige `data` | "Escolha uma data para definir o horário." |
| `horarioFim` | Horário válido | "Informe um horário válido, como 09:30." |
| `horarioFim` | Exige `horarioInicio` | "Informe o horário de início antes do fim." |
| `horarioFim` | Maior que `horarioInicio` | "O fim precisa ser depois do início (HH:mm)." |
| `prioridade` | Valor do enum | "Escolha uma das prioridades da lista." |
| `situacao` | Valor do enum | "Escolha uma das situações da lista." |
| `lembreteMinutosAntes` | `0`, `5`, `15`, `30` ou `60` | "Escolha um dos lembretes da lista." |
| `lembreteMinutosAntes` | Exige data e horário de início, sem dia inteiro | "Defina a data e o horário de início para receber o lembrete." |
| `frequencia` | Valor do enum | "Escolha uma das frequências da lista." |
| `frequencia` | Recorrência exige `data` | "Escolha a data da primeira ocorrência para repetir a tarefa." |
| `diasSemana` | Pelo menos um em `DIAS_DA_SEMANA` | "Escolha pelo menos um dia da semana." |
| `dataFim` | Data válida | "Informe uma data de término válida." |
| `dataFim` | `>= data` | "O término precisa ser a partir da primeira ocorrência (dd/mm/aaaa)." |
| `categoriaId` | Categoria existente | "Esta categoria não existe mais. Escolha outra." |
| `atividadeId` | Atividade existente e não arquivada | "Esta atividade não está mais disponível. Escolha outra." |

O formulário de tarefa reconhece em `errors`: `titulo`, `descricao`, `data`, `horarioInicio`,
`horarioFim`, `prioridade`, `situacao`, `categoriaId`, `atividadeId`, `lembreteMinutosAntes`,
`frequencia`, `diasSemana`, `dataFim`.

**Status HTTP:**

| Status | Quando | `detail` sugerido |
|---|---|---|
| `201` | Criada | — |
| `400` | Corpo malformado ou validação | "Revise os campos destacados e tente de novo." (com `errors`) |

Categoria ou atividade inexistente é tratada como **validação (`400`)** no campo correspondente, e
não como `404`: o recurso principal da requisição existe, o problema é o valor de um campo.

**Regras de negócio:**

1. Registra o evento `TAREFA_CRIADA`.
2. Se `situacao = CONCLUIDA`, preenche `dataConclusao` com o instante atual e registra também
   `TAREFA_CONCLUIDA`.
3. Com `recorrencia`: cria a série e gera as ocorrências seguintes, de `data + 1` até o menor
   entre `recorrencia.dataFim` e hoje + 12 meses ([regras de recorrência](regras-negocio.md#4-recorrência)).
   Cada ocorrência gerada é uma tarefa com os mesmos dados, `situacao = PENDENTE`,
   `dataConclusao = null` e o mesmo `serieId`. As ocorrências geradas **não** registram
   `TAREFA_CRIADA`.

### 5.4 `PUT /tarefas/{id}`

**Objetivo:** editar uma tarefa. Em tarefas recorrentes, o escopo diz se a alteração vale só para
esta ocorrência ou também para as próximas.

**Path parameters:** `id` (inteiro, obrigatório).

**Query parameters:**

| Nome | Tipo | Obrigatório | Padrão | Descrição |
|---|---|---|---|---|
| `escopo` | `EscopoAlteracao` | Não (o front sempre envia) | `SOMENTE_ESTA` | Ignorado em tarefas não recorrentes |

**Request body:** `TarefaEnvioDTO` completo (substituição, não *patch*). Mesma normalização e
validações do `POST`.

**Response `200`:** `TarefaDTO` da tarefa editada.

**Status HTTP:**

| Status | Quando | `detail` sugerido |
|---|---|---|
| `200` | Alterada | — |
| `400` | Validação, inclusive a regra de escopo abaixo | "Revise os campos destacados e tente de novo." |
| `404` | Id inexistente | "Esta tarefa não existe mais." |

**Regras de negócio:**

1. **Tarefa não recorrente** (`serieId = null`): aplica todos os campos. Se o corpo trouxer
   `recorrencia`, a tarefa vira a primeira ocorrência de uma série nova (como no `POST`).
2. **Recorrente com `SOMENTE_ESTA`:**
   - Se a regra de repetição mudou (frequência, dias da semana ou término), responde `400` com
     `errors: [{ "campo": "frequencia", "mensagem": "Para mudar a repetição, aplique a alteração a esta e às próximas." }]`.
   - Senão, altera só esta ocorrência (inclusive data e situação), que continua na série.
3. **Recorrente com `ESTA_E_PROXIMAS`, sem mudar a regra nem a data:** aplica título, descrição,
   dia inteiro, horários, prioridade, categoria, atividade e lembrete nesta ocorrência e em
   **todas as seguintes da série** (`data` maior que a desta). A situação muda só nesta.
4. **Recorrente com `ESTA_E_PROXIMAS`, mudando a regra ou a data:**
   - a série antiga termina na véspera desta ocorrência (`dataFim` = data original − 1 dia); se
     não houver ocorrências anteriores, a série antiga deixa de existir;
   - as ocorrências seguintes **pendentes ou em andamento** são excluídas (com seus eventos); as
     **concluídas e canceladas são preservadas**;
   - esta ocorrência sai da série antiga e recebe os dados novos;
   - se o corpo trouxer `recorrencia`, esta ocorrência inicia uma série nova, que não gera
     ocorrências nas datas das preservadas.
5. **Eventos** (só da tarefa editada, nunca das ocorrências seguintes):
   `PRIORIDADE_ALTERADA` se a prioridade mudou, `DATA_ALTERADA` se a data mudou, e os eventos de
   situação do `PATCH /situacao` (5.5) se a situação mudou. Título, descrição e categoria não
   geram evento.
6. `atualizadoEm` passa a ser o instante atual em todas as tarefas alteradas.

### 5.5 `PATCH /tarefas/{id}/situacao`

**Objetivo:** mudar só a situação: concluir, reabrir, iniciar, cancelar e desfazer uma conclusão.

**Path parameters:** `id` (inteiro, obrigatório).

**Request body:**

```json
{ "situacao": "CONCLUIDA" }
```

| Campo | Tipo | Obrigatório |
|---|---|---|
| `situacao` | `Situacao` | Sim |

**Response `200`:** `TarefaDTO` atualizada.

**Status HTTP:**

| Status | Quando | `detail` sugerido |
|---|---|---|
| `200` | Alterada (ou já estava na situação pedida) | — |
| `400` | `situacao` ausente ou inválida | "Informe uma situação válida." |
| `404` | Id inexistente | "Esta tarefa não existe mais." |

**Regras de negócio:**

1. Se a situação pedida é a atual, nada muda (nem `atualizadoEm`, nem eventos).
2. `CONCLUIDA` preenche `dataConclusao` com o instante atual; qualquer outra situação a limpa.
3. Eventos:
   - para `CONCLUIDA` → `TAREFA_CONCLUIDA`;
   - para `CANCELADA` → `TAREFA_CANCELADA`;
   - de `CONCLUIDA` ou `CANCELADA` para `PENDENTE` ou `EM_ANDAMENTO` → `TAREFA_REABERTA`, com
     `alteracao = { anterior: situação antiga, novo: situação nova }`. O evento de conclusão
     anterior **permanece** no histórico.
4. O "Desfazer" da conclusão é um novo `PATCH` com a situação anterior (inclusive
   `EM_ANDAMENTO`).
5. Qualquer transição entre as quatro situações é permitida.

### 5.6 `DELETE /tarefas/{id}`

**Objetivo:** excluir uma tarefa (e, se pedido, as próximas ocorrências da série).

**Path parameters:** `id` (inteiro, obrigatório).

**Query parameters:** `escopo` (`EscopoAlteracao`, padrão `SOMENTE_ESTA`).

**Response `204`:** sem corpo.

**Status HTTP:**

| Status | Quando | `detail` sugerido |
|---|---|---|
| `204` | Excluída | — |
| `404` | Id inexistente | "Esta tarefa não existe mais." |

**Regras de negócio:**

1. A exclusão é definitiva: a tarefa e **todos os seus eventos** somem, inclusive do Histórico e da
   Revisão semanal. Para manter o registro, a pessoa cancela em vez de excluir.
2. Com `ESTA_E_PROXIMAS` numa ocorrência recorrente com data: exclui também as ocorrências
   seguintes **pendentes ou em andamento** e encerra a série na véspera desta. As seguintes
   concluídas ou canceladas continuam existindo.
3. Sessões de estudo ligadas à tarefa continuam existindo; `tarefa` passa a vir `null` nelas.

### 5.7 `POST /tarefas/reagendamentos`

**Objetivo:** mudar a data de várias tarefas de uma vez ("Mover todas para hoje") e desfazer essa
mudança (reenviando as datas antigas).

**Request body:** `ReagendamentoDTO`.

```json
{
  "itens": [
    { "id": 17, "data": "2026-09-24" },
    { "id": 21, "data": "2026-09-24" }
  ]
}
```

| Campo | Tipo | Obrigatório | Regra |
|---|---|---|---|
| `itens` | lista | Sim | Pelo menos 1 item |
| `itens[].id` | inteiro | Sim | Tarefa existente |
| `itens[].data` | data | Sim | Nova data |

**Response `200`:** lista de `TarefaDTO` das tarefas informadas, já com a data nova e o `prazo`
recalculado.

**Status HTTP:**

| Status | Quando | `detail` sugerido |
|---|---|---|
| `200` | Reagendadas | — |
| `400` | Lista ausente ou vazia; data inválida | "Informe ao menos uma tarefa para reagendar." |
| `404` | Algum id não existe (nada é alterado) | "Uma das tarefas não existe mais." |

**Regras de negócio:**

1. Operação **atômica**: se um id não existir, nenhuma tarefa muda.
2. Só a `data` muda. Horários, prioridade, situação e série continuam iguais.
3. Tarefas cuja data já é a informada não mudam e não geram evento.
4. Cada tarefa alterada registra `DATA_ALTERADA` (`anterior` = data antiga, `novo` = data nova) e
   atualiza `atualizadoEm`.
5. O front envia só atrasadas **de dias anteriores** (`data < hoje`), e o "Desfazer" reenvia as
   datas originais pela mesma rota.

### 5.8 `GET /tarefas/resumo-calendario`

**Objetivo:** marcadores de carga por dia na grade do Calendário (42 dias visíveis) e no gráfico
"Tarefas por dia" do Dashboard.

**Query parameters:**

| Nome | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `dataInicial` | data | Sim | Primeiro dia |
| `dataFinal` | data | Sim | Último dia |

**Response `200`:** lista de `DiaCalendarioDTO`, **só dos dias com pelo menos uma tarefa não
cancelada**, em ordem de data.

```json
[
  { "data": "2026-09-22", "quantidade": 3, "maiorPrioridade": "ALTA", "atrasadas": 1, "concluidas": 1 },
  { "data": "2026-09-24", "quantidade": 6, "maiorPrioridade": "URGENTE", "atrasadas": 0, "concluidas": 2 }
]
```

**Status HTTP:**

| Status | Quando | `detail` sugerido |
|---|---|---|
| `200` | Sucesso | — |
| `400` | Falta `dataInicial` ou `dataFinal` | "Informe dataInicial e dataFinal." |

**Regras de negócio:**

1. Canceladas não entram em nenhuma contagem.
2. `maiorPrioridade` considera todas as tarefas contadas, inclusive as concluídas.
3. O front deriva "a fazer" (`quantidade − concluidas − atrasadas`) e, em dias passados, mostra
   esse restante como "não realizada".

---

## 6. Categorias

### 6.1 `GET /categorias`

**Objetivo:** lista da tela de Configurações e opções de categoria no formulário de tarefa e no
filtro da página Tarefas.

**Parâmetros:** nenhum. **Request body:** nenhum.

**Response `200`:** lista de `CategoriaDTO`, em ordem alfabética do nome (pt-BR).

```json
[
  { "id": 3, "nome": "Casa e família", "cor": "LARANJA", "quantidadeTarefas": 25 },
  { "id": 1, "nome": "Estudos", "cor": "ROXO", "quantidadeTarefas": 0 }
]
```

**Status HTTP:** `200`; `500` em erro inesperado.

### 6.2 `POST /categorias`

**Objetivo:** criar uma categoria pela tela de Configurações.

**Request body:** `CategoriaEnvioDTO`.

```json
{ "nome": "Viagens", "cor": "CIANO" }
```

**Response `201`:** `CategoriaDTO` com `quantidadeTarefas = 0`.

**Normalização:** `nome` sem espaços nas pontas e com espaços internos repetidos reduzidos a um.

**Validações** (`src/regras/validacaoCategoria.ts`):

| Campo | Regra | Status | Mensagem sugerida |
|---|---|---|---|
| `nome` | Obrigatório | `400` | "Informe um nome para a categoria." |
| `nome` | Até 40 caracteres | `400` | "Use no máximo 40 caracteres no nome. Agora são N." |
| `nome` | Único, sem diferenciar maiúsculas | `409` | "Já existe uma categoria chamada “Nome”. Escolha outro nome." |
| `cor` | Valor do enum `Cor` | `400` | "Escolha uma das cores da lista." |

O formulário reconhece em `errors`: `nome`, `cor`. Num `409` sem `errors`, o front mostra o `detail`
junto do campo `nome`.

**Status HTTP:** `201`, `400`, `409`.

### 6.3 `PUT /categorias/{id}`

**Objetivo:** mudar o nome e a cor de uma categoria.

**Path parameters:** `id`. **Request body:** `CategoriaEnvioDTO`. **Response `200`:** `CategoriaDTO`.

Mesmas validações do `POST`; a unicidade ignora a própria categoria.

**Status HTTP:** `200`, `400`, `404` ("Esta categoria não existe mais."), `409`.

**Regras:** nome e cor novos aparecem em todas as tarefas da categoria (o resumo embutido é sempre o
estado atual). Mudar a categoria não gera evento no Histórico (H1).

### 6.4 `DELETE /categorias/{id}`

**Objetivo:** excluir uma categoria.

**Response `204`:** sem corpo.

**Status HTTP:**

| Status | Quando | `detail` sugerido |
|---|---|---|
| `204` | Excluída | — |
| `404` | Id inexistente | "Esta categoria não existe mais." |

**Regras:** a exclusão é sempre permitida. As tarefas ligadas à categoria ficam com
`categoria = null` e continuam existindo. Não há arquivamento nem desfazer: a tela pede confirmação
e diz quantas tarefas ficam sem categoria.

---

## 7. Atividades de estudo

### 7.1 `GET /atividades`

**Objetivo:** atividades do cronômetro, das metas, dos formulários de tarefa e de sessão.

**Response `200`:** lista de `AtividadeEstudoDTO`, **incluindo as arquivadas**, em ordem
alfabética do nome.

```json
[
  { "id": 1, "nome": "Inglês", "cor": "AZUL", "metaSemanalMinutos": 180, "arquivada": false },
  { "id": 4, "nome": "Violão", "cor": "ROSA", "metaSemanalMinutos": null, "arquivada": true }
]
```

**Status HTTP:** `200`; `500`.

### 7.2 `POST /atividades`

**Objetivo:** criar uma atividade de estudo.

**Request body:** `AtividadeEnvioDTO`.

```json
{ "nome": "Leitura", "cor": "VERDE", "metaSemanalMinutos": 120 }
```

**Response `201`:** `AtividadeEstudoDTO` com `arquivada = false`.

**Normalização:** `nome` sem espaços nas pontas e com espaços internos repetidos reduzidos a um.

**Validações** (`src/regras/validacaoAtividade.ts`):

| Campo | Regra | Status | Mensagem sugerida |
|---|---|---|---|
| `nome` | Obrigatório | `400` | "Informe um nome para a atividade." |
| `nome` | Até 40 caracteres | `400` | "Use no máximo 40 caracteres no nome. Agora são N." |
| `nome` | Único entre as **não arquivadas**, sem diferenciar maiúsculas | `409` | "Já existe uma atividade chamada “Nome”. Escolha outro nome." |
| `cor` | Valor do enum `Cor` | `400` | "Escolha uma das cores da lista." |
| `metaSemanalMinutos` | `null`, ou maior que 0 | `400` | "Informe uma meta maior que zero ou deixe o campo vazio." |
| `metaSemanalMinutos` | Até 6000 (100 h) | `400` | "A meta pode ter no máximo 100 horas por semana." |

O formulário reconhece em `errors`: `nome`, `cor`, `metaSemanalMinutos`. Num `409` sem `errors`, o
front mostra o `detail` junto do campo `nome`.

**Status HTTP:** `201`, `400`, `409`.

### 7.3 `PUT /atividades/{id}`

**Objetivo:** editar nome, cor e meta.

**Path parameters:** `id`. **Request body:** `AtividadeEnvioDTO`. **Response `200`:**
`AtividadeEstudoDTO`.

Mesmas validações do `POST`; a unicidade ignora a própria atividade.

**Status HTTP:** `200`, `400`, `404` ("Esta atividade não existe mais."), `409`.

**Regras:** nome e cor novos aparecem em todas as tarefas e sessões ligadas à atividade (os
resumos são sempre o estado atual).

### 7.4 `PATCH /atividades/{id}/arquivamento`

**Objetivo:** arquivar ou desarquivar uma atividade.

**Request body:**

```json
{ "arquivada": true }
```

| Campo | Tipo | Obrigatório |
|---|---|---|
| `arquivada` | booleano | Sim |

**Response `200`:** `AtividadeEstudoDTO`.

**Status HTTP:**

| Status | Quando | `detail` sugerido |
|---|---|---|
| `200` | Alterada | — |
| `400` | `arquivada` ausente ou não booleano | "Informe se a atividade fica arquivada." |
| `404` | Id inexistente | "Esta atividade não existe mais." |
| `409` | Desarquivar com nome igual ao de outra atividade ativa | "Já existe uma atividade ativa chamada “Nome”. Renomeie uma delas antes de desarquivar." |

**Regras:** atividade arquivada some do cronômetro e das metas, não aceita sessões novas nem
tarefas novas, mas mantém as sessões antigas e o histórico.

### 7.5 `DELETE /atividades/{id}`

**Objetivo:** excluir uma atividade que nunca teve sessão.

**Response `204`:** sem corpo.

**Status HTTP:**

| Status | Quando | `detail` sugerido |
|---|---|---|
| `204` | Excluída | — |
| `404` | Id inexistente | "Esta atividade não existe mais." |
| `409` | A atividade tem sessões | "Esta atividade tem sessões registradas. Arquive-a para manter o histórico." |

**Regras:** tarefas ligadas à atividade ficam com `atividade = null`.

---

## 8. Sessões de estudo

### 8.1 `GET /sessoes`

**Objetivo:** histórico recente na página Estudos (últimos 7 dias) e "Estudo neste dia" na agenda
do Calendário.

**Query parameters:**

| Nome | Tipo | Obrigatório | Padrão | Descrição |
|---|---|---|---|---|
| `dataInicial` | data | Não | — | Dia do `inicio` ≥ `dataInicial` |
| `dataFinal` | data | Não | — | Dia do `inicio` ≤ `dataFinal` |
| `atividadeId` | inteiro | Não | — | Só sessões da atividade |
| `pagina` | inteiro | Não | `0` | |
| `tamanho` | inteiro | Não | `20` | Máximo 100 |

**Response `200`:** `PaginaDTO<SessaoEstudoDTO>`, **mais recentes primeiro** (`inicio`
decrescente).

**Status HTTP:**

| Status | Quando | `detail` sugerido |
|---|---|---|
| `200` | Sucesso | — |
| `400` | Data fora do formato | "Informe datas no formato AAAA-MM-DD." |
| `400` | `dataInicial > dataFinal` | "A data inicial precisa ser antes da final." |

**Consultas do front:** Estudos usa `dataInicial={hoje−6}&dataFinal={hoje}&tamanho=100`; o
Calendário, `dataInicial={dia}&dataFinal={dia}&tamanho=100`.

### 8.2 `POST /sessoes`

**Objetivo:** salvar uma sessão do cronômetro (ao finalizar) ou lançada manualmente.

**Request body:** `SessaoEnvioDTO`.

```json
{
  "atividadeId": 1,
  "tarefaId": 42,
  "modo": "POMODORO",
  "origem": "CRONOMETRO",
  "inicio": "2026-09-24T21:00:00.000Z",
  "fim": "2026-09-24T21:58:00.000Z",
  "duracaoSegundos": 3000,
  "ciclosConcluidos": 2,
  "observacao": "Revisei a lição 12."
}
```

**Response `201`:** `SessaoEstudoDTO`.

**Normalização:**

| Campo | Regra |
|---|---|
| `modo` | Diferente de `POMODORO` vira `LIVRE` |
| `origem` | Diferente de `CRONOMETRO` vira `MANUAL` |
| `duracaoSegundos` | Arredondada para inteiro |
| `ciclosConcluidos` | Só mantido em `POMODORO` e se for inteiro; senão `null` |
| `observacao` | Sem espaços nas pontas; vazia vira `null` |
| `tarefaId` | Se a tarefa não existir, vira `null` (sem erro) |

**Validações** (`src/regras/validacaoSessao.ts`), todas com status `400`:

| Campo | Regra | Mensagem sugerida |
|---|---|---|
| `atividadeId` | Inteiro positivo | "Escolha a atividade que você estudou." |
| `atividadeId` | Atividade existente | "Esta atividade não existe mais. Escolha outra." |
| `atividadeId` | Não arquivada | "Esta atividade está arquivada. Escolha outra ou desarquive-a." |
| `inicio` | Instante válido | "Informe quando a sessão começou." |
| `inicio` | No máximo 1 min depois de agora | "A sessão não pode começar depois de agora." |
| `duracaoSegundos` | Pelo menos 60 | "A sessão precisa ter pelo menos 1 minuto." |
| `duracaoSegundos` | No máximo 86400 (24 h) | "Uma sessão pode ter no máximo 24 horas." |
| `duracaoSegundos` | `fim` válido | "Informe a duração da sessão." |
| `duracaoSegundos` | `fim >= inicio` | "O fim da sessão precisa ser depois do início." |
| `duracaoSegundos` | `duracaoSegundos ≤ (fim − inicio) + 1 s` | "A duração não pode passar do tempo entre o início e o fim." |
| `duracaoSegundos` | `fim` no máximo 1 min depois de agora | "Com essa duração, a sessão terminaria às HH:mm, depois de agora. Ajuste o início ou a duração." |
| `observacao` | Até 500 caracteres | "Use no máximo 500 caracteres na observação. Agora são N." |

Os formulários reconhecem em `errors`: `atividadeId`, `inicio`, `duracaoSegundos`, `observacao`.

**Status HTTP:** `201`, `400`.

**Regras de negócio:**

1. A sessão conta no **dia do `inicio`**, mesmo que passe da meia-noite.
2. Salvar uma sessão com `tarefaId` **não** muda a situação da tarefa (quem muda para "em
   andamento" é o front, ao iniciar o estudo, por `PATCH /tarefas/{id}/situacao`).
3. Se salvar falhar, o front mantém a sessão no navegador e deixa tentar de novo; o backend não
   precisa de rascunho.

### 8.3 `PUT /sessoes/{id}`

**Objetivo:** corrigir uma sessão salva (atividade, início, duração, observação).

**Request body:** `SessaoEnvioDTO`. **Response `200`:** `SessaoEstudoDTO`.

Mesmas validações do `POST`, com uma exceção: a atividade arquivada é aceita se for a **mesma**
que a sessão já tinha.

**Regras:** `modo`, `origem` e `tarefaId` **não mudam** na edição; o backend mantém os valores
gravados e ignora os do corpo.

**Status HTTP:** `200`, `400`, `404` ("Esta sessão não existe mais.").

### 8.4 `DELETE /sessoes/{id}`

**Response `204`.** **Status HTTP:** `204`, `404` ("Esta sessão não existe mais.").

**Regras:** a sessão some do Histórico, das metas, dos gráficos, do mapa de calor e da sequência.

---

## 9. Estudos (leituras agregadas)

Nos agregados em **minutos**, cada sessão contribui com `round(duracaoSegundos / 60)` e só então
os valores são somados. Nos agregados em **segundos**, soma-se `duracaoSegundos` diretamente.

### 9.1 `GET /estudos/resumo`

**Objetivo:** métricas da página Estudos: semana atual (hoje, semana, sessões, média) e total
geral (tempo, sessões e último estudo de cada atividade).

**Query parameters:**

| Nome | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `dataInicial` | data | Não | Sem datas = desde o início |
| `dataFinal` | data | Não | |
| `atividadeId` | inteiro | Não | |

**Response `200`:** `ResumoEstudosDTO`.

```json
{
  "totalSegundos": 12600,
  "totalSessoes": 5,
  "mediaSegundosPorSessao": 2520,
  "porDia": [
    { "data": "2026-09-20", "segundos": 0, "sessoes": 0 },
    { "data": "2026-09-21", "segundos": 2700, "sessoes": 1 }
  ],
  "porAtividade": [
    {
      "atividade": { "id": 1, "nome": "Inglês", "cor": "AZUL" },
      "segundos": 7200,
      "sessoes": 3,
      "ultimaSessaoEm": "2026-09-24T21:58:00.000Z"
    }
  ]
}
```

**Regras:** `porDia` só vem preenchido quando `dataInicial` e `dataFinal` são informados, com um
item por dia (inclusive zerados); `porAtividade` em ordem decrescente de `segundos`;
`ultimaSessaoEm` é o maior `fim` da atividade no período.

**Status HTTP:** `200`; `400` com as mesmas regras de datas de `GET /sessoes`.

**Consultas do front:** semana atual (`dataInicial={domingo}&dataFinal={sábado}`) e total geral
(sem parâmetros).

### 9.2 `GET /estudos/progresso-semanal`

**Objetivo:** metas da semana (Dashboard e página Estudos).

**Query parameters:** `inicioSemana` (data, obrigatório; o front sempre envia um domingo).

**Response `200`:** lista de `ProgressoMetaDTO`, **só de atividades não arquivadas e com meta**.

```json
[
  { "atividade": { "id": 1, "nome": "Inglês", "cor": "AZUL" }, "metaMinutos": 180, "minutosRealizados": 95 }
]
```

**Regras:** `minutosRealizados` soma as sessões com início entre `inicioSemana` e
`inicioSemana + 6`. Atividade com meta e sem estudo aparece com `0`.

**Status HTTP:** `200`; `400` sem `inicioSemana` ("Informe inicioSemana.").

### 9.3 `GET /estudos/mapa-calor`

**Objetivo:** mapa de calor de minutos de estudo por dia no Dashboard.

**Query parameters:** `dataInicial` e `dataFinal` (datas, obrigatórios). O front pede do primeiro
dia de 5 meses atrás até o último dia do mês atual.

**Response `200`:** `MapaCalorDTO`, com **um item por dia do intervalo** (inclusive zerados e
futuros).

```json
{
  "dias": [ { "data": "2026-04-01", "minutos": 0 }, { "data": "2026-04-02", "minutos": 45 } ],
  "atividadeMaisEstudada": { "id": 1, "nome": "Inglês", "cor": "AZUL", "minutos": 1320 }
}
```

**Regras:** `atividadeMaisEstudada` é a atividade com mais minutos no intervalo, ou `null` se não
houver estudo. Os níveis de cor são calculados no front (quartis).

**Status HTTP:** `200`; `400` sem as datas ("Informe dataInicial e dataFinal.").

---

## 10. Histórico

### 10.1 `GET /historico`

**Objetivo:** linha do tempo de tarefas e estudos, agrupada por dia no front.

**Query parameters:**

| Nome | Tipo | Obrigatório | Padrão | Descrição |
|---|---|---|---|---|
| `dataInicial` | data | **Sim** | — | |
| `dataFinal` | data | **Sim** | — | `>= dataInicial` |
| `area` | `AreaHistorico` | Não | ambas | `TAREFAS` ou `ESTUDOS` |
| `busca` | texto | Não | — | Contém o texto no título, no nome da categoria ou no nome da atividade, sem diferenciar maiúsculas |
| `pagina` | inteiro | Não | `0` | O front usa "Mostrar mais registros" (páginas 0, 1, 2…) |
| `tamanho` | inteiro | Não | `30` | Máximo 100 |

**Response `200`:** `PaginaDTO<RegistroHistoricoDTO>`.

```json
{
  "itens": [
    {
      "id": "evento-812",
      "tipo": "PRIORIDADE_ALTERADA",
      "area": "TAREFAS",
      "ocorridoEm": "2026-09-24T16:35:00.000Z",
      "comHorario": true,
      "titulo": "Levar o carro para a revisão",
      "tarefaId": 42,
      "sessaoId": null,
      "categoria": { "id": 3, "nome": "Casa e família", "cor": "LARANJA" },
      "atividade": null,
      "alteracao": { "anterior": "BAIXA", "novo": "MEDIA" },
      "duracaoSegundos": null
    },
    {
      "id": "sessao-77",
      "tipo": "SESSAO_ESTUDO",
      "area": "ESTUDOS",
      "ocorridoEm": "2026-09-23T22:00:00.000Z",
      "comHorario": true,
      "titulo": "Matemática",
      "tarefaId": null,
      "sessaoId": 77,
      "categoria": null,
      "atividade": { "id": 3, "nome": "Matemática", "cor": "ROXO" },
      "alteracao": null,
      "duracaoSegundos": 2700
    }
  ],
  "pagina": 0,
  "tamanho": 30,
  "totalItens": 2,
  "totalPaginas": 1
}
```

**Origem dos registros** (a linha do tempo não é uma tabela própria):

| Tipo | Origem | `ocorridoEm` | `id` |
|---|---|---|---|
| `TAREFA_CRIADA`, `TAREFA_CONCLUIDA`, `TAREFA_CANCELADA`, `TAREFA_REABERTA`, `PRIORIDADE_ALTERADA`, `DATA_ALTERADA` | Registro de eventos de tarefa | Instante do evento | `evento-{idEvento}` |
| `SESSAO_ESTUDO` | Sessões de estudo | `inicio` da sessão | `sessao-{idSessao}` |
| `TAREFA_NAO_REALIZADA` | Tarefas com `prazo = NAO_REALIZADA`, calculado | `data` + `horarioInicio` no fuso da pessoa; sem horário, `data` às 23:59 | `nao-realizada-{idTarefa}` |

**Regras de negócio:**

1. Só entram eventos com `ocorridoEm <= agora`.
2. Filtro de período pelo **dia** do `ocorridoEm` no fuso da pessoa.
3. Ordem: `ocorridoEm` decrescente; empate, `id` decrescente (comparando a parte numérica).
4. `comHorario = false` só na não realizada sem horário (dia inteiro): o front mostra o dia, sem
   hora.
5. `titulo` dos eventos é o título da tarefa **quando o evento aconteceu**; `categoria` é a
   categoria **atual** da tarefa.
6. `alteracao` preenchida em `PRIORIDADE_ALTERADA`, `DATA_ALTERADA` e `TAREFA_REABERTA`; `null`
   nos demais.
7. Excluir uma tarefa apaga os eventos dela; excluir ou editar uma sessão muda o registro dela.

**Status HTTP:**

| Status | Quando | `detail` sugerido |
|---|---|---|
| `200` | Sucesso | — |
| `400` | Datas ausentes ou fora do formato | "Informe dataInicial e dataFinal no formato AAAA-MM-DD." |
| `400` | `dataInicial > dataFinal` | "A data inicial precisa ser antes da final." |

`area` com valor desconhecido é ignorada pelo simulador; no backend, `400` ou ignorar é
**A DEFINIR NO BACKEND**.

### 10.2 `GET /historico/{id}`

**Objetivo:** detalhes de um registro, com a tarefa e a sessão **como estão agora**.

**Path parameters:** `id` (texto, obrigatório): `evento-{n}`, `sessao-{n}` ou
`nao-realizada-{n}`. O front codifica o valor com `encodeURIComponent`.

**Response `200`:** `DetalheHistoricoDTO`.

```json
{
  "registro": { "id": "evento-812", "tipo": "PRIORIDADE_ALTERADA", "...": "..." },
  "tarefa": { "id": 42, "titulo": "Levar o carro para a revisão", "...": "..." },
  "sessao": null
}
```

**Regras:** `tarefa` vem com `prazo` calculado, ou `null` se o registro não tem tarefa; `sessao`
vem preenchida só em `SESSAO_ESTUDO` (e em sessões ligadas a tarefa, as duas vêm preenchidas).

**Status HTTP:**

| Status | Quando | `detail` sugerido |
|---|---|---|
| `200` | Encontrado | — |
| `404` | Registro inexistente (tarefa ou sessão excluída) | "Este registro não existe mais. A tarefa ou a sessão pode ter sido excluída." |

**Comportamento no front em `404`:** o modal mostra "Este registro não existe mais." e explica que
a tarefa ou a sessão pode ter sido excluída.

---

## 11. Revisão semanal

### 11.1 `GET /revisao-semanal`

**Objetivo:** tudo o que a tela Revisão semanal mostra, numa chamada só.

**Query parameters:**

| Nome | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `inicioSemana` | data | Sim | **Precisa ser um domingo** |

O front só pede semanas até a atual.

**Response `200`:** `RevisaoSemanalDTO`.

| Campo | Tipo | Regra |
|---|---|---|
| `inicioSemana` | data | Domingo pedido |
| `fimSemana` | data | Sábado (`inicioSemana + 6`) |
| `emAndamento` | booleano | Hoje está dentro da semana |
| `diasDecorridos` | inteiro 0..7 | `0` se a semana é futura; senão `min(7, dias de inicioSemana até hoje + 1)` |
| `resumo` | `ResumoSemanaDTO` | Números desta semana |
| `semanaAnterior` | `ResumoSemanaDTO` | Mesmos números da semana anterior (comparação) |
| `porDia` | 7 × `DiaRevisaoDTO` | De domingo a sábado |
| `estudos` | `EstudosSemanaDTO` | |
| `tarefas` | `TarefasSemanaDTO` | Tarefas planejadas para a semana |
| `proximaSemana` | `ProximaSemanaDTO` | |
| `nota` | `NotaSemanaDTO` ou `null` | |

`ResumoSemanaDTO`:

| Campo | Regra |
|---|---|
| `concluidas` | Tarefas com `dataConclusao` num dia da semana (base: data de conclusão) |
| `criadas` | Eventos `TAREFA_CRIADA` com `ocorridoEm` na semana e até agora |
| `atrasadas` | Tarefas com `data` na semana e `prazo = ATRASADA` |
| `planejadas` | Tarefas com `data` na semana, **até hoje** (na semana em andamento), não canceladas |
| `planejadasConcluidas` | Das `planejadas`, as com `situacao = CONCLUIDA` |
| `taxaConclusao` | `planejadasConcluidas / planejadas` (0 a 1), ou `null` se `planejadas = 0` |
| `minutosEstudo` | Minutos das sessões com início na semana |
| `sessoes` | Quantidade dessas sessões |
| `diasComAtividade` | Dias distintos com sessão **ou** tarefa concluída |

`DiaRevisaoDTO`: `{ data, tarefasConcluidas (pela data de conclusão), minutosEstudo }`.

`EstudosSemanaDTO`:

| Campo | Regra |
|---|---|
| `minutos` | Minutos de estudo na semana |
| `sessoes` | Sessões na semana |
| `porAtividade` | `{ atividade, minutos, sessoes }` das atividades estudadas, por minutos decrescentes e depois por nome |
| `metas` | `ProgressoMetaDTO[]` da semana (mesma regra de 9.2) |

`TarefasSemanaDTO` (tarefas com `data` na semana inteira, não limitada a hoje):

| Campo | Regra |
|---|---|
| `planejadas` | Não canceladas |
| `concluidas` | `situacao = CONCLUIDA` |
| `concluidasComAtraso` | `prazo = CONCLUIDA_COM_ATRASO` |
| `emAberto` | Pendentes ou em andamento com `prazo = NO_PRAZO` |
| `atrasadas` | `prazo = ATRASADA` |
| `naoRealizadas` | `prazo = NAO_REALIZADA` |
| `canceladas` | `situacao = CANCELADA` |
| `pendentes` | `TarefaDTO[]` pendentes ou em andamento, exceto as não realizadas, na ordenação `DATA` |
| `importantesPendentes` | Das `pendentes`, as de prioridade `ALTA` ou `URGENTE` |

`ProximaSemanaDTO`:

| Campo | Regra |
|---|---|
| `inicioSemana`, `fimSemana` | Semana seguinte à pedida |
| `agendadas` | Tarefas pendentes ou em andamento com data nessa semana |
| `altaPrioridade` | Das agendadas, `ALTA` ou `URGENTE` |
| `atrasadasEmAberto` | **Todas** as tarefas com `prazo = ATRASADA` hoje, de qualquer data |
| `tarefas` | As 10 primeiras agendadas, na ordenação `DATA` |

`NotaSemanaDTO`: `{ texto, atualizadoEm }`.

**Status HTTP:**

| Status | Quando | `detail` sugerido |
|---|---|---|
| `200` | Sucesso | — |
| `400` | Ausente, fora do formato ou não é domingo | "Informe inicioSemana como um domingo no formato AAAA-MM-DD." |

**Regras:** destaques, pontos de atenção e textos de comparação são montados no front
(`src/regras/revisaoSemanal.ts`) a partir destes números.

### 11.2 `PUT /revisao-semanal/{inicioSemana}/nota`

**Objetivo:** salvar, alterar ou apagar a nota livre de uma semana.

**Path parameters:** `inicioSemana` (data, domingo).

**Request body:**

```json
{ "texto": "Semana puxada no trabalho, mas mantive o inglês." }
```

| Campo | Tipo | Obrigatório | Regra |
|---|---|---|---|
| `texto` | texto | Sim | Até 1000 caracteres depois de remover os espaços das pontas; vazio apaga a nota |

**Response `200`:** `NotaSemanaDTO` salva, ou corpo `null` quando a nota foi apagada. O front
também aceita `204` sem corpo para a nota apagada; escolher entre os dois é
**A DEFINIR NO BACKEND**.

```json
{ "texto": "Semana puxada no trabalho, mas mantive o inglês.", "atualizadoEm": "2026-09-24T23:10:00.000Z" }
```

**Status HTTP:**

| Status | Quando | `detail` sugerido |
|---|---|---|
| `200` | Salva ou apagada | — |
| `400` | Semana não é domingo | "A semana precisa começar num domingo." |
| `400` | `texto` ausente ou não é texto | "Envie o texto da nota." |
| `400` | Mais de 1000 caracteres | `errors: [{ "campo": "texto", "mensagem": "A nota pode ter até 1000 caracteres." }]` |

**Regras:** uma nota por semana; qualquer semana (passada ou atual) pode ter nota.

---

## 12. Dashboard

### 12.1 `GET /dashboard/resumo`

**Objetivo:** indicadores da semana, distribuição por prioridade, gráficos de produtividade e
atividade recente.

**Query parameters:**

| Nome | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `dataInicial` | data | Sim | Início do período dos gráficos |
| `dataFinal` | data | Sim | Fim do período (o front envia hoje) |

O front pede os últimos 7 ou 30 dias, conforme o período escolhido no painel Produtividade.

**Response `200`:** `ResumoDashboardDTO`.

```json
{
  "dataInicial": "2026-09-18",
  "dataFinal": "2026-09-24",
  "contagens": { "concluidas": 6, "pendentes": 4, "emAndamento": 1, "atrasadas": 4, "urgentes": 1 },
  "concluidasPorDia": [ { "data": "2026-09-18", "quantidade": 2 } ],
  "minutosEstudoPorDia": [ { "data": "2026-09-18", "minutos": 45 } ],
  "distribuicaoPrioridade": [
    { "prioridade": "BAIXA", "quantidade": 12 },
    { "prioridade": "MEDIA", "quantidade": 5 },
    { "prioridade": "ALTA", "quantidade": 3 },
    { "prioridade": "URGENTE", "quantidade": 1 }
  ],
  "eventosRecentes": [
    { "tipo": "TAREFA_CONCLUIDA", "descricao": "Pagar a conta de luz", "ocorridoEm": "2026-09-24T16:50:00.000Z", "referenciaId": 51 }
  ]
}
```

| Campo | Regra |
|---|---|
| `dataInicial`, `dataFinal` | Período pedido (o front usa para montar o eixo do gráfico) |
| `contagens.concluidas` | Tarefas com `dataConclusao` na **semana atual** (domingo a sábado) |
| `contagens.pendentes` | `PENDENTE`, `prazo = NO_PRAZO`, `data` na semana atual |
| `contagens.emAndamento` | `EM_ANDAMENTO`, `prazo = NO_PRAZO`, `data` na semana atual |
| `contagens.atrasadas` | Todas com `prazo = ATRASADA`, de qualquer data |
| `contagens.urgentes` | `URGENTE`, pendente ou em andamento, com qualquer data ou sem data |
| `concluidasPorDia` | Um item por dia do período, pela data de conclusão |
| `minutosEstudoPorDia` | Um item por dia do período, pelo dia do início da sessão |
| `distribuicaoPrioridade` | As quatro prioridades, sempre nesta ordem, contando pendentes e em andamento de qualquer data |
| `eventosRecentes` | Os 6 registros mais recentes da linha do tempo do Histórico dos tipos abaixo |

`EventoRecenteDTO`:

| Campo | Regra |
|---|---|
| `tipo` | `TAREFA_CRIADA`, `TAREFA_CONCLUIDA`, `TAREFA_CANCELADA`, `TAREFA_REABERTA` ou `SESSAO_SALVA` (o `SESSAO_ESTUDO` do histórico). Alterações de prioridade e data e não realizadas ficam de fora |
| `descricao` | Título da tarefa, ou nome da atividade na sessão. A frase ("Você concluiu…") é montada no front |
| `ocorridoEm` | Mesmo instante do Histórico (na sessão, o **início**) |
| `referenciaId` | Id da sessão em `SESSAO_SALVA`; id da tarefa nos demais |

**Status HTTP:** `200`; `400` sem datas ou com `dataInicial > dataFinal` ("Informe um período
válido.").

### 12.2 `GET /dashboard/sequencia`

**Objetivo:** sequência de dias com atividade (streak).

**Query parameters:** `data` (data; opcional, padrão hoje). O front envia hoje.

**Response `200`:** `SequenciaDTO`.

```json
{ "atual": 7, "recorde": 14, "contaHoje": true }
```

| Campo | Regra |
|---|---|
| `atual` | Dias seguidos com atividade terminando em `data` (se `data` tem atividade) ou na véspera (se ainda não tem) |
| `recorde` | Maior sequência já registrada até `data` |
| `contaHoje` | `data` já tem atividade |

Um dia tem atividade quando tem pelo menos uma sessão (pelo início) **ou** uma tarefa concluída
(pela data de conclusão).

**Status HTTP:** `200`; `400` com `data` fora do formato.

---

## 13. Fluxos entre telas sustentados pelo contrato

O front não guarda listas do domínio em estado global. Depois de cada escrita, ele avisa as telas
montadas (`notificarAlteracao`), e elas pedem os dados de novo. Por isso **toda leitura precisa
refletir a escrita imediatamente**: sem cache no backend entre uma chamada e outra.

### 13.1 Criar tarefa

```text
Formulário           POST /tarefas                                 → 201 TarefaDTO
  ↓ notificarAlteracao('tarefas')
Calendário           GET /tarefas/resumo-calendario + GET /tarefas?data=…
Tarefas              GET /tarefas?… (lista e contagens)
Dashboard            GET /dashboard/resumo, /dashboard/sequencia, GET /tarefas (hoje, atrasadas, próximas)
Histórico            GET /historico (novo TAREFA_CRIADA)
Revisão semanal      GET /revisao-semanal (criadas, planejadas, próxima semana)
```

Concluir (`PATCH /situacao`) segue o mesmo caminho e ainda muda a sequência de dias.

### 13.2 Estudar

```text
Detalhes da tarefa   "Iniciar estudo" → PATCH /tarefas/{id}/situacao { EM_ANDAMENTO } (se pendente)
Cronômetro           roda só no navegador (nenhuma chamada)
Finalizar sessão     POST /sessoes → 201 SessaoEstudoDTO
  ↓ notificarAlteracao('sessoes')
Dashboard            /dashboard/resumo (minutos por dia), /dashboard/sequencia, /estudos/mapa-calor, /estudos/progresso-semanal
Estudos              /estudos/resumo, /sessoes, /atividades
Histórico            /historico (SESSAO_ESTUDO)
Revisão semanal      /revisao-semanal (minutos, sessões, metas, dias com atividade)
Calendário           /sessoes?dataInicial=dia&dataFinal=dia
```

### 13.3 Mover atrasadas para hoje

```text
GET /tarefas?prazo=ATRASADA&dataFinal={ontem}   (ou a lista já carregada no Dashboard/Revisão)
POST /tarefas/reagendamentos { itens: [{ id, data: hoje }] }
  → eventos DATA_ALTERADA; prazo recalculado
"Desfazer": POST /tarefas/reagendamentos com as datas originais
```

---

## 14. Pendências do contrato

| # | Assunto | Situação |
|---|---|---|
| C1 | Porta, *context-path* e versão da URL base | A DEFINIR NO BACKEND |
| C2 | Valores de `type` e `title` do `ErrorResponseDTO` | A DEFINIR NO BACKEND |
| C3 | Incluir `errors` nas respostas de validação | A DEFINIR NO BACKEND (recomendado) |
| C4 | `400` ou `422` para regras de negócio | A DEFINIR NO BACKEND (o front aceita os dois) |
| C5 | `tamanho` fora de 1..100 e enums desconhecidos em filtros: ajustar/ignorar ou `400` | A DEFINIR NO BACKEND |
| C6 | Fuso quando `X-Fuso-Horario` falta ou é inválido | A DEFINIR NO BACKEND (sugestão: `America/Sao_Paulo`) |
| C7 | Nota apagada: `200` com `null` ou `204` | A DEFINIR NO BACKEND |
| C8 | Como as categorias são criadas antes da tela de Configurações | Resolvida: cadastro pela tela de Configurações (`POST`, `PUT` e `DELETE /categorias`). Dados iniciais continuam opcionais |
| C9 | Regra R4 × "Mover para hoje" e contagem de recorrentes futuras em "Em aberto por prioridade" | A DEFINIR (decisão do produto; ver [`regras-negocio.md`](regras-negocio.md#12-decisões-pendentes)) |
