import type { ComponentType } from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile } from 'remotion';
import { Abertura } from './cenas/Abertura';
import { Calendario } from './cenas/Calendario';
import { Confianca } from './cenas/Confianca';
import { Cronometro } from './cenas/Cronometro';
import { Encerramento } from './cenas/Encerramento';
import { Gancho } from './cenas/Gancho';
import { Progresso } from './cenas/Progresso';
import { Revisao } from './cenas/Revisao';
import { Tarefas } from './cenas/Tarefas';
import { Fundo } from './componentes/Fundo';
import { cenas, ordemCenas } from './linhaDoTempo';
import type { NomeCena } from './linhaDoTempo';

export const ARQUIVO_TRILHA = 'audio/trilha.wav';

const componentesCena: Record<NomeCena, ComponentType> = {
  abertura: Abertura,
  gancho: Gancho,
  tarefas: Tarefas,
  calendario: Calendario,
  cronometro: Cronometro,
  progresso: Progresso,
  revisao: Revisao,
  confianca: Confianca,
  encerramento: Encerramento,
};

export function Apresentacao() {
  return (
    <AbsoluteFill>
      <Fundo />
      {ordemCenas.map((nome) => {
        const Cena = componentesCena[nome];
        return (
          <Sequence key={nome} from={cenas[nome].inicio} durationInFrames={cenas[nome].duracao} name={nome}>
            <Cena />
          </Sequence>
        );
      })}
      <Audio src={staticFile(ARQUIVO_TRILHA)} />
    </AbsoluteFill>
  );
}
