import { useEffect, useState } from 'react';
import { Botao, GrupoRadio, Modal } from '@/componentes/ui';
import type { EscopoAlteracao } from '@/modelos/enumeracoes';
import { rotuloEscopo } from '@/modelos/rotulos';

export interface EscolhaEscopoAlteracaoProps {
  aberto: boolean;
  titulo: string;
  descricao: string;
  textoConfirmar: string;
  descricaoSomenteEsta: string;
  descricaoEstaEProximas: string;
  motivoSemSomenteEsta?: string;
  destrutivo?: boolean;
  carregando?: boolean;
  aoConfirmar: (escopo: EscopoAlteracao) => void;
  aoCancelar: () => void;
}

export function EscolhaEscopoAlteracao({
  aberto,
  titulo,
  descricao,
  textoConfirmar,
  descricaoSomenteEsta,
  descricaoEstaEProximas,
  motivoSemSomenteEsta,
  destrutivo = false,
  carregando = false,
  aoConfirmar,
  aoCancelar,
}: EscolhaEscopoAlteracaoProps) {
  const padrao: EscopoAlteracao = motivoSemSomenteEsta ? 'ESTA_E_PROXIMAS' : 'SOMENTE_ESTA';
  const [escopo, setEscopo] = useState<EscopoAlteracao>(padrao);

  useEffect(() => {
    if (aberto) setEscopo(padrao);
  }, [aberto, padrao]);

  return (
    <Modal
      aberto={aberto}
      aoFechar={carregando ? () => undefined : aoCancelar}
      titulo={titulo}
      descricao={descricao}
      tamanho="sm"
      papel="alertdialog"
      rodape={
        <>
          <Botao variante="secundario" onClick={aoCancelar} disabled={carregando}>
            Cancelar
          </Botao>
          <Botao variante={destrutivo ? 'perigo' : 'primario'} onClick={() => aoConfirmar(escopo)} carregando={carregando}>
            {textoConfirmar}
          </Botao>
        </>
      }
    >
      <GrupoRadio
        legenda="Ocorrências"
        opcoes={[
          {
            valor: 'SOMENTE_ESTA',
            rotulo: rotuloEscopo.SOMENTE_ESTA,
            descricao: motivoSemSomenteEsta ?? descricaoSomenteEsta,
            desabilitada: Boolean(motivoSemSomenteEsta),
          },
          { valor: 'ESTA_E_PROXIMAS', rotulo: rotuloEscopo.ESTA_E_PROXIMAS, descricao: descricaoEstaEProximas },
        ]}
        valor={escopo}
        aoMudar={setEscopo}
      />
    </Modal>
  );
}
