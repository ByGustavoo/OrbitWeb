import { CloudOff, RotateCw } from 'lucide-react';
import { juntarClasses } from '@/utilitarios/juntarClasses';
import { Botao } from './Botao';
import estilos from './EstadoMensagem.module.css';

export interface EstadoErroProps {
  titulo: string;
  descricao?: string;
  aoTentarNovamente?: () => void;
  tentando?: boolean;
  compacto?: boolean;
  className?: string;
}

export function EstadoErro({
  titulo,
  descricao = 'Verifique sua conexão e tente novamente. Se o problema continuar, tente mais tarde.',
  aoTentarNovamente,
  tentando = false,
  compacto = false,
  className,
}: EstadoErroProps) {
  return (
    <div className={juntarClasses(estilos.estado, estilos.erro, compacto && estilos.compacto, className)} role="alert">
      <span className={estilos.icone} aria-hidden="true">
        <CloudOff size={compacto ? 18 : 22} strokeWidth={1.75} />
      </span>
      <div className={estilos.textos}>
        <p className={estilos.titulo}>{titulo}</p>
        <p className={estilos.descricao}>{descricao}</p>
      </div>
      {aoTentarNovamente ? (
        <div className={estilos.acoes}>
          <Botao variante="secundario" tamanho="sm" icone={RotateCw} onClick={aoTentarNovamente} carregando={tentando}>
            Tentar novamente
          </Botao>
        </div>
      ) : null}
    </div>
  );
}
