// scripts/build_latest.js
import fs from 'fs';
import path from 'path';
import Parser from 'rss-parser';
import { generateImpactFromKeywords } from './impact_engine/impactEngine.js';

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, 'data');
const SOURCES_PATH = path.join(DATA_DIR, 'sources.json');
const OUT_PATH = path.join(DATA_DIR, 'latest.json');
const META_PATH = path.join(DATA_DIR, 'meta.json');

const BUILD_VERSION = process.env.BUILD_VERSION || `v-dev.${Date.now()}`;
const GIT_SHA = process.env.GIT_SHA || 'local';

const MAX_DAYS = 7;
const MIN_YEAR = 2023;
const NOW = Date.now();
const CUTOFF = NOW - MAX_DAYS * 24 * 60 * 60 * 1000;

const parser = new Parser({ timeout: 15000, maxRedirects: 3 });

const iso = (d) => { try { return new Date(d).toISOString(); } catch { return null; } };
const okDate = (d) => {
  if (!d) return false;
  const ts = new Date(d).getTime();
  if (Number.isNaN(ts)) return false;
  const y = new Date(d).getUTCFullYear();
  return y >= MIN_YEAR && ts >= CUTOFF && ts <= NOW + 3 * 60 * 60 * 1000;
};
const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();
const lc = (s) => (s || '').toLowerCase();

const dedupeByTitle = (rows, limit) => {
  const seenU = new Set(), seenT = new Set(), out = [];
  for (const r of rows
    .filter(x => x.published_at)
    .sort((a,b) => new Date(b.published_at) - new Date(a.published_at))) {
    const u = r.url || '';
    const t = lc(r.title);
    if ((u && seenU.has(u)) || seenT.has(t)) continue;
    seenU.add(u); seenT.add(t);
    out.push(r);
    if (out.length >= limit) break;
  }
  return out;
};

function normalizeItem(it, srcName) {
  const title = clean(it.title);
  const url = clean(it.link || it.guid || '');
  const published_at = iso(it.isoDate || it.pubDate || null);
  const summary = clean(it.contentSnippet || it.summary || it.content || '');

  const imp = generateImpactFromKeywords(title, summary);
  const impact_adult = imp.adult || 'Sin efecto directo en tu día a día.';
  const impact_teen  = imp.teen  || 'Sin efecto directo en tu día a día.';

  return {
    title, url, source: srcName, published_at, summary,
    impact: impact_adult,
    impact_adult, impact_teen,
    impact_tag: imp.tag,
    impact_severity: imp.severity,
    impact_horizon: imp.horizon,
    impact_action: imp.action,
    impact_confidence: imp.confidence,
    glossary: []
  };
}

function normalizeTitleKey(title=''){
  return title
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g,' ')
    .trim();
}
function applyConsensus(rows = [], consensus = 2, maxItems = 3) {
  const map = new Map();
  for (const r of rows) {
    const key = normalizeTitleKey(r.title);
    if (!key) continue;
    const ts = r.published_at ? new Date(r.published_at).getTime() : 0;
    const prev = map.get(key);
    if (!prev) {
      map.set(key, { item: r, count: 1, latest: ts, sources: new Set([r.source]) });
    } else {
      if (!prev.sources.has(r.source)) {
        prev.count += 1;
        prev.sources.add(r.source);
      }
      if (ts > prev.latest) { prev.item = r; prev.latest = ts; }
    }
  }
  const eligible = [...map.values()]
    .filter(x => x.count >= consensus)
    .sort((a,b) => b.latest - a.latest)
    .map(x => x.item);
  return dedupeByTitle(eligible, maxItems);
}

async function fetchFeed(url) {
  try {
    const feed = await parser.parseURL(url);
    return feed.items || [];
  } catch (e) {
    console.error('Feed error:', url, e.message);
    return [];
  }
}
async function collectFromFeeds(feeds = []) {
  const rows = [];
  for (const f of feeds) {
    const items = await fetchFeed(f.url);
    for (const it of items) {
      const n = normalizeItem(it, f.name);
      if (!n.published_at) continue;
      if (!okDate(n.published_at)) continue;
      rows.push(n);
    }
    await new Promise(r => setTimeout(r, 200));
  }
  return rows;
}

async function main() {
  if (!fs.existsSync(SOURCES_PATH)) throw new Error(`No existe ${SOURCES_PATH}.`);
  const src = JSON.parse(fs.readFileSync(SOURCES_PATH, 'utf-8'));
  const prev = fs.existsSync(OUT_PATH) ? JSON.parse(fs.readFileSync(OUT_PATH, 'utf-8')) : null;

  async function buildBlock(blockName) {
    const def = src[blockName];
    if (!def || !Array.isArray(def.feeds)) return [];
    const rows = await collectFromFeeds(def.feeds);
    const out = applyConsensus(rows, def.consensus ?? 2, def.maxItems ?? 3);
    return out;
  }

  const catalunya = await buildBlock('Catalunya');
  const espana    = await buildBlock('España');
  const molins    = await buildBlock('MolinsDeRei');
  const rioja     = await buildBlock('LaRioja');
  const global    = await buildBlock('Global');

  function keepPrevIfEmpty(currentArr, prevKey) {
    if ((!currentArr || currentArr.length === 0) && prev && Array.isArray(prev[prevKey]) && prev[prevKey].length) {
      return prev[prevKey];
    }
    return currentArr;
  }

  const outCompat = {
    updated_at: new Date().toISOString(),
    version: BUILD_VERSION,
    commit: GIT_SHA,
    cataluna:   keepPrevIfEmpty(catalunya, 'cataluna'),
    espana:     keepPrevIfEmpty(espana, 'espana'),
    rioja:      keepPrevIfEmpty(rioja, 'rioja'),
    background: keepPrevIfEmpty(global, 'background')
  };

  const blocksOut = { Catalunya: catalunya, España: espana, MolinsDeRei: molins, LaRioja: rioja, Global: global };
  const finalOut = { ...outCompat, blocksOut };

  const meta = { version: BUILD_VERSION, builtAt: new Date().toISOString(), commit: GIT_SHA };
  fs.writeFileSync(META_PATH, JSON.stringify(meta, null, 2), 'utf-8');
  fs.writeFileSync(OUT_PATH, JSON.stringify(finalOut, null, 2), 'utf-8');

  const counts = { cataluna: finalOut.cataluna?.length||0, espana: finalOut.espana?.length||0, rioja: finalOut.rioja?.length||0, background: finalOut.background?.length||0 };
  console.log('latest.json actualizado →', OUT_PATH, '\ncounts:', counts);
}
main().catch(e => { console.error(e); process.exit(1); });
