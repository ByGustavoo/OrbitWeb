import type { ReactNode } from 'react';
import { BookOpen, Check, Pencil, Play, Repeat, RotateCcw, Timer, Trash2 } from 'lucide-react';
import { Botao, CampoSelecao, Modal, Selo } from '@/componentes/ui';
import type { OpcaoSelecao } from '@/componentes/ui';
import { coresDaPaleta } from '@/modelos/cores';
import type { Situacao } from '@/modelos/enumeracoes';
import { SITUACOES } from '@/modelos/enumeracoes';
import { rotuloLembrete, rotuloSituacao } from '@/modelos/rotulos';
import type { TarefaDTO } from '@/modelos/tarefas';
import { descreverRecorrencia } from '@/regras/recorrencia';
import { capitalizar, deDataIso, formatarDataPorExtenso } from '@/utilitarios/datas';
import { formatarInstante, formatarIntervaloHorario } from '@/utilitarios/formatacao';
import { SeloCategoria, SeloPrazo, SeloPrioridade, SeloSituacao } from './SelosTarefa';
import estilos from './DetalhesTarefa.module.css';

export interface DetalhesTarefaProps {
  aberto: boolean;
  tarefa: TarefaDTO | null;
  enviando: boolean;
  aoFechar: () => void;
  aoEditar: (tarefa: TarefaDTO) => void;
  aoExcluir: (tarefa: TarefaDTO) => void;
  aoAlternarConclusao: (tarefa: TarefaDTO) => void;
  aoMudarSituacao: (tarefa: TarefaDTO, situacao: Situacao) => void;
  estudoEmAndamento: { atividade: string; tarefaId: number | null } | null;
  aoIniciarEstudo: (tarefa: TarefaDTO) => void;
  aoVerCronometro: () => void;
}

const opcoesSituacao: OpcaoSelecao<Situacao>[] = SITUACOES.map((situacao) => ({ valor: situacao, rotulo: rotuloSituacao[situacao] }));

function Dado({ rotulo, children, vazio = false }: { rotulo: string; children: ReactNode; vazio?: boolean }) {
  return (
    <div className={estilos.dado}>
      <dt className={estilos.rotulo}>{rotulo}</dt>
      <dd className={vazio ? estilos.valorVazio : estilos.valor}>{children}</dd>
    </div>
  );
}

export function DetalhesTarefa({
  aberto,
  tarefa,
  enviando,
  aoFechar,
  aoEditar,
  aoExcluir,
  aoAlternarConclusao,
  aoMudarSituacao,
  estudoEmAndamento,
  aoIniciarEstudo,
  aoVerCronometro,
}: DetalhesTarefaProps) {
  if (!tarefa) return <Modal aberto={false} aoFechar={aoFechar} titulo="" />;

  const concluida = tarefa.situacao === 'CONCLUIDA';
  const reabrir = concluida || tarefa.situacao === 'CANCELADA';
  const corAtividade = tarefa.atividade ? coresDaPaleta(tarefa.atividade.cor) : null;
  const podeEstudar = tarefa.atividade !== null && !reabrir;
  const estudandoEsta = estudoEmAndamento?.tarefaId === tarefa.id;

  return (
    <Modal
      aberto={aberto}
      aoFechar={aoFechar}
      titulo={tarefa.titulo}
      tamanho="md"
      rodape={
        <>
          <Botao variante="terciario" icone={Trash2} className={estilos.excluir} onClick={() => aoExcluir(tarefa)} disabled={enviando}>
            Excluir
          </Botao>
          <Botao variante="secundario" icone={Pencil} onClick={() => aoEditar(tarefa)} disabled={enviando}>
            Editar
          </Botao>
          {reabrir ? (
            <Botao variante="secundario" icone={RotateCcw} onClick={() => aoMudarSituacao(tarefa, 'PENDENTE')} carregando={enviando}>
              Reabrir
            </Botao>
          ) : (
            <Botao icone={Check} onClick={() => aoAlternarConclusao(tarefa)} carregando={enviando}>
              Concluir
            </Botao>
          )}
        </>
      }
    >
      <div className={estilos.detalhes}>
        <div className={estilos.selos}>
          <SeloSituacao situacao={tarefa.situacao} />
          <SeloPrazo prazo={tarefa.prazo} />
          <SeloPrioridade prioridade={tarefa.prioridade} />
          {tarefa.categoria ? <SeloCategoria nome={tarefa.categoria.nome} cor={tarefa.categoria.cor} /> : null}
          {tarefa.recorrencia ? (
            <Selo icone={Repeat} tom="info">
              Recorrente
            </Selo>
          ) : null}
        </div>

        <section aria-label="Descrição">
          {tarefa.descricao ? (
            <p className={estilos.descricao}>{tarefa.descricao}</p>
          ) : (
            <p className={estilos.semDescricao}>Sem descrição.</p>
          )}
        </section>

        <dl className={estilos.dados}>
          <Dado rotulo="Data" vazio={!tarefa.data}>
            {tarefa.data ? capitalizar(formatarDataPorExtenso(deDataIso(tarefa.data))) : 'Sem data'}
          </Dado>
          <Dado rotulo="Horário" vazio={!tarefa.data}>
            {tarefa.data ? formatarIntervaloHorario(tarefa.horarioInicio, tarefa.horarioFim, tarefa.diaInteiro) : '—'}
          </Dado>
          {tarefa.recorrencia && tarefa.data ? (
            <Dado rotulo="Repetição">{descreverRecorrencia(tarefa.recorrencia, tarefa.data)}</Dado>
          ) : null}
          <Dado rotulo="Categoria" vazio={!tarefa.categoria}>
            {tarefa.categoria?.nome ?? 'Sem categoria'}
          </Dado>
          <Dado rotulo="Atividade de estudo" vazio={!tarefa.atividade}>
            {tarefa.atividade && corAtividade ? (
              <span className={estilos.linhaAtividade}>
                <span className={estilos.atividade}>
                  <BookOpen size={14} strokeWidth={2} aria-hidden="true" style={{ color: corAtividade.texto }} />
                  {tarefa.atividade.nome}
                </span>
                {podeEstudar && !estudoEmAndamento ? (
                  <Botao variante="secundario" tamanho="sm" icone={Play} onClick={() => aoIniciarEstudo(tarefa)} disabled={enviando}>
                    Iniciar estudo
                  </Botao>
                ) : null}
                {podeEstudar && estudoEmAndamento ? (
                  <span className={estilos.estudoEmAndamento}>
                    {estudandoEsta ? 'Você está estudando esta tarefa.' : `O cronômetro está com ${estudoEmAndamento.atividade}.`}
                    <Botao variante="terciario" tamanho="sm" icone={Timer} onClick={aoVerCronometro}>
                      Ver cronômetro
                    </Botao>
                  </span>
                ) : null}
              </span>
            ) : (
              'Nenhuma'
            )}
          </Dado>
          <Dado rotulo="Lembrete" vazio={tarefa.lembreteMinutosAntes === null}>
            {tarefa.lembreteMinutosAntes === null ? 'Nenhum' : rotuloLembrete[tarefa.lembreteMinutosAntes]}
          </Dado>
        </dl>

        <CampoSelecao
          className={estilos.situacao}
          rotulo="Situação"
          opcoes={opcoesSituacao}
          valor={tarefa.situacao}
          desabilitado={enviando}
          aoMudar={(situacao) => situacao && situacao !== tarefa.situacao && aoMudarSituacao(tarefa, situacao)}
          dica="A mudança é salva na hora."
        />

        <dl className={estilos.historico}>
          <div>
            <dt>Criada em</dt>
            <dd>{formatarInstante(tarefa.criadoEm)}</dd>
          </div>
          <div>
            <dt>Atualizada em</dt>
            <dd>{formatarInstante(tarefa.atualizadoEm)}</dd>
          </div>
          {tarefa.dataConclusao ? (
            <div>
              <dt>Concluída em</dt>
              <dd>{formatarInstante(tarefa.dataConclusao)}</dd>
            </div>
          ) : null}
        </dl>
      </div>
    </Modal>
  );
}
