import type { CSSProperties } from 'react';
import { ArchiveRestore, BookOpen, ChevronRight, CircleCheck, Pencil, Plus } from 'lucide-react';
import { BarraProgresso, Botao, BotaoIcone, CabecalhoPainel, EsqueletoLista, EstadoErro, EstadoVazio, Painel } from '@/componentes/ui';
import { coresDaPaleta } from '@/modelos/cores';
import type { AtividadeEstudoDTO, EstudoPorAtividadeDTO } from '@/modelos/estudos';
import { formatarDuracao, formatarDuracaoPorExtenso, formatarTempoRelativo, pluralizar } from '@/utilitarios/formatacao';
import { juntarClasses } from '@/utilitarios/juntarClasses';
import estilos from './ListaAtividades.module.css';

export interface ListaAtividadesProps {
  atividades: AtividadeEstudoDTO[] | null;
  semana: Map<number, EstudoPorAtividadeDTO> | null;
  total: Map<number, EstudoPorAtividadeDTO> | null;
  erro: boolean;
  tentando: boolean;
  idEmAndamento: number | null;
  sessaoPausada: boolean;
  idsDesarquivando: ReadonlySet<number>;
  aoTentarNovamente: () => void;
  aoCriar: () => void;
  aoEditar: (atividade: AtividadeEstudoDTO) => void;
  aoDesarquivar: (atividade: AtividadeEstudoDTO) => void;
  className?: string;
}

function descreverUltimoEstudo(instante: string | null): string {
  if (!instante) return '';
  const relativo = formatarTempoRelativo(instante);
  return `Último estudo: ${relativo.charAt(0).toLocaleLowerCase('pt-BR')}${relativo.slice(1)}`;
}

function LinhaAtividade({
  atividade,
  semana,
  total,
  emAndamento,
  pausada,
  aoEditar,
}: {
  atividade: AtividadeEstudoDTO;
  semana: EstudoPorAtividadeDTO | undefined;
  total: EstudoPorAtividadeDTO | undefined;
  emAndamento: boolean;
  pausada: boolean;
  aoEditar: (atividade: AtividadeEstudoDTO) => void;
}) {
  const cores = coresDaPaleta(atividade.cor);
  const minutosSemana = Math.round((semana?.segundos ?? 0) / 60);
  const meta = atividade.metaSemanalMinutos;
  const batida = meta !== null && minutosSemana >= meta;

  return (
    <li className={estilos.item} style={{ '--cor-atividade': cores.texto } as CSSProperties}>
      <div className={estilos.identificacao}>
        <span className={estilos.cor} aria-hidden="true" />
        <h3 className={estilos.nome}>{atividade.nome}</h3>
        {emAndamento ? <span className={estilos.agora}>{pausada ? 'Sessão pausada' : 'Estudando agora'}</span> : null}
      </div>

      <div className={estilos.semana}>
        <p className={estilos.linhaSemana}>
          <span>
            Esta semana <strong>{formatarDuracao(minutosSemana)}</strong>
            {meta !== null ? <> de {formatarDuracao(meta)}</> : null}
          </span>
          {meta === null ? (
            <span className={estilos.semMeta}>Sem meta</span>
          ) : batida ? (
            <span className={estilos.batida}>
              <CircleCheck size={13} strokeWidth={2.25} aria-hidden="true" />
              Meta batida
            </span>
          ) : (
            <span className={estilos.falta}>Faltam {formatarDuracao(meta - minutosSemana)}</span>
          )}
        </p>
        {meta !== null ? (
          <BarraProgresso
            valor={minutosSemana}
            maximo={meta}
            rotulo={`Meta semanal de ${atividade.nome}`}
            textoValor={`${formatarDuracaoPorExtenso(minutosSemana)} de ${formatarDuracaoPorExtenso(meta)}`}
            tom={batida ? 'sucesso' : 'destaque'}
            cor={batida ? undefined : cores.texto}
          />
        ) : null}
      </div>

      <p className={estilos.totais}>
        {total && total.sessoes > 0 ? (
          <>
            <span>
              <strong>{formatarDuracao(Math.round(total.segundos / 60))}</strong> no total · {pluralizar(total.sessoes, 'sessão', 'sessões')}
            </span>
            <span>{descreverUltimoEstudo(total.ultimaSessaoEm)}</span>
          </>
        ) : (
          <span>Ainda sem sessões registradas</span>
        )}
      </p>

      <BotaoIcone icone={Pencil} rotulo={`Editar ${atividade.nome}`} tamanho="sm" className={estilos.editar} onClick={() => aoEditar(atividade)} />
    </li>
  );
}

export function ListaAtividades({
  atividades,
  semana,
  total,
  erro,
  tentando,
  idEmAndamento,
  sessaoPausada,
  idsDesarquivando,
  aoTentarNovamente,
  aoCriar,
  aoEditar,
  aoDesarquivar,
  className,
}: ListaAtividadesProps) {
  const ativas = (atividades ?? []).filter((atividade) => !atividade.arquivada);
  const arquivadas = (atividades ?? []).filter((atividade) => atividade.arquivada);
  const carregado = atividades !== null && semana !== null && total !== null;

  return (
    <Painel className={juntarClasses(estilos.painel, className)} aria-labelledby="titulo-atividades">
      <CabecalhoPainel
        titulo={<span id="titulo-atividades">Atividades de estudo</span>}
        descricao="Tempo da semana, meta e histórico de cada atividade"
        acao={
          <Botao variante="secundario" tamanho="sm" icone={Plus} onClick={aoCriar}>
            Nova atividade
          </Botao>
        }
      />

      {erro && !carregado ? (
        <EstadoErro
          compacto
          titulo="Não foi possível carregar as atividades"
          descricao="Verifique a conexão e tente de novo."
          aoTentarNovamente={aoTentarNovamente}
          tentando={tentando}
        />
      ) : !carregado ? (
        <EsqueletoLista linhas={3} rotulo="Carregando as atividades…" />
      ) : ativas.length === 0 && arquivadas.length === 0 ? (
        <EstadoVazio
          compacto
          icone={BookOpen}
          titulo="Nenhuma atividade por aqui ainda."
          descricao="Cada atividade mostra o tempo da semana, a meta e o histórico. Crie a primeira para começar."
          acao={
            <Botao variante="secundario" tamanho="sm" icone={Plus} onClick={aoCriar}>
              Criar atividade
            </Botao>
          }
        />
      ) : (
        <>
          {ativas.length === 0 ? (
            <p className={estilos.semAtivas}>Todas as atividades estão arquivadas. Crie uma nova ou desarquive uma delas.</p>
          ) : (
            <ul className={estilos.lista}>
              {ativas.map((atividade) => (
                <LinhaAtividade
                  key={atividade.id}
                  atividade={atividade}
                  semana={semana.get(atividade.id)}
                  total={total.get(atividade.id)}
                  emAndamento={atividade.id === idEmAndamento}
                  pausada={sessaoPausada}
                  aoEditar={aoEditar}
                />
              ))}
            </ul>
          )}

          {arquivadas.length > 0 ? (
            <details className={estilos.arquivadas}>
              <summary className={estilos.resumoArquivadas}>
                <ChevronRight size={16} strokeWidth={2} aria-hidden="true" className={estilos.seta} />
                Arquivadas ({arquivadas.length})
              </summary>
              <ul className={estilos.listaArquivadas}>
                {arquivadas.map((atividade) => (
                  <li
                    key={atividade.id}
                    className={estilos.itemArquivado}
                    style={{ '--cor-atividade': coresDaPaleta(atividade.cor).texto } as CSSProperties}
                  >
                    <span className={estilos.cor} aria-hidden="true" />
                    <span className={estilos.nomeArquivado}>{atividade.nome}</span>
                    <span className={estilos.totaisArquivado}>
                      {formatarDuracao(Math.round((total.get(atividade.id)?.segundos ?? 0) / 60))} ·{' '}
                      {pluralizar(total.get(atividade.id)?.sessoes ?? 0, 'sessão', 'sessões')}
                    </span>
                    <Botao
                      variante="terciario"
                      tamanho="sm"
                      icone={ArchiveRestore}
                      carregando={idsDesarquivando.has(atividade.id)}
                      onClick={() => aoDesarquivar(atividade)}
                      aria-label={`Desarquivar ${atividade.nome}`}
                    >
                      Desarquivar
                    </Botao>
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
        </>
      )}
    </Painel>
  );
}
