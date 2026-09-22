import { AlertTriangle, ArrowDown, ArrowUp, Minus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Prioridade } from '@/modelos/enumeracoes';

export const iconePrioridade: Record<Prioridade, LucideIcon> = {
  BAIXA: ArrowDown,
  MEDIA: Minus,
  ALTA: ArrowUp,
  URGENTE: AlertTriangle,
};
