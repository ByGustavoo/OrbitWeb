import type { CSSProperties } from 'react';
import { ArrowRight, History, PencilLine, Plus, Timer } from 'lucide-react';
import { Botao, CabecalhoPainel, EsqueletoLista, EstadoErro, EstadoVazio, Painel } from '@/componentes/ui';
import { coresDaPaleta } from '@/modelos/cores';
import type { SessaoEstudoDTO } from '@/modelos/estudos';
import { dataIsoLocal } from '@/utilitarios/datas';
import { formatarDiaRelativo, formatarDuracao, formatarDuracaoSegundos, formatarHorario, pluralizar } from '@/utilitarios/formatacao';
import { juntarClasses } from '@/utilitarios/juntarClasses';
import estilos from './ListaSessoes.module.css';

export interface ListaSessoesProps {
  sessoes: SessaoEstudoDTO[] | null;
  hojeIso: string;
  dias: number;
  erro: boolean;
  tentando: boolean;
  idDestacada: number | null;
  aoTentarNovamente: () => void;
  aoLancar: () => void;
  aoAbrir: (sessao: SessaoEstudoDTO) => void;
  aoVerHistorico: () => void;
  className?: string;
}

interface GrupoDia {
  dia: string;
  sessoes: SessaoEstudoDTO[];
  segundos: number;
}

function agruparPorDia(sessoes: SessaoEstudoDTO[]): GrupoDia[] {
  const grupos = new Map<string, GrupoDia>();
  for (const sessao of sessoes) {
    const dia = dataIsoLocal(new Date(sessao.inicio));
    const grupo = grupos.get(dia) ?? { dia, sessoes: [], segundos: 0 };
    grupo.sessoes.push(sessao);
    grupo.segundos += sessao.duracaoSegundos;
    grupos.set(dia, grupo);
  }
  return [...grupos.values()].sort((a, b) => b.dia.localeCompare(a.dia));
}

function descreverSessao(sessao: SessaoEstudoDTO): string {
  const partes = [`${formatarHorario(sessao.inicio)} – ${formatarHorario(sessao.fim)}`];
  if (sessao.origem === 'MANUAL') partes.push('Lançada manualmente');
  else if (sessao.modo === 'POMODORO') {
    partes.push(sessao.ciclosConcluidos ? `Pomodoro, ${pluralizar(sessao.ciclosConcluidos, 'ciclo', 'ciclos')}` : 'Pomodoro');
  }
  return partes.join(' · ');
}

export function ListaSessoes({
  sessoes,
  hojeIso,
  dias,
  erro,
  tentando,
  idDestacada,
  aoTentarNovamente,
  aoLancar,
  aoAbrir,
  aoVerHistorico,
  className,
}: ListaSessoesProps) {
  return (
    <Painel className={juntarClasses(estilos.painel, className)} aria-labelledby="titulo-historico">
      <CabecalhoPainel
        titulo={<span id="titulo-historico">Histórico recente</span>}
        descricao={`Sessões dos últimos ${dias} dias`}
        acao={
          <Botao variante="secundario" tamanho="sm" icone={Plus} onClick={aoLancar}>
            Lançar sessão
          </Botao>
        }
      />

      {erro && sessoes === null ? (
        <EstadoErro
          compacto
          titulo="Não foi possível carregar o histórico"
          descricao="Verifique a conexão e tente de novo."
          aoTentarNovamente={aoTentarNovamente}
          tentando={tentando}
        />
      ) : sessoes === null ? (
        <EsqueletoLista linhas={4} rotulo="Carregando o histórico…" />
      ) : sessoes.length === 0 ? (
        <EstadoVazio
          compacto
          icone={History}
          titulo="Nenhuma sessão de estudo registrada."
          descricao="As sessões que você salvar no cronômetro aparecem aqui, agrupadas por dia. Estudou sem o cronômetro? Lance a sessão."
          acao={
            <Botao variante="secundario" tamanho="sm" icone={Plus} onClick={aoLancar}>
              Lançar sessão
            </Botao>
          }
        />
      ) : (
        <div className={estilos.dias}>
          {agruparPorDia(sessoes).map((grupo) => (
            <section key={grupo.dia} className={estilos.dia} aria-labelledby={`dia-${grupo.dia}`}>
              <h3 className={estilos.tituloDia} id={`dia-${grupo.dia}`}>
                <span>{formatarDiaRelativo(grupo.dia, hojeIso)}</span>
                <span className={estilos.totalDia}>
                  {formatarDuracao(Math.round(grupo.segundos / 60))} · {pluralizar(grupo.sessoes.length, 'sessão', 'sessões')}
                </span>
              </h3>
              <ul className={estilos.lista}>
                {grupo.sessoes.map((sessao) => (
                  <li key={sessao.id} className={juntarClasses(estilos.item, sessao.id === idDestacada && estilos.destacada)}>
                    <button
                      type="button"
                      className={estilos.botao}
                      style={{ '--cor-atividade': coresDaPaleta(sessao.atividade.cor).texto } as CSSProperties}
                      onClick={() => aoAbrir(sessao)}
                      aria-label={`${sessao.atividade.nome}, ${formatarDuracaoSegundos(sessao.duracaoSegundos)}, ${descreverSessao(sessao)}. Editar sessão`}
                    >
                      <span className={estilos.cor} aria-hidden="true" />
                      <span className={estilos.textos}>
                        <span className={estilos.nome}>{sessao.atividade.nome}</span>
                        <span className={estilos.detalhes}>
                          {sessao.origem === 'CRONOMETRO' ? (
                            <Timer size={12} strokeWidth={2.25} aria-hidden="true" className={estilos.iconeDetalhes} />
                          ) : (
                            <PencilLine size={12} strokeWidth={2.25} aria-hidden="true" className={estilos.iconeDetalhes} />
                          )}
                          <span>{descreverSessao(sessao)}</span>
                        </span>
                        {sessao.tarefa || sessao.observacao ? (
                          <span className={estilos.extra}>{sessao.observacao ?? `Tarefa: ${sessao.tarefa?.titulo}`}</span>
                        ) : null}
                      </span>
                      <span className={estilos.duracao}>{formatarDuracaoSegundos(sessao.duracaoSegundos)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
          <Botao variante="terciario" tamanho="sm" iconeDireita={ArrowRight} className={estilos.verHistorico} onClick={aoVerHistorico}>
            Ver histórico completo
          </Botao>
        </div>
      )}
    </Painel>
  );
}
