import { CalendarDays, ClipboardCheck, History, ListChecks, Settings, Timer } from 'lucide-react';
import { PaginaProvisoria } from './PaginaProvisoria';

export function PaginaCalendario() {
  return (
    <PaginaProvisoria
      titulo="Calendário"
      descricao="Planeje e consulte sua agenda mês a mês."
      icone={CalendarDays}
      proximaEtapa="Aqui vai ficar a grade do mês, com a agenda de cada dia ao lado."
    />
  );
}

export function PaginaTarefas() {
  return (
    <PaginaProvisoria
      titulo="Tarefas"
      descricao="Encontre, filtre e organize todas as suas tarefas."
      icone={ListChecks}
      proximaEtapa="Aqui vai ficar a lista de tarefas, com filtros e as visões Sem data e Atrasadas."
    />
  );
}

export function PaginaEstudos() {
  return (
    <PaginaProvisoria
      titulo="Cronômetro"
      descricao="Estude com foco e acompanhe suas metas da semana."
      icone={Timer}
      proximaEtapa="Aqui vai ficar o cronômetro, nos modos livre e Pomodoro, com as suas atividades de estudo."
    />
  );
}

export function PaginaHistoricoEstudos() {
  return (
    <PaginaProvisoria
      titulo="Histórico de estudos"
      descricao="Veja e corrija o tempo que você estudou."
      icone={History}
      proximaEtapa="Aqui vão aparecer as sessões de estudo por período e por atividade."
    />
  );
}

export function PaginaRevisaoSemanal() {
  return (
    <PaginaProvisoria
      titulo="Revisão semanal"
      descricao="Olhe para a semana que passou e decida o que fazer com o que ficou para trás."
      icone={ClipboardCheck}
      proximaEtapa="Aqui vai aparecer o resumo da semana: concluídas, atrasadas e horas por atividade."
    />
  );
}

export function PaginaConfiguracoes() {
  return (
    <PaginaProvisoria
      titulo="Configurações"
      descricao="Ajuste o tema, o Pomodoro e as suas categorias."
      icone={Settings}
      proximaEtapa="Aqui vão ficar as preferências de aparência, as durações do Pomodoro e as categorias."
    />
  );
}
