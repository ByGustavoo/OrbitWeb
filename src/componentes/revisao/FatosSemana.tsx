import type { LucideIcon } from 'lucide-react';
import { CabecalhoPainel, Painel } from '@/componentes/ui';
import type { FatoSemana } from '@/regras/revisaoSemanal';
import { juntarClasses } from '@/utilitarios/juntarClasses';
import estilos from './FatosSemana.module.css';

export interface FatosSemanaProps {
  id: string;
  titulo: string;
  descricao: string;
  icone: LucideIcon;
  tom: 'sucesso' | 'neutro';
  fatos: FatoSemana[];
  textoVazio: string;
  className?: string;
}

export function FatosSemana({ id, titulo, descricao, icone: Icone, tom, fatos, textoVazio, className }: FatosSemanaProps) {
  return (
    <Painel className={className} aria-labelledby={id}>
      <CabecalhoPainel titulo={<span id={id}>{titulo}</span>} descricao={descricao} />
      {fatos.length === 0 ? (
        <p className={estilos.vazio}>{textoVazio}</p>
      ) : (
        <ul className={estilos.lista}>
          {fatos.map((fato) => (
            <li key={fato.chave} className={estilos.item}>
              <span className={juntarClasses(estilos.icone, estilos[tom])} aria-hidden="true">
                <Icone size={14} strokeWidth={2.25} />
              </span>
              <span className={estilos.texto}>{fato.texto}</span>
            </li>
          ))}
        </ul>
      )}
    </Painel>
  );
}
