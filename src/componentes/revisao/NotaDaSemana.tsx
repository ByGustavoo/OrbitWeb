import { useState } from 'react';
import type { FormEvent } from 'react';
import { Check } from 'lucide-react';
import { descreverFalha, errosDeCampo } from '@/api/tratamentoErros';
import { AreaTexto, Botao, CabecalhoPainel, Painel } from '@/componentes/ui';
import type { NotaSemanaDTO } from '@/modelos/revisao';
import { LIMITE_NOTA_SEMANA } from '@/modelos/revisao';
import { formatarHorario, formatarInstante } from '@/utilitarios/formatacao';
import estilos from './NotaDaSemana.module.css';

export interface NotaDaSemanaProps {
  nota: NotaSemanaDTO | null;
  aoSalvar: (texto: string) => Promise<NotaSemanaDTO | null>;
  className?: string;
}

function descreverSalvamento(nota: NotaSemanaDTO): string {
  const salva = new Date(nota.atualizadoEm);
  const hoje = new Date();
  const mesmoDia = salva.toDateString() === hoje.toDateString();
  return mesmoDia ? `Salva hoje às ${formatarHorario(nota.atualizadoEm)}` : `Salva em ${formatarInstante(nota.atualizadoEm)}`;
}

export function NotaDaSemana({ nota, aoSalvar, className }: NotaDaSemanaProps) {
  const [salva, setSalva] = useState<NotaSemanaDTO | null>(nota);
  const [texto, setTexto] = useState(nota?.texto ?? '');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const alterada = texto.trim() !== (salva?.texto ?? '');
  const excedeu = texto.trim().length > LIMITE_NOTA_SEMANA;

  const enviar = async (evento: FormEvent) => {
    evento.preventDefault();
    if (!alterada || excedeu) return;
    setSalvando(true);
    setErro(null);
    try {
      const resultado = await aoSalvar(texto);
      setSalva(resultado);
      setTexto(resultado?.texto ?? '');
    } catch (falha) {
      setErro(errosDeCampo<'texto'>(falha).texto ?? `Não foi possível salvar a nota. ${descreverFalha(falha)}`);
    } finally {
      setSalvando(false);
    }
  };

  const situacao = alterada ? 'Alterações não salvas' : salva ? descreverSalvamento(salva) : null;

  return (
    <Painel className={className} aria-labelledby="titulo-nota-semana">
      <CabecalhoPainel
        titulo={<span id="titulo-nota-semana">Nota da semana</span>}
        descricao="Um espaço só seu para registrar o que quiser sobre esta semana."
      />
      <form className={estilos.formulario} onSubmit={(evento) => void enviar(evento)} noValidate>
        <AreaTexto
          rotulo="Sua nota"
          rows={5}
          value={texto}
          onChange={(evento) => {
            setTexto(evento.target.value);
            if (erro) setErro(null);
          }}
          placeholder="Ex.: semana corrida no trabalho; deixei a academia para segunda."
          erro={excedeu ? `A nota pode ter até ${LIMITE_NOTA_SEMANA} caracteres.` : (erro ?? undefined)}
          dica={`${texto.trim().length} de ${LIMITE_NOTA_SEMANA} caracteres`}
        />
        <div className={estilos.rodape}>
          <span className={estilos.situacao} aria-live="polite">
            {situacao && !alterada ? <Check size={14} strokeWidth={2.25} aria-hidden="true" /> : null}
            {situacao}
          </span>
          <Botao type="submit" tamanho="sm" carregando={salvando} disabled={!alterada || excedeu}>
            Salvar nota
          </Botao>
        </div>
      </form>
    </Painel>
  );
}
