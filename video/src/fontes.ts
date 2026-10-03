import { loadFont } from '@remotion/fonts';
import { staticFile } from 'remotion';

export function carregarFontes(): Promise<unknown> {
  return Promise.all([
    loadFont({ family: 'Geist', url: staticFile('fontes/geist.woff2'), weight: '100 900' }),
    loadFont({ family: 'Geist Mono', url: staticFile('fontes/geist-mono.woff2'), weight: '100 900' }),
  ]);
}
