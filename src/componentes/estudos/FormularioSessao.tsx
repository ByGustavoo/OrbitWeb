import { useId, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { AlertCircle, BookOpen, Trash2 } from 'lucide-react';
import { ErroApi } from '@/api/ErroApi';
import { AreaTexto, Botao, CampoNumero, CampoSelecao, DialogoConfirmacao, Modal, SeletorData, SeletorHorario } from '@/componentes/ui';
import type { OpcaoSelecao } from '@/componentes/ui';
import { coresDaPaleta } from '@/modelos/cores';
import type { AtividadeEstudoDTO, SessaoEnvioDTO, SessaoEstudoDTO } from '@/modelos/estudos';
import { LIMITE_OBSERVACAO_SESSAO, primeiroCampoComErroSessao, validarSessao } from '@/regras/validacaoSessao';
import type { CampoSessao, ErrosSessao } from '@/regras/validacaoSessao';
import { dataIsoLocal, deDataIso, ehDataIsoValida, ehHorarioValido, hojeIso } from '@/utilitarios/datas';
import { formatarDuracaoSegundos, formatarInstante, pluralizar } from '@/utilitarios/formatacao';
import estilos from './FormularioSessao.module.css';

export interface FormularioSessaoProps {
  aberto: boolean;
  sessao: SessaoEstudoDTO | null;
  atividades: AtividadeEstudoDTO[] | null;
  atividadePadraoId: number | null;
  aoFechar: () => void;
  aoEnviar: (dados: SessaoEnvioDTO) => Promise<void>;
  aoExcluir: (sessao: SessaoEstudoDTO) => Promise<void>;
}

type CampoFormulario = 'atividadeId' | 'data' | 'horario' | 'duracao' | 'observacao';

interface EstadoFormulario {
  atividadeId: number | null;
  data: string | null;
  horario: string | null;
  duracaoMinutos: number | null;
  observacao: string;
}

const CAMPO_DO_ERRO: Record<CampoSessao, CampoFormulario> = {
  atividadeId: 'atividadeId',
  inicio: 'horario',
  duracaoSegundos: 'duracao',
  observacao: 'observacao',
};

const ORDEM_CAMPOS: CampoFormulario[] = ['atividadeId', 'data', 'horario', 'duracao', 'observacao'];

function horarioDe(instante: string): string {
  const data = new Date(instante);
  return `${String(data.getHours()).padStart(2, '0')}:${String(data.getMinutes()).padStart(2, '0')}`;
}

function horarioSugerido(): string {
  const agora = new Date(Date.now() - 60 * 60000);
  const minutos = Math.floor(agora.getMinutes() / 5) * 5;
  return `${String(agora.getHours()).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;
}

function instanteLocal(data: string, horario: string): Date {
  const [hora = 0, minuto = 0] = horario.split(':').map(Number);
  const dia = deDataIso(data);
  return new Date(dia.getFullYear(), dia.getMonth(), dia.getDate(), hora, minuto);
}

function estadoInicial(sessao: SessaoEstudoDTO | null, atividadePadraoId: number | null): EstadoFormulario {
  if (!sessao) {
    return { atividadeId: atividadePadraoId, data: hojeIso(), horario: horarioSugerido(), duracaoMinutos: 30, observacao: '' };
  }
  return {
    atividadeId: sessao.atividade.id,
    data: dataIsoLocal(new Date(sessao.inicio)),
    horario: horarioDe(sessao.inicio),
    duracaoMinutos: Math.max(1, Math.round(sessao.duracaoSegundos / 60)),
    observacao: sessao.observacao ?? '',
  };
}

function paraEnvio(estado: EstadoFormulario, sessao: SessaoEstudoDTO | null, inicial: EstadoFormulario): SessaoEnvioDTO {
  const valido = estado.data && estado.horario && ehDataIsoValida(estado.data) && ehHorarioValido(estado.horario);
  const inicio = valido ? instanteLocal(estado.data as string, estado.horario as string) : null;
  const duracaoSegundos = Math.round((estado.duracaoMinutos ?? 0) * 60);
  const mantemHorarios =
    sessao !== null && estado.data === inicial.data && estado.horario === inicial.horario && estado.duracaoMinutos === inicial.duracaoMinutos;
  const observacao = estado.observacao.trim();

  return {
    atividadeId: estado.atividadeId ?? 0,
    tarefaId: sessao?.tarefa?.id ?? null,
    modo: sessao?.modo ?? 'LIVRE',
    origem: sessao?.origem ?? 'MANUAL',
    inicio: mantemHorarios && sessao ? sessao.inicio : inicio ? inicio.toISOString() : '',
    fim: mantemHorarios && sessao ? sessao.fim : inicio ? new Date(inicio.getTime() + duracaoSegundos * 1000).toISOString() : '',
    duracaoSegundos: mantemHorarios && sessao ? sessao.duracaoSegundos : duracaoSegundos,
    ciclosConcluidos: sessao?.ciclosConcluidos ?? null,
    observacao: observacao ? observacao : null,
  };
}

function errosDoFormulario(erros: ErrosSessao, estado: EstadoFormulario): Partial<Record<CampoFormulario, string>> {
  const mapeados: Partial<Record<CampoFormulario, string>> = {};
  if (!estado.data || !ehDataIsoValida(estado.data)) mapeados.data = 'Escolha o dia da sessão.';
  else if (estado.data > hojeIso()) mapeados.data = 'A sessão não pode ser num dia futuro.';
  if (!estado.horario) mapeados.horario = 'Informe o horário de início.';
  if (estado.duracaoMinutos === null) mapeados.duracao = 'Informe quantos minutos você estudou.';
  (Object.entries(erros) as [CampoSessao, string][]).forEach(([campo, mensagem]) => {
    const destino = CAMPO_DO_ERRO[campo];
    if (!mapeados[destino] && !(destino === 'horario' && mapeados.data)) mapeados[destino] = mensagem;
  });
  return mapeados;
}

function descreverOrigem(sessao: SessaoEstudoDTO): string {
  if (sessao.origem === 'MANUAL') return 'Lançada manualmente';
  if (sessao.modo === 'POMODORO') {
    return `Registrada pelo cronômetro no Pomodoro${sessao.ciclosConcluidos ? `, ${pluralizar(sessao.ciclosConcluidos, 'ciclo', 'ciclos')}` : ''}`;
  }
  return 'Registrada pelo cronômetro';
}

export function FormularioSessao({ aberto, sessao, atividades, atividadePadraoId, aoFechar, aoEnviar, aoExcluir }: FormularioSessaoProps) {
  const idBase = useId();
  const idFormulario = `${idBase}-formulario`;
  const idCampo = (campo: CampoFormulario) => `${idBase}-${campo}`;
  const edicao = sessao !== null;

  const [inicial] = useState(() => estadoInicial(sessao, atividadePadraoId));
  const [estado, setEstado] = useState(inicial);
  const [tocados, setTocados] = useState<ReadonlySet<CampoFormulario>>(new Set());
  const [tentouEnviar, setTentouEnviar] = useState(false);
  const [errosServidor, setErrosServidor] = useState<Partial<Record<CampoFormulario, string>>>({});
  const [falhaGeral, setFalhaGeral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [confirmandoDescarte, setConfirmandoDescarte] = useState(false);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  const envio = useMemo(() => paraEnvio(estado, sessao, inicial), [estado, sessao, inicial]);
  const atividadeDisponivel =
    atividades === null ||
    estado.atividadeId === null ||
    atividades.some((atividade) => atividade.id === estado.atividadeId && (!atividade.arquivada || atividade.id === sessao?.atividade.id));
  const errosValidacao = useMemo(() => {
    const erros = errosDoFormulario(validarSessao(envio, new Date()), estado);
    return atividadeDisponivel ? erros : { ...erros, atividadeId: 'Escolha a atividade que você estudou.' };
  }, [envio, estado, atividadeDisponivel]);
  const alterado = JSON.stringify(inicial) !== JSON.stringify(estado);

  const erro = (campo: CampoFormulario): string | undefined => {
    if (errosServidor[campo]) return errosServidor[campo];
    if (!tentouEnviar && !tocados.has(campo)) return undefined;
    return errosValidacao[campo];
  };

  const tocar = (campo: CampoFormulario) => setTocados((atuais) => (atuais.has(campo) ? atuais : new Set([...atuais, campo])));

  const mudar = <C extends keyof EstadoFormulario>(chave: C, valor: EstadoFormulario[C], campo: CampoFormulario, marcarTocado = true) => {
    setEstado((atual) => ({ ...atual, [chave]: valor }));
    setErrosServidor({});
    setFalhaGeral(null);
    if (marcarTocado) tocar(campo);
  };

  const focarCampo = (campo: CampoFormulario) => {
    window.requestAnimationFrame(() => document.getElementById(idCampo(campo))?.focus());
  };

  const aoSubmeter = async (evento: FormEvent) => {
    evento.preventDefault();
    if (enviando) return;
    setTentouEnviar(true);
    const primeiro = ORDEM_CAMPOS.find((campo) => errosValidacao[campo]);
    if (primeiro) {
      focarCampo(primeiro);
      return;
    }
    setEnviando(true);
    setFalhaGeral(null);
    try {
      await aoEnviar(envio);
    } catch (falha) {
      if (falha instanceof ErroApi && falha.tipo === 'VALIDACAO' && falha.erros.length > 0) {
        const doServidor: ErrosSessao = {};
        falha.erros.forEach(({ campo, mensagem }) => {
          doServidor[campo as CampoSessao] = mensagem;
        });
        const mapeados = errosDoFormulario(doServidor, estado);
        setErrosServidor(mapeados);
        const primeiroServidor = primeiroCampoComErroSessao(doServidor);
        if (primeiroServidor) focarCampo(CAMPO_DO_ERRO[primeiroServidor]);
        return;
      }
      if (falha instanceof ErroApi && falha.tipo === 'NAO_ENCONTRADO') {
        setFalhaGeral('Esta sessão foi excluída em outra tela. Feche o formulário para ver o histórico atualizado.');
        return;
      }
      setFalhaGeral('Não foi possível salvar a sessão. Verifique a conexão e tente de novo. O que você preencheu continua aqui.');
    } finally {
      setEnviando(false);
    }
  };

  const pedirFechamento = () => {
    if (enviando) return;
    if (alterado) {
      setConfirmandoDescarte(true);
      return;
    }
    aoFechar();
  };

  const excluir = async () => {
    if (!sessao) return;
    setExcluindo(true);
    try {
      await aoExcluir(sessao);
    } finally {
      setExcluindo(false);
      setConfirmandoExclusao(false);
    }
  };

  const opcoesAtividade: OpcaoSelecao<string>[] = (atividades ?? [])
    .filter((atividade) => !atividade.arquivada || atividade.id === sessao?.atividade.id)
    .map((atividade) => ({
      valor: String(atividade.id),
      rotulo: atividade.nome,
      descricao: atividade.arquivada ? 'Arquivada' : undefined,
      icone: BookOpen,
      cor: coresDaPaleta(atividade.cor).texto,
    }));

  const duracaoOriginalDiferente = sessao && Math.round(sessao.duracaoSegundos / 60) * 60 !== sessao.duracaoSegundos;

  return (
    <>
      <Modal
        aberto={aberto}
        aoFechar={pedirFechamento}
        titulo={edicao ? 'Editar sessão' : 'Lançar sessão'}
        descricao={edicao ? descreverOrigem(sessao) : 'Registre um estudo feito sem o cronômetro.'}
        tamanho="md"
        rodape={
          <>
            {edicao ? (
              <Botao variante="terciario" icone={Trash2} className={estilos.excluir} disabled={enviando} onClick={() => setConfirmandoExclusao(true)}>
                Excluir
              </Botao>
            ) : null}
            <Botao variante="secundario" onClick={pedirFechamento} disabled={enviando}>
              Cancelar
            </Botao>
            <Botao type="submit" form={idFormulario} carregando={enviando}>
              {edicao ? 'Salvar alterações' : 'Lançar sessão'}
            </Botao>
          </>
        }
      >
        <form id={idFormulario} className={estilos.formulario} onSubmit={(evento) => void aoSubmeter(evento)} noValidate>
          {falhaGeral ? (
            <p className={estilos.falha} role="alert">
              <AlertCircle size={16} strokeWidth={2} aria-hidden="true" />
              {falhaGeral}
            </p>
          ) : null}

          <CampoSelecao
            id={idCampo('atividadeId')}
            rotulo="Atividade"
            obrigatorio
            opcoes={opcoesAtividade}
            valor={estado.atividadeId === null ? null : String(estado.atividadeId)}
            aoMudar={(valor) => mudar('atividadeId', valor === null ? null : Number(valor), 'atividadeId')}
            textoVazio={atividades === null ? 'Carregando…' : 'Escolher atividade'}
            desabilitado={atividades === null}
            erro={erro('atividadeId')}
          />

          <div className={estilos.grade}>
            <SeletorData
              id={idCampo('data')}
              rotulo="Dia"
              obrigatorio
              valor={estado.data}
              aoMudar={(valor) => mudar('data', valor, 'data')}
              permitirLimpar={false}
              erro={erro('data')}
            />
            <SeletorHorario
              id={idCampo('horario')}
              rotulo="Início"
              obrigatorio
              valor={estado.horario}
              aoMudar={(valor) => mudar('horario', valor, 'horario')}
              permitirLimpar={false}
              erro={erro('horario')}
            />
            <CampoNumero
              id={idCampo('duracao')}
              className={estilos.duracao}
              rotulo="Duração"
              obrigatorio
              valor={estado.duracaoMinutos}
              aoMudar={(valor) => mudar('duracaoMinutos', valor, 'duracao')}
              minimo={1}
              maximo={24 * 60}
              passo={5}
              sufixo="min"
              erro={erro('duracao')}
              dica={
                duracaoOriginalDiferente && estado.duracaoMinutos === inicial.duracaoMinutos
                  ? `Tempo registrado: ${formatarDuracaoSegundos(sessao.duracaoSegundos)}.`
                  : 'Só o tempo em que você estudou, sem as pausas.'
              }
            />
          </div>

          <AreaTexto
            id={idCampo('observacao')}
            rotulo="Observação"
            value={estado.observacao}
            rows={2}
            maxLength={LIMITE_OBSERVACAO_SESSAO + 50}
            placeholder="Ex.: Li os capítulos 3 e 4"
            onChange={(evento) => mudar('observacao', evento.target.value, 'observacao', false)}
            onBlur={() => estado.observacao !== inicial.observacao && tocar('observacao')}
            erro={erro('observacao')}
          />

          {sessao?.tarefa ? <p className={estilos.tarefa}>Ligada à tarefa “{sessao.tarefa.titulo}”.</p> : null}
          {sessao ? <p className={estilos.registro}>Terminou em {formatarInstante(sessao.fim)}.</p> : null}
        </form>
      </Modal>

      <DialogoConfirmacao
        aberto={confirmandoDescarte}
        titulo="Descartar as alterações?"
        descricao={edicao ? 'As mudanças que você fez nesta sessão não serão salvas.' : 'A sessão que você começou a lançar não será registrada.'}
        textoConfirmar="Descartar"
        textoCancelar="Continuar editando"
        destrutivo
        aoConfirmar={() => {
          setConfirmandoDescarte(false);
          aoFechar();
        }}
        aoCancelar={() => setConfirmandoDescarte(false)}
      />

      <DialogoConfirmacao
        aberto={confirmandoExclusao}
        titulo="Excluir sessão?"
        descricao={
          sessao
            ? `${formatarDuracaoSegundos(sessao.duracaoSegundos)} de ${sessao.atividade.nome} saem do histórico, das metas e dos gráficos. Esta ação não poderá ser desfeita.`
            : ''
        }
        textoConfirmar="Excluir"
        destrutivo
        carregando={excluindo}
        aoConfirmar={() => void excluir()}
        aoCancelar={() => setConfirmandoExclusao(false)}
      />
    </>
  );
}
