export const rotasApi = {
  tarefas: {
    lista: '/tarefas',
    porId: (id: number) => `/tarefas/${id}`,
    situacao: (id: number) => `/tarefas/${id}/situacao`,
    reagendamentos: '/tarefas/reagendamentos',
    resumoCalendario: '/tarefas/resumo-calendario',
  },
  estudos: {
    progressoSemanal: '/estudos/progresso-semanal',
    mapaCalor: '/estudos/mapa-calor',
  },
  dashboard: {
    resumo: '/dashboard/resumo',
    sequencia: '/dashboard/sequencia',
  },
} as const;
