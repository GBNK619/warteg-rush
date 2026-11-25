// A working best-game-01 entry (Node 22, standard library only): the game is this directory's
// game/ folder, plain static files a desktop browser loads offline (game/index.html and its ES
// modules, no library and no network request), and the program hands it in. It copies game/ and
// screenshots/ from beside this file to /output and writes /output/dossier.json, the summary the
// judge reads, with the vendored make.fun library. A starting point, not a winner: Block Dodger, a
// plain 2D canvas game where a paddle dodges falling blocks and catches coins, with a title screen,
// score, lives and levels, game over and restart, flat colours and no sound. Build your own game
// (any genre, any library you vendor under game/, or none), put your 3 or 4 PNG or JPEG screenshots
// in screenshots/ (the first by name is the cover) and run it.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others refuse an entry the
// scorer would refuse (more than 4 screenshots or one over 256 KiB; more than 993 files in game/ or 48 MiB of game
// files, in all, or a path under game/ over 1000 bytes: game/ counts beside /output's own 1000-entry cap, its
// screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);

// Pre-flight validation (authored for WARTEG RUSH): after the hand-in is written, walk the output
// and confirm the scorer's caps really hold — the game/ tree within its file-count and total-byte
// caps, every screenshot within its size cap and the count within the maximum, and the dossier on
// disk present and parseable as JSON. Any breach throws, so an over-cap hand-in fails loudly here
// instead of travelling to the scorer only to be refused there.
const { readdirSync, readFileSync, statSync } = await import('node:fs');

const gameDir = join(out, 'game');
let gameFiles = 0;
let gameBytes = 0;
const walkGame = (dir) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walkGame(p);
    else {
      gameFiles += 1;
      gameBytes += st.size;
    }
  }
};
walkGame(gameDir);
if (gameFiles > 993) throw new Error(`pre-flight: game/ holds ${gameFiles} files, over the 993 file cap`);
if (gameBytes > 50331648) throw new Error(`pre-flight: game/ totals ${gameBytes} bytes, over the 48 MiB cap`);

const shotsDir = join(out, 'screenshots');
const shotNames = existsSync(shotsDir) ? readdirSync(shotsDir) : [];
if (shotNames.length > 4) throw new Error(`pre-flight: ${shotNames.length} screenshots, over the maximum of 4`);
let largestShot = 0;
for (const name of shotNames) {
  const size = statSync(join(shotsDir, name)).size;
  if (size > largestShot) largestShot = size;
  if (size > 262144) throw new Error(`pre-flight: screenshot ${name} is ${size} bytes, over the 262144 byte cap`);
}

const dossierPath = join(out, 'dossier.json');
if (!existsSync(dossierPath)) throw new Error('pre-flight: dossier.json is missing from the output');
JSON.parse(readFileSync(dossierPath, 'utf8'));

console.log(
  `pre-flight ok: game/ ${gameFiles} files, ${gameBytes} bytes (caps 993 files, 50331648 bytes); ` +
    `screenshots ${shotNames.length} of max 4, largest ${largestShot} bytes (cap 262144); dossier.json parses`,
);
