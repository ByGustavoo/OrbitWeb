import { useCallback, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { TelaBoasVindas } from '@/componentes/boasVindas/TelaBoasVindas';
import { CHAVE_BOAS_VINDAS_VISTA } from '@/configuracoes/aplicacao';
import { ProvedoresAplicacao } from '@/provedores/ProvedoresAplicacao';
import { RotasAplicacao } from '@/rotas/RotasAplicacao';

function boasVindasJaVistasNestaSessao(): boolean {
  try {
    return window.sessionStorage.getItem(CHAVE_BOAS_VINDAS_VISTA) === 'true';
  } catch {
    return false;
  }
}

export default function Aplicacao() {
  const [boasVindasVista, setVista] = useState(boasVindasJaVistasNestaSessao);

  const setBoasVindasVista = useCallback((vista: boolean) => {
    setVista(vista);
    try {
      window.sessionStorage.setItem(CHAVE_BOAS_VINDAS_VISTA, String(vista));
    } catch {
      return;
    }
  }, []);

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ProvedoresAplicacao>
        {boasVindasVista ? <RotasAplicacao /> : <TelaBoasVindas aoComecar={() => setBoasVindasVista(true)} />}
      </ProvedoresAplicacao>
    </BrowserRouter>
  );
}
