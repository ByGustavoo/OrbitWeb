import { useCallback, useId, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { AlertCircle, BookOpen, Circle, CircleCheck, CircleDot, CircleSlash, Tag } from 'lucide-react';
import { descreverFalha, ehErroApi, errosDeCampo } from '@/api/tratamentoErros';
import {
  AreaTexto,
  Botao,
  CampoSelecao,
  CampoTexto,
  DialogoConfirmacao,
  Interruptor,
  Modal,
  SeletorData,
  SeletorHorario,
} from '@/componentes/ui';
import type { OpcaoSelecao } from '@/componentes/ui';
import { useDadosAssincronos } from '@/ganchos/useDadosAssincronos';
import { coresDaPaleta, coresDaPrioridade } from '@/modelos/cores';
import type { EscopoAlteracao, Prioridade, Situacao } from '@/modelos/enumeracoes';
import { PRIORIDADES, SITUACOES } from '@/modelos/enumeracoes';
import { rotuloLembrete, rotuloPrioridade, rotuloSituacao } from '@/modelos/rotulos';
import type { MinutosLembrete, TarefaDTO, TarefaEnvioDTO } from '@/modelos/tarefas';
import { MINUTOS_LEMBRETE } from '@/modelos/tarefas';
import { useAlteracoes } from '@/provedores/ProvedorAlteracoes';
import { diaSemanaDe, mesmaRecorrencia } from '@/regras/recorrencia';
import type { CampoTarefa, ErrosTarefa } from '@/regras/validacaoTarefa';
import { LIMITE_TITULO, normalizarTarefa, primeiroCampoComErro, validarTarefa } from '@/regras/validacaoTarefa';
import { servicoAtividades, servicoCategorias } from '@/servicos';
import { formatarDataLonga } from '@/utilitarios/formatacao';
import { CamposRecorrencia } from './CamposRecorrencia';
import type { ValoresRecorrencia } from './CamposRecorrencia';
import { EscolhaEscopoAlteracao } from './EscolhaEscopoAlteracao';
import { iconePrioridade } from './iconesTarefa';
import estilos from './FormularioTarefa.module.css';

interface EstadoFormulario {
  titulo: string;
  descricao: string;
  data: string | null;
  diaInteiro: boolean;
  horarioInicio: string | null;
  horarioFim: string | null;
  prioridade: Prioridade;
  situacao: Situacao;
  categoriaId: number | null;
  atividadeId: number | null;
  lembrete: MinutosLembrete | null;
  recorrente: boolean;
  recorrencia: ValoresRecorrencia;
}

type CampoFormulario = CampoTarefa | 'categoriaId' | 'atividadeId';

export interface FormularioTarefaProps {
  aberto: boolean;
  tarefa: TarefaDTO | null;
  dataPadrao: string | null;
  aoFechar: () => void;
  aoEnviar: (dados: TarefaEnvioDTO, escopo: EscopoAlteracao) => Promise<void>;
}

const EXEMPLOS_TITULO = [
  'Pagar a conta de luz',
  'Fazer compras no mercado',
  'Marcar consulta no médico',
  'Ligar para a família',
  'Ler 20 páginas de um livro',
  'Levar o carro para a revisão',
  'Ir à academia',
  'Organizar o guarda-roupa',
  'Estudar para a prova',
  'Buscar as crianças na escola',
] as const;

function sortearExemploTitulo(): string {
  return EXEMPLOS_TITULO[Math.floor(Math.random() * EXEMPLOS_TITULO.length)] ?? EXEMPLOS_TITULO[0];
}

const iconeSituacao = { PENDENTE: Circle, EM_ANDAMENTO: CircleDot, CONCLUIDA: CircleCheck, CANCELADA: CircleSlash };

const opcoesPrioridade: OpcaoSelecao<Prioridade>[] = [...PRIORIDADES].reverse().map((prioridade) => ({
  valor: prioridade,
  rotulo: rotuloPrioridade[prioridade],
  icone: iconePrioridade[prioridade],
  cor: coresDaPrioridade(prioridade).texto,
}));

const opcoesSituacao: OpcaoSelecao<Situacao>[] = SITUACOES.map((situacao) => ({
  valor: situacao,
  rotulo: rotuloSituacao[situacao],
  icone: iconeSituacao[situacao],
}));

const opcoesLembrete: OpcaoSelecao<string>[] = MINUTOS_LEMBRETE.map((minutos) => ({
  valor: String(minutos),
  rotulo: rotuloLembrete[minutos],
}));

function estadoInicial(tarefa: TarefaDTO | null, dataPadrao: string | null): EstadoFormulario {
  if (!tarefa) {
    const data = dataPadrao;
    return {
      titulo: '',
      descricao: '',
      data,
      diaInteiro: false,
      horarioInicio: null,
      horarioFim: null,
      prioridade: 'MEDIA',
      situacao: 'PENDENTE',
      categoriaId: null,
      atividadeId: null,
      lembrete: null,
      recorrente: false,
      recorrencia: { frequencia: 'SEMANAL', diasSemana: data ? [diaSemanaDe(data)] : [], termino: 'NUNCA', dataFim: null },
    };
  }

  const recorrencia = tarefa.recorrencia;
  return {
    titulo: tarefa.titulo,
    descricao: tarefa.descricao ?? '',
    data: tarefa.data,
    diaInteiro: tarefa.diaInteiro && Boolean(tarefa.data),
    horarioInicio: tarefa.horarioInicio,
    horarioFim: tarefa.horarioFim,
    prioridade: tarefa.prioridade,
    situacao: tarefa.situacao,
    categoriaId: tarefa.categoria?.id ?? null,
    atividadeId: tarefa.atividade?.id ?? null,
    lembrete: tarefa.lembreteMinutosAntes,
    recorrente: recorrencia !== null,
    recorrencia: {
      frequencia: recorrencia?.frequencia ?? 'SEMANAL',
      diasSemana: recorrencia?.diasSemana ?? (tarefa.data ? [diaSemanaDe(tarefa.data)] : []),
      termino: recorrencia?.dataFim ? 'DATA' : 'NUNCA',
      dataFim: recorrencia?.dataFim ?? null,
    },
  };
}

function paraEnvio(estado: EstadoFormulario): TarefaEnvioDTO {
  return normalizarTarefa({
    titulo: estado.titulo,
    descricao: estado.descricao,
    data: estado.data,
    diaInteiro: estado.diaInteiro,
    horarioInicio: estado.horarioInicio,
    horarioFim: estado.horarioFim,
    prioridade: estado.prioridade,
    situacao: estado.situacao,
    categoriaId: estado.categoriaId,
    atividadeId: estado.atividadeId,
    lembreteMinutosAntes: estado.lembrete,
    recorrencia: estado.recorrente
      ? {
          frequencia: estado.recorrencia.frequencia,
          diasSemana: estado.recorrencia.diasSemana,
          dataFim: estado.recorrencia.termino === 'DATA' ? estado.recorrencia.dataFim : null,
        }
      : null,
  });
}

const CAMPOS_POR_ALTERACAO: Partial<Record<keyof EstadoFormulario, CampoFormulario[]>> = {
  titulo: ['titulo'],
  descricao: ['descricao'],
  data: ['data', 'horarioInicio', 'horarioFim', 'lembreteMinutosAntes', 'frequencia', 'dataFim'],
  diaInteiro: ['horarioInicio', 'horarioFim', 'lembreteMinutosAntes'],
  horarioInicio: ['horarioInicio', 'horarioFim', 'lembreteMinutosAntes'],
  horarioFim: ['horarioFim'],
  prioridade: ['prioridade'],
  situacao: ['situacao'],
  categoriaId: ['categoriaId'],
  atividadeId: ['atividadeId'],
  lembrete: ['lembreteMinutosAntes'],
  recorrente: ['frequencia', 'diasSemana', 'dataFim'],
  recorrencia: ['frequencia', 'diasSemana', 'dataFim'],
};

export function FormularioTarefa({ aberto, tarefa, dataPadrao, aoFechar, aoEnviar }: FormularioTarefaProps) {
  const idBase = useId();
  const idFormulario = `${idBase}-formulario`;
  const idCampo = (campo: CampoFormulario) => `${idBase}-${campo}`;
  const { versoes } = useAlteracoes();

  const [inicial] = useState(() => estadoInicial(tarefa, dataPadrao));
  const [exemploTitulo] = useState(sortearExemploTitulo);
  const [estado, setEstado] = useState<EstadoFormulario>(inicial);
  const [tocados, setTocados] = useState<ReadonlySet<CampoFormulario>>(new Set());
  const [tentouEnviar, setTentouEnviar] = useState(false);
  const [errosServidor, setErrosServidor] = useState<Partial<Record<CampoFormulario, string>>>({});
  const [falhaGeral, setFalhaGeral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [pedindoEscopo, setPedindoEscopo] = useState(false);
  const [confirmandoDescarte, setConfirmandoDescarte] = useState(false);
  const [diasEscolhidos, setDiasEscolhidos] = useState(() => tarefa?.recorrencia?.diasSemana != null);

  const categorias = useDadosAssincronos((signal) => servicoCategorias.buscarCategorias(signal), [versoes.categorias]);
  const atividades = useDadosAssincronos((signal) => servicoAtividades.buscarAtividades(signal), [versoes.atividades]);

  const envio = useMemo(() => paraEnvio(estado), [estado]);
  const errosValidacao: ErrosTarefa = useMemo(() => {
    const erros = validarTarefa(envio);
    const semTermino = envio.recorrencia !== null && estado.recorrencia.termino === 'DATA' && !estado.recorrencia.dataFim;
    return semTermino ? { ...erros, dataFim: 'Escolha a data da última repetição ou marque “Nunca”.' } : erros;
  }, [envio, estado.recorrencia.termino, estado.recorrencia.dataFim]);
  const alterado = useMemo(() => JSON.stringify(paraEnvio(inicial)) !== JSON.stringify(envio), [inicial, envio]);
  const edicao = tarefa !== null;
  const ehSerie = tarefa?.serieId != null;

  const erro = (campo: CampoFormulario): string | undefined => {
    const doServidor = errosServidor[campo];
    if (doServidor) return doServidor;
    if (!tentouEnviar && !tocados.has(campo)) return undefined;
    return (errosValidacao as Partial<Record<CampoFormulario, string>>)[campo];
  };

  const tocar = useCallback((...campos: CampoFormulario[]) => {
    setTocados((atuais) => {
      if (campos.every((campo) => atuais.has(campo))) return atuais;
      return new Set([...atuais, ...campos]);
    });
  }, []);

  const mudar = <C extends keyof EstadoFormulario>(chave: C, valor: EstadoFormulario[C], marcarTocado = true) => {
    setEstado((atual) => ({ ...atual, [chave]: valor }));
    const afetados = CAMPOS_POR_ALTERACAO[chave] ?? [];
    setErrosServidor((atuais) => {
      const proximos = { ...atuais };
      afetados.forEach((campo) => delete proximos[campo]);
      return proximos;
    });
    setFalhaGeral(null);
    if (marcarTocado) tocar(...afetados.slice(0, 1));
  };

  const mudarData = (data: string | null) => {
    setEstado((atual) => {
      const acompanhaData = !diasEscolhidos || atual.recorrencia.diasSemana.length === 0;
      const proximaRecorrencia =
        data && acompanhaData ? { ...atual.recorrencia, diasSemana: [diaSemanaDe(data)] } : atual.recorrencia;
      return { ...atual, data, recorrencia: proximaRecorrencia };
    });
    setErrosServidor({});
    setFalhaGeral(null);
    tocar('data');
  };

  const focarCampo = (campo: CampoFormulario) => {
    window.requestAnimationFrame(() => document.getElementById(idCampo(campo))?.focus());
  };

  const enviar = async (escopo: EscopoAlteracao) => {
    setEnviando(true);
    setFalhaGeral(null);
    try {
      await aoEnviar(envio, escopo);
      setPedindoEscopo(false);
    } catch (falha) {
      setPedindoEscopo(false);
      const mapeados = errosDeCampo<CampoFormulario>(falha);
      if (ehErroApi(falha, 'VALIDACAO') && Object.keys(mapeados).length > 0) {
        setErrosServidor(mapeados);
        const primeiro = primeiroCampoComErro(mapeados as ErrosTarefa) ?? (Object.keys(mapeados)[0] as CampoFormulario | undefined);
        if (primeiro) focarCampo(primeiro);
        return;
      }
      if (ehErroApi(falha, 'NAO_ENCONTRADO')) {
        setFalhaGeral('Esta tarefa foi excluída enquanto você editava. Feche o formulário para ver a lista atualizada.');
        return;
      }
      setFalhaGeral(`Não foi possível salvar a tarefa. ${descreverFalha(falha)} O que você preencheu continua aqui.`);
    } finally {
      setEnviando(false);
    }
  };

  const aoSubmeter = (evento: FormEvent) => {
    evento.preventDefault();
    if (enviando) return;
    setTentouEnviar(true);
    const primeiro = primeiroCampoComErro(errosValidacao);
    if (primeiro) {
      focarCampo(primeiro);
      return;
    }
    if (ehSerie) {
      setPedindoEscopo(true);
      return;
    }
    void enviar('SOMENTE_ESTA');
  };

  const pedirFechamento = () => {
    if (enviando) return;
    if (alterado) {
      setConfirmandoDescarte(true);
      return;
    }
    aoFechar();
  };

  const opcoesCategoria: OpcaoSelecao<string>[] = (categorias.dados ?? []).map((categoria) => ({
    valor: String(categoria.id),
    rotulo: categoria.nome,
    icone: Tag,
    cor: coresDaPaleta(categoria.cor).texto,
  }));

  const opcoesAtividade: OpcaoSelecao<string>[] = (atividades.dados ?? [])
    .filter((atividade) => !atividade.arquivada || atividade.id === estado.atividadeId)
    .map((atividade) => ({
      valor: String(atividade.id),
      rotulo: atividade.nome,
      descricao: atividade.arquivada ? 'Arquivada' : undefined,
      icone: BookOpen,
      cor: coresDaPaleta(atividade.cor).texto,
    }));

  const temData = Boolean(estado.data);
  const usaHorario = temData && !estado.diaInteiro;
  const podeLembrar = usaHorario && Boolean(estado.horarioInicio);
  const regraMudou = ehSerie && !mesmaRecorrencia(tarefa?.recorrencia ?? null, envio.recorrencia);
  const dataOcorrencia = tarefa?.data ? formatarDataLonga(tarefa.data) : '';

  return (
    <>
      <Modal
        aberto={aberto}
        aoFechar={pedirFechamento}
        titulo={edicao ? 'Editar tarefa' : 'Nova tarefa'}
        descricao={edicao ? undefined : 'Os campos marcados com * são obrigatórios.'}
        tamanho="lg"
        focarPrimeiroCampo
        rodape={
          <>
            <Botao variante="secundario" onClick={pedirFechamento} disabled={enviando}>
              Cancelar
            </Botao>
            <Botao type="submit" form={idFormulario} carregando={enviando && !pedindoEscopo}>
              {edicao ? 'Salvar alterações' : 'Criar tarefa'}
            </Botao>
          </>
        }
      >
        <form id={idFormulario} className={estilos.formulario} onSubmit={aoSubmeter} noValidate>
          {falhaGeral ? (
            <p className={estilos.falha} role="alert">
              <AlertCircle size={16} strokeWidth={2} aria-hidden="true" />
              {falhaGeral}
            </p>
          ) : null}

          <CampoTexto
            id={idCampo('titulo')}
            rotulo="Título"
            required
            value={estado.titulo}
            maxLength={LIMITE_TITULO + 20}
            autoComplete="off"
            placeholder={`Ex.: ${exemploTitulo}`}
            onChange={(evento) => mudar('titulo', evento.target.value, false)}
            onBlur={() => estado.titulo !== inicial.titulo && tocar('titulo')}
            erro={erro('titulo')}
          />

          <AreaTexto
            id={idCampo('descricao')}
            rotulo="Descrição"
            value={estado.descricao}
            rows={3}
            placeholder="Detalhes que ajudam a fazer a tarefa, como endereço, horário ou o que levar"
            onChange={(evento) => mudar('descricao', evento.target.value, false)}
            onBlur={() => estado.descricao !== inicial.descricao && tocar('descricao')}
            erro={erro('descricao')}
          />

          <fieldset className={estilos.secao}>
            <legend className={estilos.tituloSecao}>Quando</legend>
            <div className={estilos.grade}>
              <SeletorData
                id={idCampo('data')}
                rotulo="Data"
                valor={estado.data}
                aoMudar={mudarData}
                textoVazio="Sem data"
                erro={erro('data')}
                dica={temData ? undefined : 'Sem data, a tarefa fica em Tarefas › Sem data e não aparece no calendário.'}
              />
              {temData ? (
                <Interruptor
                  className={estilos.interruptorAlinhado}
                  rotulo="Dia inteiro"
                  descricao="Sem horário definido"
                  ligado={estado.diaInteiro}
                  aoMudar={(ligado) => mudar('diaInteiro', ligado)}
                />
              ) : null}
              {usaHorario ? (
                <>
                  <SeletorHorario
                    id={idCampo('horarioInicio')}
                    rotulo="Início"
                    valor={estado.horarioInicio}
                    aoMudar={(valor) => mudar('horarioInicio', valor)}
                    textoVazio="Sem horário"
                    erro={erro('horarioInicio')}
                  />
                  <SeletorHorario
                    id={idCampo('horarioFim')}
                    rotulo="Fim"
                    valor={estado.horarioFim}
                    aoMudar={(valor) => mudar('horarioFim', valor)}
                    textoVazio="Sem horário"
                    desabilitado={!estado.horarioInicio && !estado.horarioFim}
                    erro={erro('horarioFim')}
                    dica={!estado.horarioInicio && !estado.horarioFim ? 'Defina o início primeiro.' : undefined}
                  />
                </>
              ) : null}
            </div>
          </fieldset>

          <fieldset className={estilos.secao}>
            <legend className={estilos.tituloSecao}>Organização</legend>
            <div className={estilos.grade}>
              <CampoSelecao
                id={idCampo('prioridade')}
                rotulo="Prioridade"
                opcoes={opcoesPrioridade}
                valor={estado.prioridade}
                aoMudar={(valor) => valor && mudar('prioridade', valor)}
                erro={erro('prioridade')}
              />
              <CampoSelecao
                id={idCampo('situacao')}
                rotulo="Situação"
                opcoes={opcoesSituacao}
                valor={estado.situacao}
                aoMudar={(valor) => valor && mudar('situacao', valor)}
                erro={erro('situacao')}
                dica={estado.situacao === 'CANCELADA' ? 'Cancelada fica no histórico, fora das pendentes.' : undefined}
              />
              <CampoSelecao
                id={idCampo('categoriaId')}
                rotulo="Categoria"
                opcoes={opcoesCategoria}
                valor={estado.categoriaId === null ? null : String(estado.categoriaId)}
                aoMudar={(valor) => mudar('categoriaId', valor === null ? null : Number(valor))}
                permitirVazio
                textoVazio={categorias.carregando && !categorias.dados ? 'Carregando…' : 'Sem categoria'}
                desabilitado={!categorias.dados}
                erro={erro('categoriaId')}
                dica={categorias.erro ? 'Não foi possível carregar as categorias agora.' : undefined}
              />
              <CampoSelecao
                id={idCampo('atividadeId')}
                rotulo="Atividade de estudo"
                opcoes={opcoesAtividade}
                valor={estado.atividadeId === null ? null : String(estado.atividadeId)}
                aoMudar={(valor) => mudar('atividadeId', valor === null ? null : Number(valor))}
                permitirVazio
                textoVazio={atividades.carregando && !atividades.dados ? 'Carregando…' : 'Nenhuma'}
                desabilitado={!atividades.dados}
                erro={erro('atividadeId')}
                dica={atividades.erro ? 'Não foi possível carregar as atividades agora.' : undefined}
              />
              <CampoSelecao
                id={idCampo('lembreteMinutosAntes')}
                rotulo="Lembrete"
                opcoes={opcoesLembrete}
                valor={podeLembrar && estado.lembrete !== null ? String(estado.lembrete) : null}
                aoMudar={(valor) => mudar('lembrete', valor === null ? null : (Number(valor) as MinutosLembrete))}
                permitirVazio
                textoVazio="Nenhum"
                desabilitado={!podeLembrar}
                erro={erro('lembreteMinutosAntes')}
                dica={podeLembrar ? 'Aparece como aviso enquanto o Orbit estiver aberto.' : 'Defina um horário de início para receber lembrete.'}
              />
            </div>
          </fieldset>

          <fieldset className={estilos.secao}>
            <legend className={estilos.tituloSecao}>Repetição</legend>
            <Interruptor
              rotulo="Repetir tarefa"
              descricao={temData ? 'As próximas ocorrências são criadas automaticamente.' : 'Escolha uma data para repetir a tarefa.'}
              ligado={temData && estado.recorrente}
              desabilitado={!temData}
              aoMudar={(ligado) => mudar('recorrente', ligado)}
            />
            {temData && estado.recorrente ? (
              <CamposRecorrencia
                valores={estado.recorrencia}
                dataInicial={estado.data}
                erros={{ frequencia: erro('frequencia'), diasSemana: erro('diasSemana'), dataFim: erro('dataFim') }}
                idsCampos={{ frequencia: idCampo('frequencia'), diasSemana: idCampo('diasSemana'), dataFim: idCampo('dataFim') }}
                aoMudar={(parcial) => {
                  if (parcial.diasSemana) setDiasEscolhidos(true);
                  mudar('recorrencia', { ...estado.recorrencia, ...parcial });
                }}
              />
            ) : null}
          </fieldset>
        </form>
      </Modal>

      <EscolhaEscopoAlteracao
        aberto={pedindoEscopo}
        titulo="Salvar em quais ocorrências?"
        descricao="Esta tarefa se repete. Escolha até onde a alteração vale."
        textoConfirmar="Salvar"
        descricaoSomenteEsta={`Muda só a ocorrência de ${dataOcorrencia}. As outras continuam como estão.`}
        descricaoEstaEProximas="Muda esta e as seguintes. As anteriores não mudam; a situação muda só nesta."
        motivoSemSomenteEsta={regraMudou ? 'Indisponível: a repetição mudou, e isso vale para esta e as próximas.' : undefined}
        carregando={enviando}
        aoConfirmar={(escopo) => void enviar(escopo)}
        aoCancelar={() => setPedindoEscopo(false)}
      />

      <DialogoConfirmacao
        aberto={confirmandoDescarte}
        titulo="Descartar as alterações?"
        descricao={edicao ? 'As mudanças que você fez nesta tarefa não serão salvas.' : 'A tarefa que você começou a preencher não será criada.'}
        textoConfirmar="Descartar"
        textoCancelar="Continuar editando"
        destrutivo
        aoConfirmar={() => {
          setConfirmandoDescarte(false);
          aoFechar();
        }}
        aoCancelar={() => setConfirmandoDescarte(false)}
      />
    </>
  );
}
