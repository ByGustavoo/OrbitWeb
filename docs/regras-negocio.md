# Regras de negócio — Orbit

Este documento concentra as regras funcionais do Orbit. Ele descreve o comportamento que o
front-end já implementa (e que o simulador da API reproduz) e que o backend precisa repetir.

Cada regra segue o formato **Regra · Exemplo · Comportamento esperado**. A coluna **Onde** indica
quem é responsável:

- **API** — o backend calcula ou valida; o front confia no resultado.
- **Front** — só o front aplica; o backend não precisa implementar.
- **Ambos** — o front valida para dar retorno imediato, e o backend valida de novo, porque é a
  fonte da verdade.

As funções do front citadas ficam em `src/regras/` e têm testes (`*.test.ts`). O que depende de
uma decisão ainda não tomada está marcado como **A DEFINIR**.

Convenções que valem para todo o documento:

- **Hoje**, **dia** e **semana** são calculados no fuso da pessoa, enviado em todas as requisições
  no cabeçalho `X-Fuso-Horario`.
- A **semana** vai de domingo a sábado.
- **Em aberto** = situação `PENDENTE` ou `EM_ANDAMENTO`.

---

## 1. Tarefa

| # | Regra | Exemplo | Comportamento esperado | Onde |
|---|---|---|---|---|
| T1 | O título é obrigatório, com até 120 caracteres, sem os espaços das pontas. | "  Ir ao mercado  " | Salva "Ir ao mercado". Título vazio é recusado com "Informe um título para a tarefa." | Ambos |
| T2 | A descrição é opcional, com até 2000 caracteres. Descrição só com espaços vira vazia. | "   " | Salva `descricao = null`. | Ambos |
| T3 | A data é opcional. Tarefa sem data fica fora do calendário e das tarefas de hoje, e aparece em Tarefas › Sem data. | "Trocar a lâmpada da sala", sem data | Não aparece no Calendário; aparece em "Sem data". | Ambos |
| T4 | Horários exigem data. O fim exige início e precisa ser depois dele. | Início 19:00, fim 18:30 | Recusado: "O fim precisa ser depois do início (19:00)." | Ambos |
| T5 | "Dia inteiro" apaga os horários. Com data e sem nenhum horário, a tarefa é de dia inteiro. | Data 24/09, sem horários | `diaInteiro = true`, horários `null`. | Ambos |
| T6 | O lembrete é opcional: no horário, 5, 15, 30 ou 60 minutos antes. Exige data e horário de início (não vale em dia inteiro). | Consulta às 14:00, lembrete 30 min | Lembrete às 13:30. Sem horário de início, o lembrete é descartado. | Ambos |
| T7 | A tarefa pode ter uma categoria (opcional). A categoria precisa existir. | Categoria "Saúde" | Categoria excluída entre abrir e salvar o formulário: "Esta categoria não existe mais. Escolha outra." | Ambos |
| T8 | A tarefa pode apontar para uma atividade de estudo (opcional), que precisa existir e não estar arquivada. | "Fazer a lição 12" ligada a "Inglês" | Nos detalhes aparece "Iniciar estudo". | Ambos |
| T9 | A prioridade padrão é `MEDIA`; a situação padrão é `PENDENTE`. | Nova tarefa sem mexer nesses campos | Salva `MEDIA` e `PENDENTE`. | Front (valores iniciais do formulário) |

---

## 2. Prazo: atrasada e não realizada

`Prazo` é **calculado pela API a cada leitura** e nunca é enviado pelo front
(`src/regras/prazo.ts` → `calcularPrazo`, `marcarNaoRealizadas`).

**Limite da tarefa:**

- com horário de fim: a data da tarefa, no horário de fim;
- sem horário de fim (só início, ou dia inteiro): o fim do dia (00:00 do dia seguinte).

| # | Regra | Exemplo | Comportamento esperado | Onde |
|---|---|---|---|---|
| P1 | Tarefa sem data e não concluída tem prazo `SEM_DATA`. | "Trocar a lâmpada", sem data, pendente | `SEM_DATA` | API |
| P2 | Tarefa em aberto fica `ATRASADA` quando o instante atual chega ao limite; antes disso, `NO_PRAZO`. | "Enviar o relatório", hoje, 17:00–18:00; agora 18:00 | `ATRASADA` a partir das 18:00 | API |
| P3 | Sem horário de fim, a tarefa só atrasa quando o dia termina. | "Pagar a conta de luz", hoje, dia inteiro | `NO_PRAZO` até 23:59; `ATRASADA` a partir de 00:00 de amanhã | API |
| P4 | Tarefa cancelada com data tem prazo `NO_PRAZO` (nunca atrasa). Sem data, `SEM_DATA`. | Consulta cancelada ontem | `NO_PRAZO` | API |
| P5 | Tarefa concluída depois do limite é `CONCLUIDA_COM_ATRASO`; até o limite, `CONCLUIDA_NO_PRAZO`. Sem data, `CONCLUIDA_NO_PRAZO`. | Limite 18:00, concluída às 18:20 | `CONCLUIDA_COM_ATRASO` | API |
| P6 | **R4 — não realizada:** numa série recorrente, só a ocorrência atrasada **mais recente** (por data e horário de início) é `ATRASADA`; as anteriores ainda em aberto são `NAO_REALIZADA`. | "Academia" seg/qua/sex, nenhuma feita desde segunda; hoje sexta à noite | Sexta: `ATRASADA`; segunda e quarta: `NAO_REALIZADA` | API |
| P7 | Não realizada não é atrasada: não entra em "Atrasadas", nem em "Mover para hoje", nem no contador de atrasadas. Aparece no Histórico no dia em que venceu. | A "Academia" de segunda do exemplo acima | Aparece em Histórico › segunda como "Tarefa não realizada". | API |
| P8 | Uma tarefa de hoje com o horário vencido é atrasada, mas **não precisa de nova data**: só as atrasadas de dias anteriores entram em "Mover para hoje" (`precisaDeNovaData`). | "Enviar o relatório" de hoje, 17:00–18:00, às 19:00 | Aparece em "Hoje" com o selo de atraso; não aparece no grupo "Atrasadas de dias anteriores". | Front |

---

## 3. Situação e ciclo de vida

| # | Regra | Exemplo | Comportamento esperado | Onde |
|---|---|---|---|---|
| S1 | As situações são escolhidas pela pessoa: `PENDENTE`, `EM_ANDAMENTO`, `CONCLUIDA`, `CANCELADA`. Qualquer transição é permitida. | Concluída → pendente | Permitido (reabrir). | API |
| S2 | Concluir registra `dataConclusao` (instante atual); qualquer outra situação limpa esse campo. | Concluir às 10:15 e reabrir às 11:00 | `dataConclusao` 10:15; depois `null`. | API |
| S3 | Criar uma tarefa já concluída também registra `dataConclusao`. | Lançar "Pagar o aluguel" já como concluída | `dataConclusao` = instante da criação. | API |
| S4 | Mudar para a mesma situação não altera nada. | Concluir uma tarefa já concluída | Sem evento novo, `atualizadoEm` igual. | API |
| S5 | **Cancelar × excluir:** cancelada continua existindo, fica fora de pendentes e atrasadas, e aparece no Histórico e na Revisão. Excluída some de tudo, inclusive dos eventos. | Cancelar "Consulta no dentista" | Aparece riscada no Histórico; não conta como pendente. | API |
| S6 | Concluir tem "Desfazer": o front envia de volta a situação anterior (inclusive `EM_ANDAMENTO`). | Concluir por engano e clicar em "Desfazer" | A tarefa volta a "em andamento"; o Histórico mostra "concluída" e "reaberta". | Front + API |
| S7 | Excluir sempre pede confirmação e lembra que cancelar mantém o histórico. | — | Diálogo de confirmação antes do `DELETE`. | Front |
| S8 | Não há atualização otimista: a tela só mostra a mudança depois que a API confirma. | Clicar em concluir com a API lenta | O item mostra "enviando" até a resposta. | Front |

---

## 4. Recorrência

Regras em `src/regras/recorrencia.ts`; geração e manutenção das séries no simulador em
`src/dados/simulacao/series.ts`.

| # | Regra | Exemplo | Comportamento esperado | Onde |
|---|---|---|---|---|
| R1 | Frequências: diária, dias da semana escolhidos, semanal, mensal e anual. Não existe "a cada N". | — | — | Ambos |
| R2 | Término: nunca, ou até uma data (`dataFim >= data`). | "Praticar inglês", diária, até 30/11 | Última ocorrência em 30/11. | Ambos |
| R3 | A recorrência exige data: a data da tarefa é a primeira ocorrência. | — | Sem data: "Escolha a data da primeira ocorrência para repetir a tarefa." | Ambos |
| R4 | Dias da semana: pelo menos um. A primeira ocorrência é sempre a data escolhida, mesmo que não caia num dos dias marcados. | Data quinta, dias seg/qua | Ocorrências: quinta (primeira), depois só segundas e quartas. | API |
| R5 | Semanal repete no mesmo dia da semana da primeira ocorrência, a cada 7 dias. | Primeira numa terça | Toda terça. | API |
| R6 | Mensal repete no mesmo dia do mês; em meses sem esse dia, cai no último dia. | Dia 31 | 31/10, 30/11, 31/12, 28/02 (ou 29 em ano bissexto). | API |
| R7 | Anual repete no mesmo dia e mês; 29/02 cai em 28/02 nos anos não bissextos. | Aniversário em 29/02 | 28/02 nos anos comuns. | API |
| R8 | **Cada ocorrência é uma tarefa real** no banco, ligada às irmãs pelo mesmo `serieId`, com situação própria. | Concluir a "Academia" de hoje | A de amanhã continua pendente. | API |
| R9 | Ao criar a série, as ocorrências são geradas de `data + 1` até o menor entre `dataFim` e **hoje + 12 meses**. Séries sem término são estendidas quando o que já foi gerado fica a menos de 3 meses de acabar, de novo até hoje + 12 meses. | "Academia" sem término criada hoje | Ocorrências até daqui a 12 meses; estendidas com o tempo. | API |
| R10 | Ocorrências geradas começam pendentes, sem conclusão, e não registram "Tarefa criada" (só a primeira registra). | — | O Histórico mostra um "Tarefa criada" por série. | API |
| R11 | **Editar "só esta"** altera apenas a ocorrência, que continua na série. Não permite mudar a regra de repetição. | Mudar o horário da "Academia" de hoje | Só a de hoje muda. Mudar a frequência com "só esta" é recusado: "Para mudar a repetição, aplique a alteração a esta e às próximas." | Ambos |
| R12 | **Editar "esta e as próximas" sem mudar regra nem data** aplica título, descrição, horários, dia inteiro, prioridade, categoria, atividade e lembrete a esta e a todas as seguintes da série. A situação muda só nesta. | Renomear "Academia" para "Musculação" | Esta e as seguintes passam a "Musculação". | API |
| R13 | **Editar "esta e as próximas" mudando regra ou data** encerra a série antiga na véspera, exclui as seguintes pendentes ou em andamento, **preserva as concluídas e canceladas** e, se ainda houver recorrência, começa uma série nova a partir desta (sem gerar ocorrências nas datas preservadas). | Trocar seg/qua/sex por ter/qui a partir de hoje | Antigas até ontem ficam; as futuras em aberto somem; nova série ter/qui a partir de hoje. | API |
| R14 | **Excluir "esta e as próximas"** exclui esta e as seguintes em aberto e encerra a série na véspera. As seguintes concluídas ou canceladas continuam. | Parar a "Academia" a partir de hoje | Série termina ontem. | API |
| R15 | Excluir ou editar uma ocorrência sempre pergunta o escopo. Se a regra mudou, "Só esta" fica indisponível e o motivo aparece. | — | Diálogo "Só esta / Esta e as próximas". | Front |

---

## 5. Prioridade

| # | Regra | Exemplo | Comportamento esperado | Onde |
|---|---|---|---|---|
| PR1 | Ordem de importância: `BAIXA` < `MEDIA` < `ALTA` < `URGENTE`. | — | Usada na ordenação por prioridade e em `maiorPrioridade` do calendário. | API |
| PR2 | **Urgentes** = prioridade `URGENTE` em aberto, com qualquer data ou sem data. | "Renovar o documento", urgente, sem data | Conta em "Urgentes" no Dashboard. | API |
| PR3 | **Importantes** = prioridade `ALTA` ou `URGENTE`. Usado na Revisão semanal ("importantes pendentes") e em "alta prioridade" da próxima semana. | — | — | API |
| PR4 | Prioridade nunca é comunicada só por cor: sempre há ícone e texto. | — | Selo "Alta" com seta. | Front |
| PR5 | Mudar a prioridade registra o evento "Prioridade alterada" com o valor anterior e o novo. | Baixa → Média | Histórico: "Baixa → Média". | API |

---

## 6. Reagendamento em lote ("Mover para hoje")

| # | Regra | Exemplo | Comportamento esperado | Onde |
|---|---|---|---|---|
| M1 | Só atrasadas de dias anteriores são movidas (ver P8). | 3 atrasadas de ontem e 1 atrasada de hoje | Move 3; o aviso informa 3. | Front |
| M2 | Só a data muda; horário, prioridade, situação e série continuam iguais. | "Enviar o relatório", 17:00, de ontem | Vai para hoje às 17:00. | API |
| M3 | Pede confirmação antes e oferece "Desfazer" depois, que reenvia as datas originais. | — | — | Front |
| M4 | A operação é tudo ou nada: se uma tarefa não existir mais, nenhuma muda. | Uma das tarefas foi excluída em outra aba | Erro 404 "Uma das tarefas não existe mais."; nada muda. | API |
| M5 | Cada tarefa movida registra "Data alterada". | — | — | API |

---

## 7. Estudos

### 7.1 Atividades

| # | Regra | Exemplo | Comportamento esperado | Onde |
|---|---|---|---|---|
| A1 | Nome obrigatório, até 40 caracteres, espaços extras reduzidos. | "  Leitura   de  livros " | Salva "Leitura de livros". | Ambos |
| A2 | Nome único entre as atividades **não arquivadas**, sem diferenciar maiúsculas. | Já existe "Inglês"; criar "inglês" | Conflito: "Já existe uma atividade chamada “Inglês”. Escolha outro nome." | Ambos |
| A3 | Cor obrigatória, da paleta fixa de 9 cores. | — | — | Ambos |
| A4 | Meta semanal opcional, em minutos, maior que 0 e até 100 horas. | Meta de 3 h | `metaSemanalMinutos = 180`. | Ambos |
| A5 | **Com sessões, a atividade é arquivada; sem sessões, pode ser excluída.** | Excluir "Violão", que tem 2 sessões | Conflito: "Esta atividade tem sessões registradas. Arquive-a para manter o histórico." | API |
| A6 | Arquivada some do cronômetro e das metas, não aceita sessão nova nem tarefa nova, e mantém o histórico. | — | — | Ambos |
| A7 | Desarquivar é recusado se já houver uma atividade ativa com o mesmo nome. | — | Conflito: "Já existe uma atividade ativa chamada “Nome”. Renomeie uma delas antes de desarquivar." | API |
| A8 | Excluir uma atividade deixa as tarefas ligadas a ela sem atividade. | — | `atividade = null` nessas tarefas. | API |

### 7.2 Sessões

| # | Regra | Exemplo | Comportamento esperado | Onde |
|---|---|---|---|---|
| SE1 | Toda sessão tem atividade, início, fim e duração efetiva. | — | — | Ambos |
| SE2 | Duração mínima de 1 minuto e máxima de 24 horas. | Cronômetro parado em 40 s | O resumo avisa que a sessão não será salva. | Ambos |
| SE3 | A duração efetiva não passa do intervalo entre início e fim (tolerância de 1 s); pode ser menor, porque pausas não contam. | 19:00–20:00 com 10 min de pausa | `duracaoSegundos = 3000`. | Ambos |
| SE4 | A sessão não começa nem termina no futuro (tolerância de 1 minuto). | Lançar uma sessão para amanhã | Recusada. | Ambos |
| SE5 | **A sessão conta no dia do início**, mesmo que passe da meia-noite. | 23:30 → 00:20 | Conta no dia em que começou. | API |
| SE6 | Observação opcional, até 500 caracteres. | — | — | Ambos |
| SE7 | Sessões podem ser lançadas à mão (origem `MANUAL`), editadas e excluídas. Na edição, modo, origem e tarefa ligada não mudam. | Corrigir a duração de uma sessão do cronômetro | Continua com origem `CRONOMETRO`. | API |
| SE8 | Tempo agregado em minutos arredonda **cada sessão** para o minuto mais próximo e depois soma. | Duas sessões de 90 s | 2 + 2 = 4 minutos. | API |

### 7.3 Cronômetro (só no front)

O backend não participa do cronômetro: recebe a sessão pronta em `POST /sessoes`
(`src/regras/cronometro.ts`, `src/provedores/ProvedorCronometro.tsx`).

| # | Regra | Exemplo | Comportamento esperado | Onde |
|---|---|---|---|---|
| C1 | Só existe uma sessão em andamento por vez; não dá para trocar de atividade com ela rodando. | — | — | Front |
| C2 | O tempo é recalculado a partir de marcos de tempo, nunca somado num contador: aba em segundo plano, suspensão ou recarregar a página não perdem tempo. | Recarregar no meio da sessão | O cronômetro continua do ponto certo. | Front |
| C3 | A sessão em andamento fica no navegador (`localStorage`) e sincroniza entre abas. | — | — | Front |
| C4 | **Pomodoro:** foco de 25 min, pausa curta de 5 min, pausa longa de 15 min a cada 4 focos. Só o foco conta como estudo. Cada fase começa só com confirmação. | 2 focos completos | `duracaoSegundos = 3000`, `ciclosConcluidos = 2`. | Front |
| C5 | As durações do Pomodoro são fixas até existir a tela de Configurações. | — | Tornar ajustável: **A DEFINIR** (tela de Configurações). | Front |
| C6 | Finalizar abre um resumo com duração, horário e observação; a duração pode ser corrigida antes de salvar. | Cronômetro esquecido ligado | Corrige para o tempo real. | Front |
| C7 | Se salvar falhar, a sessão continua guardada no navegador até ser salva ou descartada. | Servidor fora do ar | "Ela continua guardada neste navegador." | Front |
| C8 | Descartar pede confirmação a partir de 1 minuto. | — | — | Front |
| C9 | **Iniciar estudo a partir de uma tarefa** liga a sessão à tarefa e muda uma tarefa pendente para "em andamento". Concluir a tarefa continua manual. | "Fazer a lição 12" pendente | Passa a "em andamento"; a sessão salva traz `tarefaId`. | Front (chama `PATCH /situacao`) |

### 7.4 Metas

| # | Regra | Exemplo | Comportamento esperado | Onde |
|---|---|---|---|---|
| ME1 | Meta semanal por atividade; o progresso soma os minutos das sessões com início de domingo a sábado. | Meta 3 h, 95 min estudados | 95 de 180 min. | API |
| ME2 | Só atividades não arquivadas e com meta aparecem nas metas. Com meta e sem estudo, aparecem com 0. | — | — | API |
| ME3 | Meta batida quando os minutos realizados alcançam a meta. Em semanas encerradas, o texto diz "Faltaram" em vez de "Faltam". | — | — | Front |

---

## 8. Histórico e eventos

| # | Regra | Exemplo | Comportamento esperado | Onde |
|---|---|---|---|---|
| H1 | Operações de tarefa registram eventos: criada, concluída, cancelada, reaberta, prioridade alterada e data alterada (inclusive por "Mover para hoje"). Título, descrição e categoria **não** geram evento. | Renomear uma tarefa | Nenhum evento novo. | API |
| H2 | Reabrir mantém o evento "concluída" e acrescenta "reaberta" (com a situação anterior e a nova). Gráficos e sequência usam só a `dataConclusao` atual, então não contam em dobro. | Concluir, reabrir e concluir de novo | Três eventos; a tarefa conta uma vez nos gráficos, no dia da última conclusão. | API |
| H3 | Sessões aparecem no Histórico a partir das próprias sessões, no instante do início. Editar ou excluir uma sessão muda o Histórico. | — | — | API |
| H4 | Não realizadas (P6) aparecem no dia em que venceram, no horário de início, ou sem horário se forem de dia inteiro. | — | — | API |
| H5 | O título mostrado é o do momento do evento; a categoria é a atual. Os detalhes avisam quando a tarefa mudou de nome. | Tarefa renomeada depois de concluída | O registro mostra o nome antigo. | API + Front |
| H6 | Excluir uma tarefa apaga os eventos dela. | — | Some do Histórico. | API |
| H7 | Eventos futuros não aparecem. | — | Só `ocorridoEm <= agora`. | API |
| H8 | Filtros: área (Tudo, Tarefas, Estudos), período (Hoje, Ontem, Últimos 7 dias, Últimos 30 dias, Este mês, Personalizado; padrão 7 dias) e busca no título, na categoria ou na atividade. No período personalizado, a data inicial nunca passa da final. | — | — | Front (período) + API (filtro) |

---

## 9. Dashboard

| # | Regra | Exemplo | Comportamento esperado | Onde |
|---|---|---|---|---|
| D1 | **Concluídas:** tarefas com data de conclusão na semana atual. | — | — | API |
| D2 | **Pendentes:** pendentes no prazo com data na semana atual; o contexto mostra quantas estão em andamento (mesma regra, situação `EM_ANDAMENTO`). | — | — | API |
| D3 | **Atrasadas:** todas com prazo `ATRASADA`, de qualquer data. | — | "já passaram do prazo". | API |
| D4 | **Urgentes:** ver PR2. | — | — | API |
| D5 | **Em aberto por prioridade:** pendentes e em andamento de qualquer data, por prioridade. | — | Inclui ocorrências futuras de recorrentes (ver 12, pendência 2). | API |
| D6 | **Produtividade:** tarefas concluídas por dia (pela data de conclusão) e minutos de estudo por dia (pelo início da sessão), nos últimos 7 ou 30 dias. O período vale só para esse painel. | — | Um ponto por dia, inclusive zerados. | API |
| D7 | **Atividade recente:** os 6 registros mais recentes do Histórico entre criadas, concluídas, canceladas, reabertas e sessões. Numa sessão, o instante é o início (o mesmo do Histórico). | — | — | API |
| D8 | **Mapa de calor:** minutos de estudo por dia nos últimos 6 meses; 5 níveis por quartis dos dias com estudo, dias futuros vazados, hoje destacado. | — | Níveis calculados no front (`src/regras/escalaCalor.ts`). | API (dados) + Front (níveis) |
| D9 | **Tarefas de hoje** não mostra canceladas; atrasadas de dias anteriores ficam num grupo próprio com "Mover todas para hoje". | — | — | Front |

---

## 10. Sequência de dias

| # | Regra | Exemplo | Comportamento esperado | Onde |
|---|---|---|---|---|
| SQ1 | Um dia conta na sequência quando tem pelo menos uma sessão de estudo (pelo início) **ou** uma tarefa concluída (pela data de conclusão). | Só concluiu "Pagar a conta de luz" | O dia conta. | API |
| SQ2 | Se hoje ainda não tem atividade, a sequência que vem até ontem continua valendo; ela só quebra quando um dia termina vazio. | Estudou de segunda a quinta; sexta de manhã | Sequência 4, `contaHoje = false`. | API |
| SQ3 | O recorde é a maior sequência já registrada. | — | — | API |

---

## 11. Revisão semanal

| # | Regra | Exemplo | Comportamento esperado | Onde |
|---|---|---|---|---|
| RS1 | Duas bases, cada uma com nome: **concluídas** pela data de conclusão (igual ao Dashboard) e **planejadas** pelas tarefas com data na semana. | Tarefa de segunda concluída na terça da semana seguinte | Conta em "concluídas" na semana seguinte; em "planejadas" na semana de segunda. | API |
| RS2 | **Taxa de conclusão** = planejadas concluídas ÷ planejadas não canceladas. Na semana em andamento, só as planejadas até hoje. Sem planejadas, não há taxa. | 4 de 5 planejadas concluídas | 80%. | API |
| RS3 | A comparação com a semana anterior é neutra ("3 a mais que na semana anterior"), sem cor de melhor ou pior. A taxa compara em pontos percentuais. | — | — | Front |
| RS4 | A navegação vai até a semana atual; o futuro aparece em "Próxima semana", completa só na semana atual. | — | — | Front |
| RS5 | Destaques e pontos de atenção só aparecem com número maior que zero e usam frases factuais. | — | `src/regras/revisaoSemanal.ts`. | Front |
| RS6 | "Dia com atividade" segue SQ1. | — | — | API |
| RS7 | "Tarefas criadas" vem dos eventos "Tarefa criada". | — | — | API |
| RS8 | Nota da semana: texto livre, até 1000 caracteres, uma por semana, editável em qualquer semana; texto vazio apaga a nota. | — | — | Ambos |

---

## 12. Decisões pendentes

| # | Assunto | Situação atual | Sugestão registrada | Status |
|---|---|---|---|---|
| 1 | **Regra R4 × "Mover para hoje"** | Ao mover a ocorrência atrasada mais recente de uma série, a anterior ("não realizada") passa a ser a mais recente em atraso e volta a aparecer como atrasada; o dia fica com duas ocorrências da mesma série. | Considerar "não realizada" toda ocorrência que tenha outra da mesma série com data até hoje. | **A DEFINIR** (dono do produto) |
| 2 | **"Em aberto por prioridade" com recorrentes** | Conta as ocorrências futuras, geradas 12 meses à frente (uma série três vezes por semana soma mais de 150 tarefas). | Contar só até o fim da próxima semana, ou contar cada série uma vez. | **A DEFINIR** (dono do produto) |
| 3 | **Configurações** | A tela existe como provisória. | Tema, durações do Pomodoro e cadastro de categorias. | **A DEFINIR** (fase futura) |
| 4 | **Cadastro de categorias** | O front só lê categorias. | Depende da tela de Configurações. | **A DEFINIR** |
| 5 | **Paleta de comandos (`Ctrl+K`)** | Aprovada nos requisitos, não implementada. | — | **A DEFINIR** (fase futura) |

---

## 13. Regras que existem só no front

Estas regras são de apresentação ou de estado local e **não** precisam existir no backend:

- cronômetro, Pomodoro e sessão em andamento (7.3);
- lembretes: disparam só com o app aberto, uma vez por tarefa e horário, até 10 minutos depois do
  momento previsto, e só para tarefas em aberto (`src/regras/lembrete.ts`);
- níveis do mapa de calor (D8);
- textos de destaques, pontos de atenção e comparação da Revisão semanal (RS3, RS5);
- intervalos de período do Histórico (H8);
- decidir quais atrasadas precisam de nova data (P8).

Todas as demais regras deste documento precisam ser implementadas (ou validadas de novo) pela API.
