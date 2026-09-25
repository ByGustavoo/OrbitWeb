import type { CSSProperties, ReactNode } from 'react';
import { ArrowRight, ListChecks, PencilLine, SearchX } from 'lucide-react';
import { ehErroApi } from '@/api/tratamentoErros';
import { SeloCategoria, SeloPrazo, SeloPrioridade, SeloSituacao } from '@/componentes/tarefas/SelosTarefa';
import { Botao, Esqueleto, EstadoErro, EstadoVazio, Modal } from '@/componentes/ui';
import { useDadosAssincronos } from '@/ganchos/useDadosAssincronos';
import { coresDaPaleta } from '@/modelos/cores';
import type { Prioridade, Situacao } from '@/modelos/enumeracoes';
import { PRIORIDADES, SITUACOES } from '@/modelos/enumeracoes';
import type { DetalheHistoricoDTO, RegistroHistoricoDTO } from '@/modelos/historico';
import type { SessaoEstudoDTO } from '@/modelos/estudos';
import { rotuloEventoHistorico } from '@/modelos/rotulos';
import type { TarefaDTO } from '@/modelos/tarefas';
import { useAlteracoes } from '@/provedores/ProvedorAlteracoes';
import { servicoHistorico } from '@/servicos';
import { capitalizar, dataIsoLocal, deDataIso, formatarDataPorExtenso } from '@/utilitarios/datas';
import {
  formatarDiaCompleto,
  formatarDiaCurto,
  formatarDuracaoSegundosPorExtenso,
  formatarHorario,
  formatarIntervaloHorario,
  pluralizar,
} from '@/utilitarios/formatacao';
import { descreverAlteracao } from './aparenciaEventos';
import estilos from './DetalhesRegistroHistorico.module.css';

export interface DetalhesRegistroHistoricoProps {
  aberto: boolean;
  registro: RegistroHistoricoDTO | null;
  aoFechar: () => void;
  aoAbrirTarefa: (tarefa: TarefaDTO) => void;
  aoEditarSessao: (sessao: SessaoEstudoDTO) => void;
}

function Dado({ rotulo, children, largo = false, vazio = false }: { rotulo: string; children: ReactNode; largo?: boolean; vazio?: boolean }) {
  return (
    <div className={largo ? `${estilos.dado} ${estilos.largo}` : estilos.dado}>
      <dt className={estilos.rotulo}>{rotulo}</dt>
      <dd className={vazio ? estilos.valorVazio : estilos.valor}>{children}</dd>
    </div>
  );
}

function descreverMomento(registro: RegistroHistoricoDTO): string {
  const instante = new Date(registro.ocorridoEm);
  const dia = dataIsoLocal(instante);
  const comAno = `${formatarDiaCompleto(dia)} de ${instante.getFullYear()}`;
  return registro.comHorario ? `${comAno}, às ${formatarHorario(registro.ocorridoEm)}` : comAno;
}

function descreverRegistroSessao(sessao: SessaoEstudoDTO): string {
  if (sessao.origem === 'MANUAL') return 'Lançada manualmente';
  if (sessao.modo === 'POMODORO') {
    return sessao.ciclosConcluidos ? `Pomodoro, ${pluralizar(sessao.ciclosConcluidos, 'ciclo', 'ciclos')}` : 'Pomodoro';
  }
  return 'Cronômetro livre';
}

function ehPrioridade(valor: string | null): valor is Prioridade {
  return PRIORIDADES.includes(valor as Prioridade);
}

function ehSituacao(valor: string | null): valor is Situacao {
  return SITUACOES.includes(valor as Situacao);
}

function ValorAlterado({ registro, valor, texto }: { registro: RegistroHistoricoDTO; valor: string | null; texto: string }) {
  if (registro.tipo === 'PRIORIDADE_ALTERADA' && ehPrioridade(valor)) return <SeloPrioridade prioridade={valor} />;
  if (registro.tipo === 'TAREFA_REABERTA' && ehSituacao(valor)) return <SeloSituacao situacao={valor} />;
  if (registro.tipo === 'DATA_ALTERADA' && valor) return <>{formatarDiaCurto(valor)}</>;
  return <>{texto}</>;
}

function ConteudoSessao({ sessao }: { sessao: SessaoEstudoDTO }) {
  return (
    <dl className={estilos.dados}>
      <Dado rotulo="Atividade">
        <span className={estilos.comPonto}>
          <span
            className={estilos.ponto}
            style={{ '--cor-ponto': coresDaPaleta(sessao.atividade.cor).texto } as CSSProperties}
            aria-hidden="true"
          />
          {sessao.atividade.nome}
        </span>
      </Dado>
      <Dado rotulo="Tempo estudado">{formatarDuracaoSegundosPorExtenso(sessao.duracaoSegundos)}</Dado>
      <Dado rotulo="Início">{formatarHorario(sessao.inicio)}</Dado>
      <Dado rotulo="Fim">{formatarHorario(sessao.fim)}</Dado>
      <Dado rotulo="Registro">{descreverRegistroSessao(sessao)}</Dado>
      <Dado rotulo="Tarefa" vazio={!sessao.tarefa}>
        {sessao.tarefa?.titulo ?? 'Nenhuma'}
      </Dado>
      {sessao.observacao ? (
        <Dado rotulo="Observação" largo>
          <span className={estilos.observacao}>{sessao.observacao}</span>
        </Dado>
      ) : null}
    </dl>
  );
}

function ConteudoTarefa({ registro, tarefa }: { registro: RegistroHistoricoDTO; tarefa: TarefaDTO }) {
  const alteracao = descreverAlteracao(registro);
  const renomeada = tarefa.titulo !== registro.titulo;
  return (
    <>
      {registro.tipo === 'TAREFA_NAO_REALIZADA' ? (
        <p className={estilos.aviso}>
          Esta ocorrência de uma tarefa recorrente passou sem ser concluída. Só a mais recente continua como atrasada; as
          anteriores ficam registradas aqui.
        </p>
      ) : null}

      {alteracao && registro.alteracao ? (
        <div className={estilos.alteracao} role="group" aria-label="O que mudou">
          <div className={estilos.ladoAlteracao}>
            <span className={estilos.rotulo}>Antes</span>
            <span className={estilos.valorAnterior}>
              <ValorAlterado registro={registro} valor={registro.alteracao.anterior} texto={alteracao.anterior} />
            </span>
          </div>
          <ArrowRight className={estilos.setaAlteracao} size={16} strokeWidth={2} aria-hidden="true" />
          <div className={estilos.ladoAlteracao}>
            <span className={estilos.rotulo}>Depois</span>
            <span className={estilos.valor}>
              <ValorAlterado registro={registro} valor={registro.alteracao.novo} texto={alteracao.novo} />
            </span>
          </div>
        </div>
      ) : null}

      <dl className={estilos.dados}>
        <Dado rotulo="Tarefa" largo>
          {tarefa.titulo}
          {renomeada ? <span className={estilos.nota}>Na época, se chamava “{registro.titulo}”.</span> : null}
        </Dado>
        <Dado rotulo="Situação atual">
          <span className={estilos.selos}>
            <SeloSituacao situacao={tarefa.situacao} />
            <SeloPrazo prazo={tarefa.prazo} />
          </span>
        </Dado>
        <Dado rotulo="Prioridade">
          <SeloPrioridade prioridade={tarefa.prioridade} />
        </Dado>
        <Dado rotulo="Data da tarefa" vazio={!tarefa.data}>
          {tarefa.data ? (
            <>
              {capitalizar(formatarDataPorExtenso(deDataIso(tarefa.data)))}
              <span className={estilos.complemento}>
                {formatarIntervaloHorario(tarefa.horarioInicio, tarefa.horarioFim, tarefa.diaInteiro)}
              </span>
            </>
          ) : (
            'Sem data'
          )}
        </Dado>
        <Dado rotulo="Categoria" vazio={!tarefa.categoria}>
          {tarefa.categoria ? <SeloCategoria nome={tarefa.categoria.nome} cor={tarefa.categoria.cor} /> : 'Sem categoria'}
        </Dado>
      </dl>
    </>
  );
}

function EsqueletoDetalhes() {
  return (
    <div className={estilos.dados} role="status" aria-label="Carregando os detalhes…">
      {Array.from({ length: 6 }, (_, indice) => (
        <div key={indice} className={estilos.dado}>
          <Esqueleto largura="40%" altura={11} />
          <Esqueleto largura={`${70 - ((indice * 13) % 30)}%`} altura={15} />
        </div>
      ))}
    </div>
  );
}

function registroAusente(erro: Error | null): boolean {
  return ehErroApi(erro, 'NAO_ENCONTRADO');
}

export function DetalhesRegistroHistorico({ aberto, registro, aoFechar, aoAbrirTarefa, aoEditarSessao }: DetalhesRegistroHistoricoProps) {
  const { versoes } = useAlteracoes();
  const id = registro?.id ?? null;

  const detalhe = useDadosAssincronos<DetalheHistoricoDTO | null>(
    (signal) => (aberto && id ? servicoHistorico.buscarDetalhesHistorico(id, signal) : Promise.resolve(null)),
    [aberto, id, versoes.tarefas, versoes.sessoes, versoes.atividades, versoes.categorias],
  );

  if (!registro) return <Modal aberto={false} aoFechar={aoFechar} titulo="" />;

  const dados = detalhe.dados?.registro.id === registro.id ? detalhe.dados : null;
  const tarefa = dados?.tarefa ?? null;
  const sessao = dados?.sessao ?? null;

  const conteudo = () => {
    if (detalhe.erro && registroAusente(detalhe.erro)) {
      return (
        <EstadoVazio
          compacto
          icone={SearchX}
          titulo="Este registro não existe mais."
          descricao="A tarefa ou a sessão pode ter sido excluída. Feche esta janela para ver o histórico atualizado."
        />
      );
    }
    if (detalhe.erro) {
      return (
        <EstadoErro
          compacto
          titulo="Não foi possível carregar os detalhes"
          erro={detalhe.erro}
          aoTentarNovamente={detalhe.recarregar}
          tentando={detalhe.carregando}
        />
      );
    }
    if (!dados) return <EsqueletoDetalhes />;
    if (sessao) return <ConteudoSessao sessao={sessao} />;
    if (tarefa) return <ConteudoTarefa registro={registro} tarefa={tarefa} />;
    return (
      <EstadoVazio
        compacto
        icone={SearchX}
        titulo="Este registro não existe mais."
        descricao="A tarefa ou a sessão pode ter sido excluída."
      />
    );
  };

  return (
    <Modal
      aberto={aberto}
      aoFechar={aoFechar}
      titulo={rotuloEventoHistorico[registro.tipo]}
      descricao={descreverMomento(registro)}
      tamanho="sm"
      rodape={
        <>
          <Botao variante="secundario" onClick={aoFechar}>
            Fechar
          </Botao>
          {sessao ? (
            <Botao icone={PencilLine} onClick={() => aoEditarSessao(sessao)}>
              Editar sessão
            </Botao>
          ) : tarefa ? (
            <Botao icone={ListChecks} onClick={() => aoAbrirTarefa(tarefa)}>
              Abrir tarefa
            </Botao>
          ) : null}
        </>
      }
    >
      <div className={estilos.detalhes} aria-busy={!dados && !detalhe.erro ? true : undefined}>
        {conteudo()}
      </div>
    </Modal>
  );
}
