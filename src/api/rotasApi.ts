export const rotasApi = {
  tarefas: {
    lista: '/tarefas',
    porId: (id: number) => `/tarefas/${id}`,
    situacao: (id: number) => `/tarefas/${id}/situacao`,
    reagendamentos: '/tarefas/reagendamentos',
    resumoCalendario: '/tarefas/resumo-calendario',
  },
  categorias: {
    lista: '/categorias',
  },
  atividades: {
    lista: '/atividades',
    porId: (id: number) => `/atividades/${id}`,
    arquivamento: (id: number) => `/atividades/${id}/arquivamento`,
  },
  sessoes: {
    lista: '/sessoes',
    porId: (id: number) => `/sessoes/${id}`,
  },
  estudos: {
    resumo: '/estudos/resumo',
    progressoSemanal: '/estudos/progresso-semanal',
    mapaCalor: '/estudos/mapa-calor',
  },
  historico: {
    lista: '/historico',
    porId: (id: string) => `/historico/${encodeURIComponent(id)}`,
  },
  revisaoSemanal: {
    resumo: '/revisao-semanal',
    nota: (inicioSemana: string) => `/revisao-semanal/${inicioSemana}/nota`,
  },
  dashboard: {
    resumo: '/dashboard/resumo',
    sequencia: '/dashboard/sequencia',
  },
} as const;
