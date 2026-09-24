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

Dashboard · Tarefas · Calendário · Estudos · Histórico · Revisão semanal · Configurações

*Fase 07: o Histórico fica na seção Acompanhamento, ao lado da Revisão semanal.*

## Decisões tomadas

| # | Tema | Decisão |
|---|------|---------|
| 1 | Situação "atrasada" | **Calculada** pelo sistema: tarefa pendente ou em andamento com data/horário no passado. Situações escolhidas pelo usuário: pendente, em andamento, concluída, cancelada. |
| 2 | Data da tarefa | **Opcional.** Tarefas sem data ficam numa caixa "Sem data", fora do calendário. |
| 3 | Horário | **Início e fim opcionais**, com opção "dia inteiro". |
| 4 | Recorrência | **Na primeira versão**, ativada por uma opção "Tarefa recorrente" no formulário. Regras em "Regras detalhadas". |
| 5 | Clique no dia do calendário | Abre a **agenda do dia** (painel lateral no desktop; **lista abaixo da grade** no tablet e no celular) com "Nova tarefa" já com a data preenchida. *Revisada na Fase 05: a folha inferior no celular deu lugar à lista abaixo da grade.* |
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

## Decisões da Fase 06 — Cronômetro e estudos

| # | Tema | Decisão |
|---|------|---------|
| F6-1 | Pomodoro | **Entra nesta fase**: foco de 25 min, pausa curta de 5, pausa longa de 15 a cada 4 ciclos. Cada fase só começa com confirmação. As durações ficam fixas até existir a tela de Configurações. |
| F6-2 | Histórico e sessões manuais | **Histórico recente na página Estudos** (últimos 7 dias, agrupados por dia), com **editar, excluir e lançar sessão manual**. *Revisada na Fase 07: a tela `/estudos/historico` deu lugar ao Histórico geral em `/historico` (F7-1).* |
| F6-3 | Finalizar | Abre um **resumo** com atividade, duração, horário e observação opcional, com "Salvar sessão" e "Continuar estudando". Com menos de 1 minuto, o resumo avisa que a sessão não será salva. |
| F6-4 | Estudo a partir de tarefa | Botão **"Iniciar estudo"** nos detalhes de uma tarefa com atividade. A sessão fica ligada à tarefa, e uma tarefa **pendente passa para "em andamento"**. Concluir a tarefa continua manual. |
| F6-5 | Gestão de atividades | **Criar e editar** (nome, cor, meta semanal opcional). Com sessões, a atividade é **arquivada**; sem sessões, pode ser **excluída**. Arquivadas ficam numa seção recolhida. |
| F6-6 | Métricas | **Hoje · Esta semana · Sessões na semana · Média por sessão** (semana de domingo a sábado). Cada atividade mostra o tempo da semana contra a meta, o tempo total, o número de sessões e o último estudo. |
| F6-7 | Dashboard | **Nenhum bloco novo.** Gráficos, mapa de calor, metas e sequência refletem cada sessão salva na hora; o mini cronômetro mostra a sessão em andamento. |

Decisões padrão, sem objeção: não dá para trocar de atividade nem iniciar outra sessão com uma em
andamento; descartar pede confirmação a partir de 1 minuto; sessão que passa da meia-noite conta
no dia em que começou; se salvar falhar, a sessão continua guardada no navegador até salvar ou
descartar; nome de atividade obrigatório, único (sem diferenciar maiúsculas nem espaços extras) e
com até 40 caracteres; a última atividade usada já vem selecionada.

### Sugestões aprovadas na Fase 06

1. **Ajustar a duração no resumo** antes de salvar (cronômetro esquecido ligado).
2. **Tempo no título da aba** enquanto a sessão roda.
3. **Sessões de estudo na agenda do dia** do Calendário.

O atalho **Espaço** para pausar e retomar não foi aprovado.

## Decisões da Fase 07 — Histórico

| # | Tema | Decisão |
|---|------|---------|
| F7-1 | Onde fica | **`/historico` geral**, com tarefas e estudos, na seção **Acompanhamento** do menu, ao lado da Revisão semanal. O item "Histórico" sai de Estudos, e `/estudos/historico` redireciona para `/historico` já filtrado em Estudos. |
| F7-2 | Alterações registradas | **Prioridade alterada, data alterada** (inclusive no "Mover todas para hoje"), **cancelada** e **reaberta**. Título, descrição e categoria não geram evento. |
| F7-3 | Reabrir | **Mantém** o evento "Tarefa concluída" e acrescenta "Tarefa reaberta". Gráficos e sequência contam só a conclusão atual. |
| F7-4 | Filtros | **Tudo · Tarefas · Estudos**, período e busca por texto. |
| F7-5 | Detalhes | **Somente leitura**, com "Abrir tarefa" (detalhes da tarefa) e "Editar sessão" (formulário de sessão). |
| F7-6 | Não realizadas | Ocorrências **não realizadas** (regra R4) aparecem no Histórico, no dia em que venceram. |

Decisões padrão, sem objeção: período padrão de 7 dias; opções Hoje, Ontem, Últimos 7 dias, Últimos
30 dias, Este mês e Personalizado; "Mostrar mais registros" no fim da lista; busca feita no serviço;
sessões vindas das próprias sessões salvas, então editar ou excluir uma sessão já muda o Histórico;
tarefa excluída some do Histórico (decisão 16); o título mostrado é o do momento do evento; cada tipo
de evento tem ícone e texto próprios, nunca só cor.

O Dashboard ganhou o atalho "Ver histórico" em "Atividade recente", e a página Estudos, "Ver
histórico completo" no fim do histórico recente.

## Decisões da Fase 08 — Revisão semanal

| # | Tema | Decisão |
|---|------|---------|
| F8-1 | Base dos números | **Duas bases nomeadas**: "concluídas" pela data de conclusão (igual ao Dashboard) e "planejadas para a semana" pelas tarefas com data na semana. Taxa de conclusão = planejadas concluídas ÷ planejadas não canceladas; na semana em andamento, só até hoje. |
| F8-2 | Semana inicial | **Semana atual**, com aviso de semana em andamento. |
| F8-3 | Semanas futuras | Navegação **até a semana atual**. |
| F8-4 | Próxima semana | Completa **só na semana atual**; nas passadas, atalho para a semana seguinte. |
| F8-5 | Comparação | **Neutra**, com a semana anterior, abaixo de cada número do resumo. |
| F8-6 | Metas | Tempo da semana contra a meta de cada atividade. |
| F8-7 | Atrasadas | Lista do que continua em aberto com **"Mover as atrasadas para hoje"**. |
| F8-8 | Gráfico | **Dois gráficos lado a lado**: tarefas concluídas por dia e tempo de estudo por dia. |

### Sugestão aprovada na Fase 08

1. **Nota da semana**: texto livre por semana, até 1.000 caracteres, salvo pelo botão "Salvar
   nota" e editável em qualquer semana.

Decisões padrão, sem objeção: semana de domingo a sábado; "dia com atividade" segue a regra S1;
"importantes" = prioridade alta ou urgente; destaques e pontos de atenção só com número maior que
zero, em frases factuais, sem julgamento.

## Esclarecimento da Fase 09 — Auditoria

Tarefa de hoje com o horário vencido continua **atrasada** (decisão 1), mas só as atrasadas de
**dias anteriores** entram em "Mover para hoje": mudar a data de uma tarefa que já é de hoje não
resolve nada. No Dashboard elas ficam no grupo "Hoje", com o selo de atraso.

### Pendências para o dono do produto

| # | Tema | Situação atual | Sugestão |
|---|------|----------------|----------|
| P1 | Regra R4 × "Mover para hoje" | Ao mover a ocorrência atrasada mais recente de uma recorrente, a anterior ("não realizada") volta a aparecer como atrasada, e o dia fica com duas ocorrências da mesma série. | Considerar "não realizada" toda ocorrência que tenha outra da mesma série com data até hoje. |
| P2 | "Em aberto por prioridade" no Dashboard | Conta as ocorrências futuras das recorrentes, geradas 12 meses à frente (só "Academia" soma mais de 150 tarefas "Baixa"). | Contar só até o fim da próxima semana, ou contar cada série uma vez. |

## Status

Fase 09 concluída (detalhes na seção 21 do `ARQUITETURA.md`). Pendências P1 e P2 aguardando decisão.
Próxima fase: **Fase 10** (aguardando autorização).
