import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const LARGURA_GIF = 800;
const QUADROS_POR_SEGUNDO_GIF = 12;
const CORES_PALETA = 96;

const raiz = fileURLToPath(new URL('..', import.meta.url));
const cli = join(raiz, 'node_modules', '@remotion', 'cli', 'remotion-cli.js');
const video = join(raiz, 'out', 'orbit-apresentacao.mp4');
const gif = join(raiz, 'apresentacao.gif');
const quadros = mkdtempSync(join(tmpdir(), 'orbit-gif-'));

function ffmpeg(argumentos: string[]): void {
  execFileSync(process.execPath, [cli, 'ffmpeg', '-y', '-v', 'error', ...argumentos], { stdio: 'inherit' });
}

try {
  ffmpeg(['-i', video, '-vf', `scale=${LARGURA_GIF}:-1:flags=lanczos`, '-r', String(QUADROS_POR_SEGUNDO_GIF), join(quadros, 'q%04d.png')]);
  ffmpeg([
    '-framerate',
    String(QUADROS_POR_SEGUNDO_GIF),
    '-i',
    join(quadros, 'q%04d.png'),
    '-filter_complex',
    `split[a][b];[a]palettegen=max_colors=${CORES_PALETA}:stats_mode=diff[p];[b][p]paletteuse=dither=none:diff_mode=rectangle`,
    '-loop',
    '0',
    gif,
  ]);
  console.log(`${gif} (${(statSync(gif).size / 1048576).toFixed(1)} MB)`);
} finally {
  rmSync(quadros, { recursive: true, force: true });
}
