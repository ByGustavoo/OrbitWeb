import { CalendarX, Circle, CircleCheck, CircleDot, CircleSlash, Clock } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Selo } from '@/componentes/ui';
import type { TomSelo } from '@/componentes/ui';
import { coresDaPaleta, coresDaPrioridade } from '@/modelos/cores';
import type { Cor, Prazo, Prioridade, Situacao } from '@/modelos/enumeracoes';
import { rotuloPrazo, rotuloPrioridade, rotuloSituacao } from '@/modelos/rotulos';
import { iconePrioridade } from './iconesTarefa';

export function SeloPrioridade({ prioridade }: { prioridade: Prioridade }) {
  const cores = coresDaPrioridade(prioridade);
  return (
    <Selo icone={iconePrioridade[prioridade]} corTexto={cores.texto} corFundo={cores.fundo}>
      <span className="visualmente-oculto">Prioridade </span>
      {rotuloPrioridade[prioridade]}
    </Selo>
  );
}

const aparenciaSituacao: Record<Situacao, { icone: LucideIcon; tom: TomSelo }> = {
  PENDENTE: { icone: Circle, tom: 'neutro' },
  EM_ANDAMENTO: { icone: CircleDot, tom: 'destaque' },
  CONCLUIDA: { icone: CircleCheck, tom: 'sucesso' },
  CANCELADA: { icone: CircleSlash, tom: 'neutro' },
};

export function SeloSituacao({ situacao }: { situacao: Situacao }) {
  const { icone, tom } = aparenciaSituacao[situacao];
  return (
    <Selo icone={icone} tom={tom} tachado={situacao === 'CANCELADA'}>
      {rotuloSituacao[situacao]}
    </Selo>
  );
}

const aparenciaPrazo: Partial<Record<Prazo, { icone: LucideIcon; tom: TomSelo }>> = {
  ATRASADA: { icone: Clock, tom: 'erro' },
  NAO_REALIZADA: { icone: CalendarX, tom: 'neutro' },
  CONCLUIDA_COM_ATRASO: { icone: Clock, tom: 'aviso' },
};

export function SeloPrazo({ prazo }: { prazo: Prazo }) {
  const aparencia = aparenciaPrazo[prazo];
  if (!aparencia) return null;
  return (
    <Selo icone={aparencia.icone} tom={aparencia.tom}>
      {rotuloPrazo[prazo]}
    </Selo>
  );
}

export function SeloCategoria({ nome, cor }: { nome: string; cor: Cor }) {
  const cores = coresDaPaleta(cor);
  return (
    <Selo ponto corTexto={cores.texto} corFundo={cores.fundo} titulo={`Categoria ${nome}`}>
      {nome}
    </Selo>
  );
}
