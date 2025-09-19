// scripts/run_fix.js
// Post-procesa data/latest.json: corrige textos, rellena impactos y asegura secciones no vacías.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { cleanText } from './utils/text.js';
import { fillImpactsForItem } from './rules/impactRulesPatch.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_PATH = path.join(__dirname, '..', 'data'); // por si alguien lo ejecuta desde repo raíz
const CANDIDATES = [
  path.resolve('data/latest.json'),
  path.join(DATA_PATH, 'latest.json')
];

function loadJson() {
  for (const p of CANDIDATES) {
    if (fs.existsSync(p)) {
      const raw = fs.readFileSync(p, 'utf8');
      return { json: JSON.parse(raw), path: p };
    }
  }
  throw new Error('data/latest.json not found');
}

function ensureArrayX(a) {
  return Array.isArray(a) ? a : [];
}

function ensureSectionFallback(out, key, fallbackKey) {
  const src = ensureArrayX(out[key]);
  if (src.length > 0) return out;
  const fb = ensureArrayX(out[fallbackKey]).slice(0, 5);
  out[key] = fb;
  return out;
}

function processItem(it) {
  it.title   = cleanText(it.title || "");
  it.summary = cleanText(it.summary || "");
  it.impact        = it.impact ?? "";
  it.impact_adult  = it.impact_adult ?? "";
  it.impact_teen   = it.impact_teen ?? "";

  // Rellenar impactos si están vacíos o neutros
  return fillImpactsForItem(it);
}

function main() {
  const { json, path: where } = loadJson();
  const buckets = ['cataluna','espana','rioja','background','deportes','radios'];
  let touched = 0;

  for (const b of buckets) {
    if (!json[b]) continue;
    json[b] = ensureArrayX(json[b]).map(it => {
      const before = JSON.stringify([it.impact, it.impact_adult, it.impact_teen]);
      const newIt = processItem(it);
      const after  = JSON.stringify([newIt.impact, newIt.impact_adult, newIt.impact_teen]);
      if (before !== after) touched++;
      return newIt;
    });
  }

  // Asegura secciones mínimas si vienen vacías (no rompe front)
  if (json.cataluna && json.cataluna.length > 0) {
    json.espana   = ensureArrayX(json.espana);
    json.deportes = ensureArrayX(json.deportes);
    json.radios   = ensureArrayX(json.radios);

    ensureSectionFallback(json, 'espana',   'cataluna');
    ensureSectionFallback(json, 'deportes', 'cataluna');
    ensureSectionFallback(json, 'radios',   'cataluna');
  }

  // Escribe con UTF-8 preservando emojis
  fs.writeFileSync(where, JSON.stringify(json, null, 2), 'utf8');
  console.log(`Enhanced impacts on ${touched} item(s). Wrote: ${where}`);
}

main();
