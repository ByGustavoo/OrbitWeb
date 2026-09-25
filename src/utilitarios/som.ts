export type AvisoSonoro = 'fimDoFoco' | 'fimDaPausa';

interface NotaAviso {
  frequencia: number;
  inicio: number;
  duracao: number;
}

const NOTAS_AVISO: Record<AvisoSonoro, NotaAviso[]> = {
  fimDoFoco: [
    { frequencia: 880, inicio: 0, duracao: 0.5 },
    { frequencia: 659.25, inicio: 0.22, duracao: 0.7 },
  ],
  fimDaPausa: [
    { frequencia: 659.25, inicio: 0, duracao: 0.5 },
    { frequencia: 880, inicio: 0.22, duracao: 0.7 },
  ],
};

const VOLUME_AVISO = 0.18;

type ClasseContextoAudio = typeof AudioContext;

let contexto: AudioContext | null = null;

function obterContexto(): AudioContext | null {
  if (contexto) return contexto;
  const Classe: ClasseContextoAudio | undefined =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: ClasseContextoAudio }).webkitAudioContext;
  if (!Classe) return null;
  try {
    contexto = new Classe();
  } catch {
    return null;
  }
  return contexto;
}

export function prepararSom(): void {
  const audio = obterContexto();
  if (audio?.state === 'suspended') void audio.resume().catch(() => undefined);
}

export function tocarAviso(aviso: AvisoSonoro): void {
  const audio = obterContexto();
  if (!audio) return;
  if (audio.state === 'suspended') void audio.resume().catch(() => undefined);
  const agora = audio.currentTime + 0.02;

  NOTAS_AVISO[aviso].forEach(({ frequencia, inicio, duracao }) => {
    const oscilador = audio.createOscillator();
    const volume = audio.createGain();
    oscilador.type = 'sine';
    oscilador.frequency.value = frequencia;
    volume.gain.setValueAtTime(0.0001, agora + inicio);
    volume.gain.exponentialRampToValueAtTime(VOLUME_AVISO, agora + inicio + 0.02);
    volume.gain.exponentialRampToValueAtTime(0.0001, agora + inicio + duracao);
    oscilador.connect(volume).connect(audio.destination);
    oscilador.start(agora + inicio);
    oscilador.stop(agora + inicio + duracao + 0.05);
  });
}
