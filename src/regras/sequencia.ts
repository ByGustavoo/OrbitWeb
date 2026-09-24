import type { SequenciaDTO } from '@/modelos/painel';
import { adicionarDiasIso } from '@/utilitarios/datas';

export function calcularSequencia(diasComAtividade: Iterable<string>, hojeIso: string): SequenciaDTO {
  const dias = new Set([...diasComAtividade].filter((dia) => dia <= hojeIso));
  const contaHoje = dias.has(hojeIso);

  let atual = 0;
  let cursor = contaHoje ? hojeIso : adicionarDiasIso(hojeIso, -1);
  while (dias.has(cursor)) {
    atual += 1;
    cursor = adicionarDiasIso(cursor, -1);
  }

  let recorde = 0;
  for (const dia of dias) {
    if (dias.has(adicionarDiasIso(dia, -1))) continue;
    let tamanho = 1;
    let proximo = adicionarDiasIso(dia, 1);
    while (dias.has(proximo)) {
      tamanho += 1;
      proximo = adicionarDiasIso(proximo, 1);
    }
    recorde = Math.max(recorde, tamanho);
  }

  return { atual, recorde, contaHoje };
}
