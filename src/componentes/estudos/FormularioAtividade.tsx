import { useId, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { AlertCircle, Archive, Trash2 } from 'lucide-react';
import { descreverFalha, ehErroApi, errosDeCampo } from '@/api/tratamentoErros';
import { Botao, CampoNumero, CampoTexto, DialogoConfirmacao, Modal, SeletorCor } from '@/componentes/ui';
import type { Cor } from '@/modelos/enumeracoes';
import { CORES } from '@/modelos/enumeracoes';
import type { AtividadeEnvioDTO, AtividadeEstudoDTO } from '@/modelos/estudos';
import {
  LIMITE_META_SEMANAL_MINUTOS,
  LIMITE_NOME_ATIVIDADE,
  normalizarAtividade,
  primeiroCampoComErroAtividade,
  validarAtividade,
} from '@/regras/validacaoAtividade';
import type { CampoAtividade, ErrosAtividade } from '@/regras/validacaoAtividade';
import estilos from './FormularioAtividade.module.css';

export interface FormularioAtividadeProps {
  aberto: boolean;
  atividade: AtividadeEstudoDTO | null;
  existentes: AtividadeEstudoDTO[];
  sessoesDaAtividade: number | null;
  emUsoNoCronometro: boolean;
  aoFechar: () => void;
  aoEnviar: (dados: AtividadeEnvioDTO) => Promise<void>;
  aoArquivar: (atividade: AtividadeEstudoDTO) => Promise<void>;
  aoExcluir: (atividade: AtividadeEstudoDTO) => Promise<void>;
}

interface EstadoFormulario {
  nome: string;
  cor: Cor;
  metaHoras: number | null;
}

function corDisponivel(existentes: AtividadeEstudoDTO[]): Cor {
  const usadas = new Set(existentes.filter((atividade) => !atividade.arquivada).map((atividade) => atividade.cor));
  return CORES.find((cor) => !usadas.has(cor) && cor !== 'CINZA') ?? 'AZUL';
}

function paraEnvio(estado: EstadoFormulario): AtividadeEnvioDTO {
  return {
    nome: estado.nome,
    cor: estado.cor,
    metaSemanalMinutos: estado.metaHoras === null ? null : Math.round(estado.metaHoras * 60),
  };
}

export function FormularioAtividade({
  aberto,
  atividade,
  existentes,
  sessoesDaAtividade,
  emUsoNoCronometro,
  aoFechar,
  aoEnviar,
  aoArquivar,
  aoExcluir,
}: FormularioAtividadeProps) {
  const idBase = useId();
  const idFormulario = `${idBase}-formulario`;
  const idCampo = (campo: CampoAtividade) => `${idBase}-${campo}`;
  const edicao = atividade !== null;

  const [inicial] = useState<EstadoFormulario>(() => ({
    nome: atividade?.nome ?? '',
    cor: atividade?.cor ?? corDisponivel(existentes),
    metaHoras: atividade?.metaSemanalMinutos ? atividade.metaSemanalMinutos / 60 : null,
  }));
  const [estado, setEstado] = useState(inicial);
  const [tocados, setTocados] = useState<ReadonlySet<CampoAtividade>>(new Set());
  const [tentouEnviar, setTentouEnviar] = useState(false);
  const [errosServidor, setErrosServidor] = useState<ErrosAtividade>({});
  const [falhaGeral, setFalhaGeral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [confirmandoDescarte, setConfirmandoDescarte] = useState(false);
  const [confirmando, setConfirmando] = useState<'arquivar' | 'excluir' | null>(null);
  const [executando, setExecutando] = useState(false);

  const envio = useMemo(() => paraEnvio(estado), [estado]);
  const errosValidacao = useMemo(() => validarAtividade(envio, existentes, atividade?.id ?? null), [envio, existentes, atividade?.id]);
  const alterado = JSON.stringify(paraEnvio(inicial)) !== JSON.stringify(envio);
  const podeExcluir = sessoesDaAtividade === 0;

  const erro = (campo: CampoAtividade): string | undefined => {
    if (errosServidor[campo]) return errosServidor[campo];
    if (!tentouEnviar && !tocados.has(campo)) return undefined;
    return errosValidacao[campo];
  };

  const tocar = (campo: CampoAtividade) => setTocados((atuais) => (atuais.has(campo) ? atuais : new Set([...atuais, campo])));

  const mudar = <C extends keyof EstadoFormulario>(chave: C, valor: EstadoFormulario[C], campo: CampoAtividade, marcarTocado: boolean) => {
    setEstado((atual) => ({ ...atual, [chave]: valor }));
    setErrosServidor((atuais) => {
      if (!atuais[campo]) return atuais;
      const proximos = { ...atuais };
      delete proximos[campo];
      return proximos;
    });
    setFalhaGeral(null);
    if (marcarTocado) tocar(campo);
  };

  const focarCampo = (campo: CampoAtividade) => {
    window.requestAnimationFrame(() => document.getElementById(idCampo(campo))?.focus());
  };

  const aoSubmeter = async (evento: FormEvent) => {
    evento.preventDefault();
    if (enviando) return;
    setTentouEnviar(true);
    const primeiro = primeiroCampoComErroAtividade(errosValidacao);
    if (primeiro) {
      focarCampo(primeiro);
      return;
    }
    setEnviando(true);
    setFalhaGeral(null);
    try {
      await aoEnviar(normalizarAtividade(envio));
    } catch (falha) {
      const mapeados: ErrosAtividade = errosDeCampo<CampoAtividade>(falha);
      if (ehErroApi(falha, 'CONFLITO') && Object.keys(mapeados).length === 0) mapeados.nome = descreverFalha(falha);
      if (ehErroApi(falha, 'VALIDACAO', 'CONFLITO') && Object.keys(mapeados).length > 0) {
        setErrosServidor(mapeados);
        const primeiroServidor = primeiroCampoComErroAtividade(mapeados);
        if (primeiroServidor) focarCampo(primeiroServidor);
        return;
      }
      if (ehErroApi(falha, 'NAO_ENCONTRADO')) {
        setFalhaGeral('Esta atividade foi excluída em outra tela. Feche o formulário para ver a lista atualizada.');
        return;
      }
      setFalhaGeral(`Não foi possível salvar a atividade. ${descreverFalha(falha)} O que você preencheu continua aqui.`);
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

  const executarConfirmacao = async () => {
    if (!atividade || !confirmando) return;
    setExecutando(true);
    try {
      if (confirmando === 'arquivar') await aoArquivar(atividade);
      else await aoExcluir(atividade);
    } finally {
      setExecutando(false);
      setConfirmando(null);
    }
  };

  const motivoBloqueio = emUsoNoCronometro ? 'Esta atividade está no cronômetro agora. Finalize ou descarte a sessão para arquivar ou excluir.' : null;

  return (
    <>
      <Modal
        aberto={aberto}
        aoFechar={pedirFechamento}
        titulo={edicao ? 'Editar atividade' : 'Nova atividade'}
        descricao={edicao ? undefined : 'Uma atividade agrupa o seu tempo de estudo, como Leitura, Inglês ou Violão.'}
        tamanho="md"
        focarPrimeiroCampo
        rodape={
          <>
            {edicao ? (
              <Botao
                variante="terciario"
                icone={podeExcluir ? Trash2 : Archive}
                className={estilos.acaoSecundaria}
                disabled={enviando || emUsoNoCronometro || sessoesDaAtividade === null}
                onClick={() => setConfirmando(podeExcluir ? 'excluir' : 'arquivar')}
              >
                {podeExcluir ? 'Excluir' : 'Arquivar'}
              </Botao>
            ) : null}
            <Botao variante="secundario" onClick={pedirFechamento} disabled={enviando}>
              Cancelar
            </Botao>
            <Botao type="submit" form={idFormulario} carregando={enviando}>
              {edicao ? 'Salvar alterações' : 'Criar atividade'}
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

          <CampoTexto
            id={idCampo('nome')}
            rotulo="Nome"
            required
            value={estado.nome}
            maxLength={LIMITE_NOME_ATIVIDADE + 10}
            autoComplete="off"
            placeholder="Ex.: Leitura"
            onChange={(evento) => mudar('nome', evento.target.value, 'nome', false)}
            onBlur={() => estado.nome !== inicial.nome && tocar('nome')}
            erro={erro('nome')}
          />

          <SeletorCor
            id={idCampo('cor')}
            rotulo="Cor"
            valor={estado.cor}
            aoMudar={(cor) => mudar('cor', cor, 'cor', true)}
            erro={erro('cor')}
            dica="Identifica a atividade no cronômetro, no histórico e nos gráficos."
          />

          <CampoNumero
            id={idCampo('metaSemanalMinutos')}
            rotulo="Meta semanal"
            valor={estado.metaHoras}
            aoMudar={(valor) => mudar('metaHoras', valor, 'metaSemanalMinutos', true)}
            minimo={0.5}
            maximo={LIMITE_META_SEMANAL_MINUTOS / 60}
            passo={0.5}
            casasDecimais={1}
            sufixo="horas"
            placeholder="Sem meta"
            erro={erro('metaSemanalMinutos')}
            dica="Opcional. Conta de domingo a sábado e aparece no Dashboard."
          />

          {edicao && motivoBloqueio ? <p className={estilos.observacao}>{motivoBloqueio}</p> : null}
          {edicao && !motivoBloqueio && sessoesDaAtividade !== null && sessoesDaAtividade > 0 ? (
            <p className={estilos.observacao}>
              Como esta atividade já tem sessões registradas, ela pode ser arquivada, mas não excluída. Assim o histórico continua completo.
            </p>
          ) : null}
        </form>
      </Modal>

      <DialogoConfirmacao
        aberto={confirmandoDescarte}
        titulo="Descartar as alterações?"
        descricao={edicao ? 'As mudanças que você fez nesta atividade não serão salvas.' : 'A atividade que você começou a preencher não será criada.'}
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
        aberto={confirmando !== null}
        titulo={confirmando === 'excluir' ? 'Excluir atividade?' : 'Arquivar atividade?'}
        descricao={
          confirmando === 'excluir'
            ? `“${atividade?.nome ?? ''}” será excluída. Tarefas ligadas a ela ficam sem atividade. Esta ação não poderá ser desfeita.`
            : `“${atividade?.nome ?? ''}” sai do cronômetro e das metas, mas as sessões continuam no histórico. Você pode desarquivar quando quiser.`
        }
        textoConfirmar={confirmando === 'excluir' ? 'Excluir' : 'Arquivar'}
        destrutivo={confirmando === 'excluir'}
        carregando={executando}
        aoConfirmar={() => void executarConfirmacao()}
        aoCancelar={() => setConfirmando(null)}
      />
    </>
  );
}
