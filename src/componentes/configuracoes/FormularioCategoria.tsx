import { useId, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { AlertCircle, Trash2 } from 'lucide-react';
import { descreverFalha, ehErroApi, errosDeCampo } from '@/api/tratamentoErros';
import { Botao, CampoTexto, DialogoConfirmacao, Modal, SeletorCor } from '@/componentes/ui';
import type { CategoriaDTO, CategoriaEnvioDTO } from '@/modelos/comum';
import type { Cor } from '@/modelos/enumeracoes';
import { CORES } from '@/modelos/enumeracoes';
import {
  LIMITE_NOME_CATEGORIA,
  normalizarCategoria,
  primeiroCampoComErroCategoria,
  validarCategoria,
} from '@/regras/validacaoCategoria';
import type { CampoCategoria, ErrosCategoria } from '@/regras/validacaoCategoria';
import { pluralizar } from '@/utilitarios/formatacao';
import estilos from './FormularioCategoria.module.css';

export interface FormularioCategoriaProps {
  aberto: boolean;
  categoria: CategoriaDTO | null;
  existentes: CategoriaDTO[];
  aoFechar: () => void;
  aoEnviar: (dados: CategoriaEnvioDTO) => Promise<void>;
  aoExcluir: (categoria: CategoriaDTO) => Promise<void>;
}

function corDisponivel(existentes: CategoriaDTO[]): Cor {
  const usadas = new Set(existentes.map((categoria) => categoria.cor));
  return CORES.find((cor) => !usadas.has(cor) && cor !== 'CINZA') ?? 'AZUL';
}

export function descreverExclusaoCategoria(categoria: CategoriaDTO): string {
  const tarefas = categoria.quantidadeTarefas;
  const efeito =
    tarefas === 0
      ? 'Nenhuma tarefa usa esta categoria.'
      : `${tarefas === 1 ? 'A tarefa que usa esta categoria fica' : `As ${pluralizar(tarefas, 'tarefa', 'tarefas')} que usam esta categoria ficam`} sem categoria, mas continuam na sua agenda.`;
  return `“${categoria.nome}” será excluída. ${efeito} Esta ação não poderá ser desfeita.`;
}

export function FormularioCategoria({ aberto, categoria, existentes, aoFechar, aoEnviar, aoExcluir }: FormularioCategoriaProps) {
  const idBase = useId();
  const idFormulario = `${idBase}-formulario`;
  const idCampo = (campo: CampoCategoria) => `${idBase}-${campo}`;
  const edicao = categoria !== null;

  const [inicial] = useState<CategoriaEnvioDTO>(() => ({
    nome: categoria?.nome ?? '',
    cor: categoria?.cor ?? corDisponivel(existentes),
  }));
  const [estado, setEstado] = useState(inicial);
  const [tocados, setTocados] = useState<ReadonlySet<CampoCategoria>>(new Set());
  const [tentouEnviar, setTentouEnviar] = useState(false);
  const [errosServidor, setErrosServidor] = useState<ErrosCategoria>({});
  const [falhaGeral, setFalhaGeral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [confirmandoDescarte, setConfirmandoDescarte] = useState(false);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  const errosValidacao = useMemo(() => validarCategoria(estado, existentes, categoria?.id ?? null), [estado, existentes, categoria?.id]);
  const alterado = inicial.nome !== estado.nome || inicial.cor !== estado.cor;

  const erro = (campo: CampoCategoria): string | undefined => {
    if (errosServidor[campo]) return errosServidor[campo];
    if (!tentouEnviar && !tocados.has(campo)) return undefined;
    return errosValidacao[campo];
  };

  const tocar = (campo: CampoCategoria) => setTocados((atuais) => (atuais.has(campo) ? atuais : new Set([...atuais, campo])));

  const mudar = <C extends CampoCategoria>(campo: C, valor: CategoriaEnvioDTO[C], marcarTocado: boolean) => {
    setEstado((atual) => ({ ...atual, [campo]: valor }));
    setErrosServidor((atuais) => {
      if (!atuais[campo]) return atuais;
      const proximos = { ...atuais };
      delete proximos[campo];
      return proximos;
    });
    setFalhaGeral(null);
    if (marcarTocado) tocar(campo);
  };

  const focarCampo = (campo: CampoCategoria) => {
    window.requestAnimationFrame(() => document.getElementById(idCampo(campo))?.focus());
  };

  const aoSubmeter = async (evento: FormEvent) => {
    evento.preventDefault();
    if (enviando) return;
    setTentouEnviar(true);
    const primeiro = primeiroCampoComErroCategoria(errosValidacao);
    if (primeiro) {
      focarCampo(primeiro);
      return;
    }
    setEnviando(true);
    setFalhaGeral(null);
    try {
      await aoEnviar(normalizarCategoria(estado));
    } catch (falha) {
      const mapeados: ErrosCategoria = errosDeCampo<CampoCategoria>(falha);
      if (ehErroApi(falha, 'CONFLITO') && Object.keys(mapeados).length === 0) mapeados.nome = descreverFalha(falha);
      if (ehErroApi(falha, 'VALIDACAO', 'CONFLITO') && Object.keys(mapeados).length > 0) {
        setErrosServidor(mapeados);
        const primeiroServidor = primeiroCampoComErroCategoria(mapeados);
        if (primeiroServidor) focarCampo(primeiroServidor);
        return;
      }
      if (ehErroApi(falha, 'NAO_ENCONTRADO')) {
        setFalhaGeral('Esta categoria foi excluída em outra tela. Feche o formulário para ver a lista atualizada.');
        return;
      }
      setFalhaGeral(`Não foi possível salvar a categoria. ${descreverFalha(falha)} O que você preencheu continua aqui.`);
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

  const confirmarExclusao = async () => {
    if (!categoria) return;
    setExcluindo(true);
    try {
      await aoExcluir(categoria);
    } finally {
      setExcluindo(false);
      setConfirmandoExclusao(false);
    }
  };

  return (
    <>
      <Modal
        aberto={aberto}
        aoFechar={pedirFechamento}
        titulo={edicao ? 'Editar categoria' : 'Nova categoria'}
        descricao={edicao ? undefined : 'Uma categoria agrupa tarefas do mesmo assunto, como Casa, Trabalho ou Saúde.'}
        tamanho="md"
        focarPrimeiroCampo
        rodape={
          <>
            {edicao ? (
              <Botao
                variante="terciario"
                icone={Trash2}
                className={estilos.acaoSecundaria}
                disabled={enviando}
                onClick={() => setConfirmandoExclusao(true)}
              >
                Excluir
              </Botao>
            ) : null}
            <Botao variante="secundario" onClick={pedirFechamento} disabled={enviando}>
              Cancelar
            </Botao>
            <Botao type="submit" form={idFormulario} carregando={enviando}>
              {edicao ? 'Salvar alterações' : 'Criar categoria'}
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
            maxLength={LIMITE_NOME_CATEGORIA + 10}
            autoComplete="off"
            placeholder="Ex.: Casa"
            onChange={(evento) => mudar('nome', evento.target.value, false)}
            onBlur={() => estado.nome !== inicial.nome && tocar('nome')}
            erro={erro('nome')}
          />

          <SeletorCor
            id={idCampo('cor')}
            rotulo="Cor"
            valor={estado.cor}
            aoMudar={(cor) => mudar('cor', cor, true)}
            erro={erro('cor')}
            dica="Aparece nas tarefas, no calendário e nos filtros."
          />

          {edicao && categoria.quantidadeTarefas > 0 ? (
            <p className={estilos.observacao}>
              {pluralizar(categoria.quantidadeTarefas, 'tarefa usa', 'tarefas usam')} esta categoria. O novo nome e a nova cor aparecem
              nelas na hora.
            </p>
          ) : null}
        </form>
      </Modal>

      <DialogoConfirmacao
        aberto={confirmandoDescarte}
        titulo="Descartar as alterações?"
        descricao={edicao ? 'As mudanças que você fez nesta categoria não serão salvas.' : 'A categoria que você começou a preencher não será criada.'}
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
        titulo="Excluir categoria?"
        descricao={categoria ? descreverExclusaoCategoria(categoria) : ''}
        textoConfirmar="Excluir categoria"
        destrutivo
        carregando={excluindo}
        aoConfirmar={() => void confirmarExclusao()}
        aoCancelar={() => setConfirmandoExclusao(false)}
      />
    </>
  );
}
