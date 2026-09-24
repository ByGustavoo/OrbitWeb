import { useEffect, useRef, useState } from 'react';
import { FilterX, Tag } from 'lucide-react';
import { Botao, CampoBusca, CampoSelecao } from '@/componentes/ui';
import type { OpcaoSelecao } from '@/componentes/ui';
import type { CategoriaDTO } from '@/modelos/comum';
import { coresDaPaleta, coresDaPrioridade } from '@/modelos/cores';
import type { OrdenacaoTarefas, Prioridade, Situacao } from '@/modelos/enumeracoes';
import { PRIORIDADES } from '@/modelos/enumeracoes';
import { rotuloOrdenacao, rotuloPrioridade } from '@/modelos/rotulos';
import { iconePrioridade } from './iconesTarefa';
import estilos from './BarraFiltrosTarefas.module.css';

export type FiltroSituacao = 'EM_ABERTO' | 'TODAS' | Situacao;

export interface FiltrosListaTarefas {
  situacao: FiltroSituacao;
  prioridade: Prioridade | null;
  categoriaId: number | null;
  busca: string;
  ordenacao: OrdenacaoTarefas;
}

export interface BarraFiltrosTarefasProps {
  filtros: FiltrosListaTarefas;
  categorias: CategoriaDTO[] | null;
  mostrarSituacao: boolean;
  temFiltros: boolean;
  aoMudar: (parcial: Partial<FiltrosListaTarefas>) => void;
  aoLimpar: () => void;
}

const ESPERA_BUSCA_MS = 300;

const opcoesSituacao: OpcaoSelecao<FiltroSituacao>[] = [
  { valor: 'EM_ABERTO', rotulo: 'Em aberto', descricao: 'Pendentes e em andamento' },
  { valor: 'PENDENTE', rotulo: 'Pendentes' },
  { valor: 'EM_ANDAMENTO', rotulo: 'Em andamento' },
  { valor: 'CONCLUIDA', rotulo: 'Concluídas' },
  { valor: 'CANCELADA', rotulo: 'Canceladas' },
  { valor: 'TODAS', rotulo: 'Todas as situações' },
];

const opcoesPrioridade: OpcaoSelecao<Prioridade>[] = [...PRIORIDADES].reverse().map((prioridade) => ({
  valor: prioridade,
  rotulo: rotuloPrioridade[prioridade],
  icone: iconePrioridade[prioridade],
  cor: coresDaPrioridade(prioridade).texto,
}));

const opcoesOrdenacao: OpcaoSelecao<OrdenacaoTarefas>[] = (['DATA', 'PRIORIDADE', 'ATUALIZACAO'] as const).map((ordenacao) => ({
  valor: ordenacao,
  rotulo: rotuloOrdenacao[ordenacao],
}));

export function BarraFiltrosTarefas({ filtros, categorias, mostrarSituacao, temFiltros, aoMudar, aoLimpar }: BarraFiltrosTarefasProps) {
  const [busca, setBusca] = useState(filtros.busca);
  const ultimaEnviada = useRef(filtros.busca);

  useEffect(() => {
    if (filtros.busca !== ultimaEnviada.current) {
      ultimaEnviada.current = filtros.busca;
      setBusca(filtros.busca);
    }
  }, [filtros.busca]);

  useEffect(() => {
    if (busca === ultimaEnviada.current) return;
    const temporizador = window.setTimeout(() => {
      ultimaEnviada.current = busca;
      aoMudar({ busca });
    }, ESPERA_BUSCA_MS);
    return () => window.clearTimeout(temporizador);
  }, [busca, aoMudar]);

  const opcoesCategoria: OpcaoSelecao<string>[] = (categorias ?? []).map((categoria) => ({
    valor: String(categoria.id),
    rotulo: categoria.nome,
    icone: Tag,
    cor: coresDaPaleta(categoria.cor).texto,
  }));

  return (
    <div className={estilos.barra} role="group" aria-label="Filtros das tarefas">
      <CampoBusca
        className={estilos.busca}
        rotulo="Buscar"
        placeholder="Título ou descrição"
        valor={busca}
        aoMudar={setBusca}
      />
      {mostrarSituacao ? (
        <CampoSelecao
          className={estilos.filtro}
          rotulo="Situação"
          opcoes={opcoesSituacao}
          valor={filtros.situacao}
          aoMudar={(situacao) => situacao && aoMudar({ situacao })}
        />
      ) : null}
      <CampoSelecao
        className={estilos.filtro}
        rotulo="Prioridade"
        opcoes={opcoesPrioridade}
        valor={filtros.prioridade}
        aoMudar={(prioridade) => aoMudar({ prioridade })}
        permitirVazio
        textoVazio="Todas"
      />
      <CampoSelecao
        className={estilos.filtro}
        rotulo="Categoria"
        opcoes={opcoesCategoria}
        valor={filtros.categoriaId === null ? null : String(filtros.categoriaId)}
        aoMudar={(valor) => aoMudar({ categoriaId: valor === null ? null : Number(valor) })}
        permitirVazio
        textoVazio={categorias ? 'Todas' : 'Carregando…'}
        desabilitado={!categorias}
      />
      <CampoSelecao
        className={estilos.filtro}
        rotulo="Ordenar por"
        opcoes={opcoesOrdenacao}
        valor={filtros.ordenacao}
        aoMudar={(ordenacao) => ordenacao && aoMudar({ ordenacao })}
      />
      {temFiltros ? (
        <Botao variante="terciario" icone={FilterX} className={estilos.limpar} onClick={aoLimpar}>
          Limpar filtros
        </Botao>
      ) : null}
    </div>
  );
}
