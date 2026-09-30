import type { ReactNode } from 'react';
import { RotateCw } from 'lucide-react';
import { Botao, CabecalhoPainel, Esqueleto, Painel } from '@/componentes/ui';
import { ambiente } from '@/configuracoes/ambiente';
import { useDadosAssincronos } from '@/ganchos/useDadosAssincronos';
import { servicoSistema } from '@/servicos';
import { formatarInstanteOpcional, formatarVersao } from '@/utilitarios/formatacao';
import { juntarClasses } from '@/utilitarios/juntarClasses';
import type { SecaoConfiguracaoProps } from './SecaoAparencia';
import estilos from './SecaoConfiguracao.module.css';
import estilosVersoes from './SecaoVersoes.module.css';

function DescricaoVersao({ versao, detalhe }: { versao: string; detalhe: string | null }) {
  const rotulo = formatarVersao(versao);
  return (
    <>
      <span className={juntarClasses(estilosVersoes.numero, rotulo !== versao && 'numeros')}>{rotulo}</span>
      {detalhe ? <span className={estilosVersoes.detalhe}>{detalhe}</span> : null}
    </>
  );
}

function descreverLancamento(instante: string | null): string | null {
  const data = formatarInstanteOpcional(instante);
  return data ? `Lançada em ${data}` : null;
}

function LinhaVersao({ nome, children, aoVivo = false }: { nome: string; children: ReactNode; aoVivo?: boolean }) {
  return (
    <div className={estilosVersoes.linha}>
      <dt>{nome}</dt>
      <dd className={estilosVersoes.valor} aria-live={aoVivo ? 'polite' : undefined}>
        {children}
      </dd>
    </div>
  );
}

export function SecaoVersoes({ id, idTitulo }: SecaoConfiguracaoProps) {
  const versaoApi = useDadosAssincronos((signal) => servicoSistema.buscarVersao(signal), []);
  const apiSimulada = ambiente.fonteDados === 'simulada';

  return (
    <Painel id={id} aria-labelledby={idTitulo} className={estilos.secao}>
      <CabecalhoPainel
        titulo={
          <span id={idTitulo} tabIndex={-1} className={estilos.ancora}>
            Versões
          </span>
        }
        descricao="Qual versão do Orbit está rodando agora. Informe estes números ao relatar um problema."
      />

      <dl className={estilosVersoes.lista}>
        <LinhaVersao nome="API" aoVivo>
          {versaoApi.dados ? (
            <DescricaoVersao
              versao={versaoApi.dados.versao}
              detalhe={apiSimulada ? 'Dados guardados neste navegador' : descreverLancamento(versaoApi.dados.dataLancamento)}
            />
          ) : versaoApi.carregando ? (
            <>
              <Esqueleto largura={180} altura={14} />
              <span className="visualmente-oculto">Consultando a versão da API</span>
            </>
          ) : (
            <>
              <span className={estilosVersoes.detalhe}>Não foi possível consultar</span>
              <Botao
                variante="terciario"
                tamanho="sm"
                icone={RotateCw}
                className={estilosVersoes.tentarDeNovo}
                onClick={() => {
                  document.getElementById(idTitulo)?.focus({ preventScroll: true });
                  versaoApi.recarregar();
                }}
              >
                Tentar de novo
              </Botao>
            </>
          )}
        </LinhaVersao>
        <LinhaVersao nome="Web">
          {ambiente.versao ? (
            <DescricaoVersao versao={ambiente.versao} detalhe={descreverLancamento(ambiente.dataLancamento)} />
          ) : (
            <span className={estilosVersoes.detalhe}>Versão de desenvolvimento</span>
          )}
        </LinhaVersao>
      </dl>
    </Painel>
  );
}
