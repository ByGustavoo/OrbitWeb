# OrbitWeb — Requisitos do produto

Documento consolidado ao fim da **Fase 01 — Descoberta e entendimento do produto**.
As decisões aqui registradas são requisitos para as próximas fases. Alterá-las exige
aprovação do dono do produto.

## Visão geral

O Orbit é uma aplicação web de **produtividade pessoal**: tarefas, agenda, calendário,
prioridades, cronômetro de estudos e histórico de tempo. Uso **individual, sem login** na
primeira versão (login e múltiplos usuários podem vir no futuro — a arquitetura não deve
impedir isso).

O PrismaWeb (`D:\Projetos\PrismaWeb`) é referência **apenas** de qualidade visual,
organização, sidebar, cards, notificações, animações, tema claro/escuro e responsividade.
Nenhuma funcionalidade financeira entra no Orbit.

## Navegação (sidebar)

Dashboard · Calendário · Tarefas · Estudos · Revisão semanal · Configurações

## Decisões tomadas

| # | Tema | Decisão |
|---|------|---------|
| 1 | Situação "atrasada" | **Calculada** pelo sistema: tarefa pendente ou em andamento com data/horário no passado. Situações escolhidas pelo usuário: pendente, em andamento, concluída, cancelada. |
| 2 | Data da tarefa | **Opcional.** Tarefas sem data ficam numa caixa "Sem data", fora do calendário. |
| 3 | Horário | **Início e fim opcionais**, com opção "dia inteiro". |
| 4 | Recorrência | **Na primeira versão**, ativada por uma opção "Tarefa recorrente" no formulário. Regras em "Regras detalhadas". |
| 5 | Clique no dia do calendário | Abre a **agenda do dia** (painel lateral no desktop, folha inferior no mobile) com "Nova tarefa" já com a data preenchida. |
| 6 | Visões do calendário | **Mês + agenda do dia** na primeira versão. Semana fica para depois. Navegação de ano por seletor mês/ano no cabeçalho. |
| 7 | Login | **Sem login** agora; pode existir no futuro. |
| 8 | Dados antes da API | **Mocks temporários** no front. Todos os DTOs com nomes **em português** (ex.: `titulo`, `prioridade`, `situacao`, `dataConclusao`). |
| 9 | Agrupamento de tarefas | **Categoria com cor** (uma por tarefa), cadastrada pelo usuário. |
| 10 | Tarefas × estudos | A tarefa pode apontar para uma **atividade de estudo**, e o cronômetro pode ser iniciado a partir dela. |
| 11 | Modos do cronômetro | **Livre e Pomodoro** desde a primeira versão. |
| 12 | Cronômetro global | Continua rodando ao trocar de tela ou recarregar; **mini cronômetro no cabeçalho** de todas as telas. |
| 13 | Sessões manuais | Permitido **criar sessão manualmente** e **editar/excluir** sessões salvas. |
| 14 | Metas de estudo | **Metas por atividade** na primeira versão. |
| 15 | Período do Dashboard | **Hoje + semana atual**, com seletor de período (7/30 dias) para os gráficos. |
| 16 | Cancelar × excluir | **Ambos.** Cancelada fica no histórico e fora das pendentes; excluída some. |
| 17 | Lembretes | **Somente dentro do app** (toasts), na primeira versão. |

### Decisões padrão (sem objeção)

- "Urgentes" no Dashboard = prioridade **urgente**, não concluída nem cancelada.
- A data de conclusão é registrada; permite "concluída com atraso" e gráficos.
- pt-BR, fuso do navegador, semana começando no domingo.
- Arrastar tarefas entre dias e subtarefas ficam fora da primeira versão.

## Sugestões aprovadas (entram no escopo)

1. **Mapa de calor no Dashboard**, no mesmo formato do `CalendarioGastos` do PrismaWeb:
   grade de dias agrupada por mês, 5 níveis de intensidade por quartis, dias futuros vazados,
   dia atual destacado, leitura do dia ao passar o mouse e coluna lateral de estatísticas
   com legenda "Menos → Mais".
2. **Sequência de dias** (streak).
3. **Reagendar atrasadas em lote** ("mover todas para hoje").
4. **Paleta de comandos** (`Ctrl+K`) para buscar tarefas e navegar.
5. **Pomodoro** como modo do cronômetro.
6. **Revisão semanal**: concluídas, atrasadas e horas por atividade na semana.

A sugestão de **criação rápida** (atalho `N`) não foi aprovada e fica fora do escopo.

## Regras detalhadas

### Recorrência

| # | Regra |
|---|-------|
| R1 | Frequências: **diária**, **dias da semana escolhidos** (ex.: seg/qua/sex), **semanal**, **mensal** e **anual**. Sem "a cada N". |
| R2 | Término: **nunca** ou **até uma data**. |
| R3 | Ao editar uma recorrente, o usuário escolhe: **"só esta"** ou **"esta e as próximas"**. |
| R4 | Ocorrências passadas não feitas: só a **mais recente** aparece como atrasada; as anteriores viram **"não realizada"** e contam no histórico e na revisão semanal. |
| — | Cada ocorrência tem situação própria: concluir a de hoje não conclui a de amanhã. |

### Estudos

| # | Regra |
|---|-------|
| M1 | Meta **semanal, em horas, por atividade**, com barra de progresso. |
| — | Pomodoro padrão 25 min foco / 5 min pausa curta / 15 min pausa longa a cada 4 ciclos, ajustável em Configurações. Só o tempo de foco conta como estudo. |

### Mapa de calor e sequência

| # | Regra |
|---|-------|
| H1 | O mapa de calor mede **minutos de estudo por dia**. Estatísticas laterais: média diária, maior dia, atividade mais estudada, dias sem estudo. |
| S1 | Um dia conta na sequência com **pelo menos uma sessão de estudo ou uma tarefa concluída**. |

### Outras regras padrão

- Lembrete por tarefa: nenhum (padrão), no horário, 5, 15, 30 ou 60 min antes. Dispara só com o app aberto.
- "Mover todas para hoje" na lista de atrasadas, com confirmação e opção de desfazer no toast.
- Revisão semanal é uma tela própria na sidebar, com atalho no Dashboard.

## Status

Fase 01 concluída. Nenhuma pendência de produto em aberto.
Próxima fase: **Fase 02 — Arquitetura e planejamento técnico** (aguardando autorização).
