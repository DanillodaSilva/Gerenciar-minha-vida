import { cpSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const destino = join(raiz, 'www');
const arquivos = ['index.html', 'regras.js', 'manifest.webmanifest', 'sw.js', 'icons'];

rmSync(destino, { recursive: true, force: true });
mkdirSync(destino);
for (const a of arquivos) cpSync(join(raiz, a), join(destino, a), { recursive: true });
console.log('www/ pronto com: ' + arquivos.join(', '));
