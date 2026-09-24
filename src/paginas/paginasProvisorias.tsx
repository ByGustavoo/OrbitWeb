import { Settings } from 'lucide-react';
import { PaginaProvisoria } from './PaginaProvisoria';

export function PaginaConfiguracoes() {
  return (
    <PaginaProvisoria
      titulo="Configurações"
      descricao="Ajuste o tema, o Pomodoro e as suas categorias."
      icone={Settings}
      proximaEtapa="Aqui vão ficar as preferências de aparência, as durações do Pomodoro e as categorias."
    />
  );
}
