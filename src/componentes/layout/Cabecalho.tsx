import { forwardRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Plus } from 'lucide-react';
import { MarcaOrbit } from '@/componentes/comum/MarcaOrbit';
import { Botao, BotaoIcone } from '@/componentes/ui';
import { NOME_APLICACAO } from '@/configuracoes/aplicacao';
import { useAcoesTarefa } from '@/provedores/ProvedorAcoesTarefa';
import { caminhos } from '@/rotas/caminhos';
import { dataIsoLocal, formatarDiaMes, formatarDiaSemana } from '@/utilitarios/datas';
import { BotaoTema } from './BotaoTema';
import { MiniCronometro } from './MiniCronometro';
import estilos from './Cabecalho.module.css';

interface CabecalhoProps {
  emGaveta: boolean;
  gavetaAberta: boolean;
  aoAbrirMenu: () => void;
}

function useHoje(): Date {
  const [hoje, setHoje] = useState(() => new Date());

  useEffect(() => {
    const agora = new Date();
    const proximaMeiaNoite = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + 1);
    const temporizador = window.setTimeout(() => setHoje(new Date()), proximaMeiaNoite.getTime() - agora.getTime());
    return () => window.clearTimeout(temporizador);
  }, [hoje]);

  return hoje;
}

export const Cabecalho = forwardRef<HTMLButtonElement, CabecalhoProps>(function Cabecalho(
  { emGaveta, gavetaAberta, aoAbrirMenu },
  botaoMenuRef,
) {
  const hoje = useHoje();
  const { abrirNovaTarefa } = useAcoesTarefa();

  return (
    <header className={estilos.cabecalho}>
      <div className={estilos.interno}>
        {emGaveta ? (
          <div className={estilos.inicio}>
            <BotaoIcone
              ref={botaoMenuRef}
              icone={Menu}
              rotulo="Abrir menu"
              mostrarDica={false}
              onClick={aoAbrirMenu}
              aria-expanded={gavetaAberta}
              aria-controls="menu-lateral"
            />
            <Link to={caminhos.dashboard} className={`${estilos.marca} marca-em-transicao`} aria-label={`${NOME_APLICACAO}, ir para o Dashboard`}>
              <MarcaOrbit tamanho={26} />
            </Link>
          </div>
        ) : null}

        <p className={estilos.data}>
          <span className="visualmente-oculto">Hoje é </span>
          <time dateTime={dataIsoLocal(hoje)}>
            <span className={estilos.diaSemana}>{formatarDiaSemana(hoje)}</span>
            <span className={estilos.separador} aria-hidden="true">
              ·
            </span>
            <span className={estilos.diaMes}>{formatarDiaMes(hoje)}</span>
          </time>
        </p>

        <div className={estilos.acoes}>
          <MiniCronometro />
          <Botao tamanho="sm" icone={Plus} className={estilos.novaTarefa} onClick={() => abrirNovaTarefa()}>
            Nova tarefa
          </Botao>
          <BotaoIcone
            icone={Plus}
            rotulo="Nova tarefa"
            variante="secundario"
            className={estilos.novaTarefaCompacta}
            onClick={() => abrirNovaTarefa()}
          />
          <BotaoTema />
        </div>
      </div>
    </header>
  );
});
