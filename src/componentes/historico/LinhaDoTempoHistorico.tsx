import type { CSSProperties } from 'react';
import { ArrowRight } from 'lucide-react';
import { coresDaPaleta } from '@/modelos/cores';
import type { RegistroHistoricoDTO } from '@/modelos/historico';
import { rotuloEventoHistorico } from '@/modelos/rotulos';
import { dataIsoLocal, deDataIso } from '@/utilitarios/datas';
import { formatarDiaCompleto, formatarDuracaoSegundos, formatarHorario } from '@/utilitarios/formatacao';
import { juntarClasses } from '@/utilitarios/juntarClasses';
import { aparenciaEvento, descreverAlteracao } from './aparenciaEventos';
import estilos from './LinhaDoTempoHistorico.module.css';

export interface LinhaDoTempoHistoricoProps {
  registros: RegistroHistoricoDTO[];
  hojeIso: string;
  aoAbrir: (registro: RegistroHistoricoDTO) => void;
}

interface GrupoDia {
  dia: string;
  registros: RegistroHistoricoDTO[];
}

function agruparPorDia(registros: RegistroHistoricoDTO[]): GrupoDia[] {
  const grupos: GrupoDia[] = [];
  for (const registro of registros) {
    const dia = dataIsoLocal(new Date(registro.ocorridoEm));
    const ultimo = grupos[grupos.length - 1];
    if (ultimo?.dia === dia) ultimo.registros.push(registro);
    else grupos.push({ dia, registros: [registro] });
  }
  return grupos;
}

function tituloDoDia(dia: string, hojeIso: string): { principal: string; complemento: string | null } {
  const outroAno = dia.slice(0, 4) !== hojeIso.slice(0, 4);
  const completo = `${formatarDiaCompleto(dia)}${outroAno ? ` de ${deDataIso(dia).getFullYear()}` : ''}`;
  const ontem = dataIsoLocal(new Date(deDataIso(hojeIso).getTime() - 86400000));
  if (dia === hojeIso) return { principal: 'Hoje', complemento: completo.toLocaleLowerCase('pt-BR') };
  if (dia === ontem) return { principal: 'Ontem', complemento: completo.toLocaleLowerCase('pt-BR') };
  return { principal: completo, complemento: null };
}

function textoDaMeta(registro: RegistroHistoricoDTO): string | null {
  const alteracao = descreverAlteracao(registro);
  if (alteracao) return `de ${alteracao.anterior} para ${alteracao.novo}`;
  if (registro.duracaoSegundos !== null) return formatarDuracaoSegundos(registro.duracaoSegundos);
  return registro.categoria ? `categoria ${registro.categoria.nome}` : null;
}

function rotuloAcessivel(registro: RegistroHistoricoDTO): string {
  const partes = [`${rotuloEventoHistorico[registro.tipo]}: ${registro.titulo}`];
  const meta = textoDaMeta(registro);
  if (meta) partes.push(meta);
  if (registro.comHorario) partes.push(`às ${formatarHorario(registro.ocorridoEm)}`);
  return `${partes.join(', ')}. Ver detalhes`;
}

function MetaRegistro({ registro }: { registro: RegistroHistoricoDTO }) {
  const alteracao = descreverAlteracao(registro);
  if (alteracao) {
    return (
      <span className={estilos.meta}>
        <span className={estilos.valorAnterior}>{alteracao.anterior}</span>
        <ArrowRight size={12} strokeWidth={2.25} aria-hidden="true" />
        <span className={estilos.valorNovo}>{alteracao.novo}</span>
      </span>
    );
  }
  if (registro.duracaoSegundos !== null) {
    return (
      <span className={estilos.meta}>
        {registro.atividade ? (
          <span
            className={estilos.pontoCor}
            style={{ '--cor-ponto': coresDaPaleta(registro.atividade.cor).texto } as CSSProperties}
            aria-hidden="true"
          />
        ) : null}
        {formatarDuracaoSegundos(registro.duracaoSegundos)} de estudo
      </span>
    );
  }
  if (registro.categoria) {
    return (
      <span className={estilos.meta}>
        <span
          className={estilos.pontoCor}
          style={{ '--cor-ponto': coresDaPaleta(registro.categoria.cor).texto } as CSSProperties}
          aria-hidden="true"
        />
        {registro.categoria.nome}
      </span>
    );
  }
  return null;
}

export function LinhaDoTempoHistorico({ registros, hojeIso, aoAbrir }: LinhaDoTempoHistoricoProps) {
  return (
    <div className={estilos.dias}>
      {agruparPorDia(registros).map((grupo) => {
        const titulo = tituloDoDia(grupo.dia, hojeIso);
        const idTitulo = `historico-dia-${grupo.dia}`;
        return (
          <section key={grupo.dia} className={estilos.dia} aria-labelledby={idTitulo}>
            <h2 className={estilos.tituloDia} id={idTitulo}>
              <span>{titulo.principal}</span>
              {titulo.complemento ? <span className={estilos.complementoDia}>{titulo.complemento}</span> : null}
            </h2>
            <ol className={estilos.lista}>
              {grupo.registros.map((registro) => {
                const { icone: Icone, tom } = aparenciaEvento[registro.tipo];
                return (
                  <li key={registro.id} className={estilos.item}>
                    <button
                      type="button"
                      className={estilos.botao}
                      aria-haspopup="dialog"
                      aria-label={rotuloAcessivel(registro)}
                      onClick={() => aoAbrir(registro)}
                    >
                      <span className={juntarClasses(estilos.icone, estilos[tom])} aria-hidden="true">
                        <Icone size={15} strokeWidth={2.25} />
                      </span>
                      <span className={estilos.textos}>
                        <span className={estilos.tipo}>{rotuloEventoHistorico[registro.tipo]}</span>
                        <span className={juntarClasses(estilos.titulo, registro.tipo === 'TAREFA_CANCELADA' && estilos.tachado)}>
                          {registro.titulo}
                        </span>
                        <MetaRegistro registro={registro} />
                      </span>
                      {registro.comHorario ? (
                        <time className={estilos.horario} dateTime={registro.ocorridoEm}>
                          {formatarHorario(registro.ocorridoEm)}
                        </time>
                      ) : (
                        <span className={estilos.horarioVazio}>Dia inteiro</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}
    </div>
  );
}
