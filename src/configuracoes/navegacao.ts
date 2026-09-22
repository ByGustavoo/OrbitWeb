import type { LucideIcon } from 'lucide-react';
import { CalendarDays, ClipboardCheck, History, LayoutDashboard, ListChecks, Settings, Timer } from 'lucide-react';
import { caminhos } from '@/rotas/caminhos';

export interface ItemNavegacao {
  rotulo: string;
  icone: LucideIcon;
  destino: string;
}

export interface SecaoNavegacao {
  titulo?: string;
  itens: ItemNavegacao[];
}

export const navegacaoPrincipal: SecaoNavegacao[] = [
  {
    itens: [{ rotulo: 'Dashboard', icone: LayoutDashboard, destino: caminhos.dashboard }],
  },
  {
    titulo: 'Planejamento',
    itens: [
      { rotulo: 'Calendário', icone: CalendarDays, destino: caminhos.calendario },
      { rotulo: 'Tarefas', icone: ListChecks, destino: caminhos.tarefas },
    ],
  },
  {
    titulo: 'Estudos',
    itens: [
      { rotulo: 'Cronômetro', icone: Timer, destino: caminhos.estudos },
      { rotulo: 'Histórico', icone: History, destino: caminhos.historicoEstudos },
    ],
  },
  {
    titulo: 'Acompanhamento',
    itens: [{ rotulo: 'Revisão semanal', icone: ClipboardCheck, destino: caminhos.revisao }],
  },
];

export const navegacaoRodape: ItemNavegacao = {
  rotulo: 'Configurações',
  icone: Settings,
  destino: caminhos.configuracoes,
};
