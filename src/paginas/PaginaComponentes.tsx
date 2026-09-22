import { useState } from 'react';
import type { ReactNode } from 'react';
import { CalendarCheck, Inbox, Pencil, Plus, RotateCcw, Search, Trash2 } from 'lucide-react';
import { CHAVE_BOAS_VINDAS_VISTA } from '@/configuracoes/aplicacao';
import { CabecalhoPagina } from '@/componentes/layout/CabecalhoPagina';
import { SeloCategoria, SeloPrazo, SeloPrioridade, SeloSituacao } from '@/componentes/tarefas/SelosTarefa';
import {
  AreaTexto,
  Botao,
  BotaoIcone,
  CabecalhoPainel,
  CaixaSelecao,
  CampoBusca,
  CampoNumero,
  CampoSelecao,
  CampoTexto,
  DialogoConfirmacao,
  EsqueletoCartao,
  EsqueletoLista,
  EstadoErro,
  EstadoVazio,
  GrupoOpcoes,
  GrupoRadio,
  IndicadorGiratorio,
  Interruptor,
  Modal,
  Painel,
  SeletorData,
  SeletorHorario,
} from '@/componentes/ui';
import { useTituloDocumento } from '@/ganchos/useTituloDocumento';
import { CORES, PRIORIDADES, SITUACOES } from '@/modelos/enumeracoes';
import type { Prioridade } from '@/modelos/enumeracoes';
import { rotuloCor, rotuloPrioridade } from '@/modelos/rotulos';
import { useNotificacoes } from '@/provedores/ProvedorNotificacoes';
import { coresDaPrioridade } from '@/modelos/cores';
import type { OpcaoSelecao } from '@/componentes/ui';
import { iconePrioridade } from '@/componentes/tarefas/iconesTarefa';
import estilos from './PaginaComponentes.module.css';

const CORES_BASE = [
  ['fundo', 'Fundo'],
  ['superficie', 'Superfície'],
  ['superficie-suave', 'Superfície suave'],
  ['borda', 'Borda'],
  ['texto', 'Texto'],
  ['texto-secundario', 'Texto secundário'],
  ['texto-terciario', 'Texto terciário'],
  ['destaque', 'Destaque'],
  ['sucesso', 'Sucesso'],
  ['aviso', 'Aviso'],
  ['erro', 'Erro'],
  ['info', 'Informação'],
] as const;

const ESCALA_TIPOGRAFICA = [
  ['2xl', 'Título de página', 'Planeje sua semana'],
  ['xl', 'Título de seção', 'Tarefas de hoje'],
  ['lg', 'Título de modal', 'Nova tarefa'],
  ['md', 'Título de cartão', 'Sequência de dias'],
  ['base', 'Corpo', 'Revisar os relacionamentos do capítulo 4 antes da aula.'],
  ['sm', 'Rótulos e botões', 'Concluir tarefa'],
  ['xs', 'Legendas', 'Atualizado há 5 minutos'],
] as const;

const opcoesPrioridade: OpcaoSelecao<Prioridade>[] = PRIORIDADES.map((valor) => ({
  valor,
  rotulo: rotuloPrioridade[valor],
  icone: iconePrioridade[valor],
  cor: coresDaPrioridade(valor).texto,
}));

const opcoesCategoria: OpcaoSelecao[] = [
  { valor: '1', rotulo: 'Faculdade', descricao: 'Aulas, provas e trabalhos' },
  { valor: '2', rotulo: 'Trabalho' },
  { valor: '3', rotulo: 'Pessoal' },
  { valor: '4', rotulo: 'Arquivada', desabilitada: true },
];

function Secao({ id, titulo, descricao, children }: { id: string; titulo: string; descricao: string; children: ReactNode }) {
  return (
    <section className={estilos.secao} aria-labelledby={id}>
      <div className={estilos.cabecalhoSecao}>
        <h2 id={id}>{titulo}</h2>
        <p>{descricao}</p>
      </div>
      {children}
    </section>
  );
}

export default function PaginaComponentes() {
  useTituloDocumento('Componentes');
  const notificacoes = useNotificacoes();
  const [modalAberto, setModalAberto] = useState(false);
  const [confirmacaoAberta, setConfirmacaoAberta] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [busca, setBusca] = useState('');
  const [periodo, setPeriodo] = useState<'7' | '30'>('7');
  const [prioridade, setPrioridade] = useState<Prioridade | null>('MEDIA');
  const [data, setData] = useState<string | null>('2026-09-22');
  const [horario, setHorario] = useState<string | null>('19:00');
  const [dataModal, setDataModal] = useState<string | null>(null);
  const [prioridadeModal, setPrioridadeModal] = useState<Prioridade | null>('MEDIA');
  const [categoria, setCategoria] = useState<string | null>(null);
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [metaSemanal, setMetaSemanal] = useState<number | null>(5);
  const [diaInteiro, setDiaInteiro] = useState(false);
  const [recorrente, setRecorrente] = useState(true);
  const [tentando, setTentando] = useState(false);

  const confirmarExclusao = () => {
    setExcluindo(true);
    window.setTimeout(() => {
      setExcluindo(false);
      setConfirmacaoAberta(false);
      notificacoes.notificar({
        titulo: 'Tarefa excluída.',
        variante: 'sucesso',
        acao: { rotulo: 'Desfazer', aoExecutar: () => notificacoes.informacao('Exclusão desfeita.') },
      });
    }, 900);
  };

  const tentarNovamente = () => {
    setTentando(true);
    window.setTimeout(() => setTentando(false), 1200);
  };

  return (
    <>
      <CabecalhoPagina
        titulo="Componentes"
        descricao="Catálogo do design system do Orbit, disponível só no ambiente de desenvolvimento."
      />

      <div className={estilos.secoes}>
        <Secao id="cores" titulo="Cores" descricao="Tokens semânticos. Troque o tema no cabeçalho para comparar.">
          <div className={estilos.grade}>
            {CORES_BASE.map(([token, nome]) => (
              <div key={token} className={estilos.amostra}>
                <span className={estilos.cor} style={{ background: `var(--${token})` }} />
                <span className={estilos.nomeCor}>{nome}</span>
                <code className={estilos.token}>--{token}</code>
              </div>
            ))}
          </div>
          <div className={estilos.linhaSelos}>
            {CORES.map((cor) => (
              <SeloCategoria key={cor} nome={rotuloCor[cor]} cor={cor} />
            ))}
          </div>
        </Secao>

        <Secao id="tipografia" titulo="Tipografia" descricao="Geist para a interface e Geist Mono para números e tempo.">
          <Painel>
            <div className={estilos.tipografia}>
              {ESCALA_TIPOGRAFICA.map(([tamanho, uso, exemplo]) => (
                <div key={tamanho} className={estilos.linhaTipografia}>
                  <span className={estilos.usoTipografia}>{uso}</span>
                  <span style={{ fontSize: `var(--tamanho-${tamanho})`, fontWeight: tamanho === 'base' || tamanho === 'xs' ? 'var(--peso-regular)' : 'var(--peso-forte)' }}>
                    {exemplo}
                  </span>
                </div>
              ))}
              <div className={estilos.linhaTipografia}>
                <span className={estilos.usoTipografia}>Cronômetro</span>
                <span className={`numeros ${estilos.cronometro}`}>01:24:36</span>
              </div>
            </div>
          </Painel>
        </Secao>

        <Secao id="botoes" titulo="Botões" descricao="Quatro variantes, dois tamanhos e os estados de carregamento e desabilitado.">
          <Painel>
            <div className={estilos.linha}>
              <Botao icone={Plus}>Nova tarefa</Botao>
              <Botao variante="secundario">Cancelar</Botao>
              <Botao variante="terciario">Ver todas</Botao>
              <Botao variante="perigo" icone={Trash2}>
                Excluir
              </Botao>
            </div>
            <div className={estilos.linha}>
              <Botao carregando>Salvando</Botao>
              <Botao variante="secundario" disabled>
                Desabilitado
              </Botao>
              <Botao tamanho="sm" icone={CalendarCheck}>
                Mover para hoje
              </Botao>
              <Botao tamanho="sm" variante="secundario">
                Pequeno
              </Botao>
            </div>
            <div className={estilos.linha}>
              <BotaoIcone icone={Pencil} rotulo="Editar tarefa" />
              <BotaoIcone icone={Trash2} rotulo="Excluir tarefa" variante="secundario" />
              <BotaoIcone icone={Search} rotulo="Buscar" tamanho="sm" />
              <BotaoIcone icone={Pencil} rotulo="Editar (carregando)" carregando />
              <BotaoIcone icone={Pencil} rotulo="Editar (desabilitado)" disabled />
            </div>
          </Painel>
        </Secao>

        <Secao id="campos" titulo="Campos" descricao="Texto, número, data, horário, busca, área de texto e seleção.">
          <Painel>
            <div className={estilos.formulario}>
              <CampoTexto rotulo="Título" placeholder="Ex.: Estudar Banco de Dados" required />
              <CampoNumero
                rotulo="Meta semanal"
                valor={metaSemanal}
                aoMudar={setMetaSemanal}
                minimo={0}
                maximo={80}
                passo={0.5}
                casasDecimais={1}
                sufixo="horas"
                placeholder="Sem meta"
                dica="Deixe em branco para não ter meta."
              />
              <SeletorData rotulo="Data" valor={data} aoMudar={setData} />
              <SeletorHorario rotulo="Horário de início" valor={horario} aoMudar={setHorario} />
              <CampoBusca rotulo="Buscar tarefas" placeholder="Título ou descrição" valor={busca} aoMudar={setBusca} />
              <CampoSelecao rotulo="Prioridade" valor={prioridade} aoMudar={setPrioridade} opcoes={opcoesPrioridade} />
              <CampoTexto rotulo="Com erro" defaultValue="" erro="Informe o título da tarefa." required />
              <CampoTexto rotulo="Com sucesso" defaultValue="Faculdade" sucesso="Nome disponível." />
              <CampoTexto rotulo="Desabilitado" defaultValue="Não editável" disabled />
              <CampoTexto rotulo="Somente leitura" defaultValue="Criada em 21/09/2026" readOnly />
              <CampoSelecao
                rotulo="Categoria"
                textoVazio="Sem categoria"
                permitirVazio
                valor={categoria}
                aoMudar={setCategoria}
                erro={categoria ? undefined : 'Escolha uma categoria.'}
                opcoes={opcoesCategoria}
              />
              <SeletorData rotulo="Data desabilitada" valor={null} aoMudar={() => undefined} desabilitado />
              <AreaTexto rotulo="Descrição" placeholder="Detalhes, links ou anotações" className={estilos.campoLargo} />
            </div>
          </Painel>
        </Secao>

        <Secao id="selecao" titulo="Seleção" descricao="Caixa de seleção, opções exclusivas, interruptor e grupo segmentado.">
          <Painel>
            <div className={estilos.colunas}>
              <div className={estilos.pilha}>
                <CaixaSelecao rotulo="Mostrar tarefas concluídas" defaultChecked />
                <CaixaSelecao rotulo="Incluir canceladas" descricao="Elas continuam fora das contagens." />
                <CaixaSelecao rotulo="Desabilitada" disabled />
                <CaixaSelecao
                  rotulo="Aceito os termos"
                  checked={aceitouTermos}
                  onChange={(evento) => setAceitouTermos(evento.target.checked)}
                  invalida={!aceitouTermos}
                />
              </div>
              <GrupoRadio
                legenda="Ao editar uma tarefa recorrente"
                valor="SOMENTE_ESTA"
                aoMudar={() => undefined}
                opcoes={[
                  { valor: 'SOMENTE_ESTA', rotulo: 'Só esta', descricao: 'As outras ocorrências não mudam.' },
                  { valor: 'ESTA_E_PROXIMAS', rotulo: 'Esta e as próximas' },
                  { valor: 'TODAS', rotulo: 'Todas', desabilitada: true },
                ]}
              />
              <div className={estilos.pilha}>
                <Interruptor rotulo="Dia inteiro" ligado={diaInteiro} aoMudar={setDiaInteiro} />
                <Interruptor
                  rotulo="Tarefa recorrente"
                  descricao="Repete conforme a frequência escolhida."
                  ligado={recorrente}
                  aoMudar={setRecorrente}
                />
                <Interruptor rotulo="Desabilitado" ligado={false} aoMudar={() => undefined} desabilitado />
                <GrupoOpcoes
                  rotulo="Período"
                  valor={periodo}
                  aoMudar={setPeriodo}
                  opcoes={[
                    { valor: '7', rotulo: '7 dias' },
                    { valor: '30', rotulo: '30 dias' },
                  ]}
                />
              </div>
            </div>
          </Painel>
        </Secao>

        <Secao id="selos" titulo="Selos" descricao="Prioridade, situação, prazo e categoria. Sempre com texto, nunca só cor.">
          <Painel>
            <div className={estilos.linhaSelos}>
              {PRIORIDADES.map((valor) => (
                <SeloPrioridade key={valor} prioridade={valor} />
              ))}
            </div>
            <div className={estilos.linhaSelos}>
              {SITUACOES.map((valor) => (
                <SeloSituacao key={valor} situacao={valor} />
              ))}
            </div>
            <div className={estilos.linhaSelos}>
              <SeloPrazo prazo="ATRASADA" />
              <SeloPrazo prazo="CONCLUIDA_COM_ATRASO" />
              <SeloPrazo prazo="NAO_REALIZADA" />
            </div>
          </Painel>
        </Secao>

        <Secao id="cartoes" titulo="Cartões" descricao="Painel padrão, suave, de destaque e interativo.">
          <div className={estilos.gradeCartoes}>
            <Painel>
              <CabecalhoPainel titulo="Tarefas de hoje" descricao="5 tarefas, 2 concluídas" acao={<Botao variante="terciario" tamanho="sm">Ver todas</Botao>} />
              <p className={estilos.textoCartao}>Conteúdo do painel padrão.</p>
            </Painel>
            <Painel tom="suave">
              <CabecalhoPainel titulo="Painel suave" descricao="Para agrupar sem competir" />
              <p className={estilos.textoCartao}>Útil dentro de outro painel.</p>
            </Painel>
            <Painel tom="destaque">
              <CabecalhoPainel titulo="Sequência de 6 dias" descricao="Seu recorde é 14" />
              <p className={estilos.textoCartao}>Para o que merece atenção.</p>
            </Painel>
            <Painel interativo como="article" tabIndex={0}>
              <CabecalhoPainel titulo="Painel interativo" descricao="Passe o mouse ou foque" />
              <p className={estilos.textoCartao}>Para cartões que levam a outro lugar.</p>
            </Painel>
          </div>
        </Secao>

        <Secao id="sobreposicoes" titulo="Modal e notificações" descricao="Criação, confirmação e os quatro tipos de aviso.">
          <Painel>
            <div className={estilos.linha}>
              <Botao icone={Plus} onClick={() => setModalAberto(true)}>
                Abrir modal
              </Botao>
              <Botao variante="secundario" icone={Trash2} onClick={() => setConfirmacaoAberta(true)}>
                Confirmar exclusão
              </Botao>
            </div>
            <div className={estilos.linha}>
              <Botao variante="secundario" tamanho="sm" onClick={() => notificacoes.sucesso('Tarefa criada.')}>
                Sucesso
              </Botao>
              <Botao
                variante="secundario"
                tamanho="sm"
                onClick={() => notificacoes.aviso('3 tarefas atrasadas.', 'Você pode movê-las para hoje no Dashboard.')}
              >
                Aviso
              </Botao>
              <Botao
                variante="secundario"
                tamanho="sm"
                onClick={() =>
                  notificacoes.erro('Não foi possível salvar a tarefa.', 'Verifique sua conexão e tente novamente.')
                }
              >
                Erro
              </Botao>
              <Botao
                variante="secundario"
                tamanho="sm"
                onClick={() => notificacoes.informacao('Estudar inglês começa em 15 minutos.')}
              >
                Informação
              </Botao>
            </div>
          </Painel>
        </Secao>

        <Secao id="boas-vindas" titulo="Boas-vindas" descricao="Tela exibida sempre que o Orbit é aberto numa nova aba ou janela, com a frase de efeito.">
          <Painel>
            <div className={estilos.linha}>
              <Botao
                variante="secundario"
                icone={RotateCcw}
                onClick={() => {
                  window.sessionStorage.removeItem(CHAVE_BOAS_VINDAS_VISTA);
                  window.location.assign('/');
                }}
              >
                Ver a tela de boas-vindas de novo
              </Botao>
            </div>
          </Painel>
        </Secao>

        <Secao id="estados" titulo="Estados" descricao="Carregamento, vazio e erro.">
          <div className={estilos.gradeCartoes}>
            <Painel>
              <CabecalhoPainel titulo="Lista carregando" />
              <EsqueletoLista linhas={3} />
            </Painel>
            <Painel>
              <CabecalhoPainel titulo="Cartão carregando" />
              <EsqueletoCartao />
              <div className={estilos.giratorio}>
                <IndicadorGiratorio tamanho={20} rotulo="Carregando" />
                <span>Indicador para ações curtas</span>
              </div>
            </Painel>
            <Painel espacamento="nenhum">
              <EstadoVazio
                compacto
                icone={Inbox}
                titulo="Você não tem tarefas para hoje."
                descricao="Aproveite o dia livre ou planeje o que vem pela frente."
                acao={<Botao tamanho="sm" icone={Plus}>Nova tarefa</Botao>}
              />
            </Painel>
            <Painel espacamento="nenhum">
              <EstadoErro
                compacto
                titulo="Não foi possível carregar suas tarefas."
                aoTentarNovamente={tentarNovamente}
                tentando={tentando}
              />
            </Painel>
          </div>
        </Secao>
      </div>

      <Modal
        aberto={modalAberto}
        aoFechar={() => setModalAberto(false)}
        titulo="Nova tarefa"
        descricao="Preencha o título. O resto é opcional."
        focarPrimeiroCampo
        rodape={
          <>
            <Botao variante="secundario" onClick={() => setModalAberto(false)}>
              Cancelar
            </Botao>
            <Botao
              onClick={() => {
                setModalAberto(false);
                notificacoes.sucesso('Tarefa criada.');
              }}
            >
              Criar tarefa
            </Botao>
          </>
        }
      >
        <div className={estilos.formularioModal}>
          <CampoTexto rotulo="Título" placeholder="Ex.: Estudar Banco de Dados" required />
          <div className={estilos.duasColunas}>
            <SeletorData rotulo="Data" valor={dataModal} aoMudar={setDataModal} />
            <CampoSelecao rotulo="Prioridade" valor={prioridadeModal} aoMudar={setPrioridadeModal} opcoes={opcoesPrioridade} />
          </div>
          <AreaTexto rotulo="Descrição" />
        </div>
      </Modal>

      <DialogoConfirmacao
        aberto={confirmacaoAberta}
        titulo="Excluir esta tarefa?"
        descricao="Ela some de todas as listas e do histórico. Se quiser só tirá-la das pendentes, cancele em vez de excluir."
        textoConfirmar="Excluir tarefa"
        destrutivo
        carregando={excluindo}
        aoConfirmar={confirmarExclusao}
        aoCancelar={() => setConfirmacaoAberta(false)}
      />
    </>
  );
}
