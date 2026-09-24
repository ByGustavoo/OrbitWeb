import { useNavigate } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { Botao, EstadoVazio, Painel } from '@/componentes/ui';
import { useTituloDocumento } from '@/ganchos/useTituloDocumento';
import { caminhos } from '@/rotas/caminhos';

export default function PaginaNaoEncontrada() {
  const navegar = useNavigate();
  useTituloDocumento('Página não encontrada');

  return (
    <Painel espacamento="nenhum">
      <h1 className="visualmente-oculto">Página não encontrada</h1>
      <EstadoVazio
        icone={Compass}
        titulo="Página não encontrada"
        descricao="O endereço pode ter mudado ou estar digitado errado. Volte para o Dashboard para continuar."
        acao={<Botao onClick={() => navegar(caminhos.dashboard)}>Ir para o Dashboard</Botao>}
      />
    </Painel>
  );
}
