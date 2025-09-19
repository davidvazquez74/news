// scripts/build_latest.js (HOTFIX)
// Node ESM. Requiere "rss-parser" y "type":"module" en package.json
import fs from 'fs';
import path from 'path';
import Parser from 'rss-parser';

// ---------- Rutas ----------
const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, 'data');
const SOURCES_PATH = path.join(DATA_DIR, 'sources.json');
const OUT_PATH = path.join(DATA_DIR, 'latest.json');
const META_PATH = path.join(DATA_DIR, 'meta.json');

// ---------- Versión (inyectada por el workflow) ----------
const BUILD_VERSION = process.env.BUILD_VERSION || `v-dev.${Date.now()}`;
const GIT_SHA = process.env.GIT_SHA || 'local';

// ---------- Frescura ----------
const MAX_DAYS = 10;
const MIN_YEAR = 2023;
const NOW = Date.now();
const CUTOFF = NOW - MAX_DAYS * 24 * 60 * 60 * 1000;

const parser = new Parser({ timeout: 15000, maxRedirects: 3 });

// ---------- Utils ----------
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

// ---------- Glosario ----------
function glossaryText(text='') {
  const pairs = [
    ['Euríbor', 'Índice que mueve hipotecas variables.'],
    ['BCE', 'Banco Central Europeo: decide tipos.'],
    ['inflación', 'Subida general de precios.'],
    ['arancel', 'Impuesto a importaciones.'],
    ['OTAN', 'Alianza militar euroatlántica.'],
    ['AI Act', 'Ley europea que regula la IA.']
  ];
  const low = lc(text);
  const hits = [];
  for (const [term, expl] of pairs) if (low.includes(lc(term))) hits.push({ term, expl });
  return hits;
}

// ---------- Impacto (HOTFIX: nunca vacío) ----------
const neutral = 'Sin efecto directo en tu día a día.';

function impactAdultFrom(title = '', summary = '') {
  const t = (title + ' ' + summary).toLowerCase();

  // Finanzas / hipotecas
  if (/(eur[íi]bor|bce|tipos? de inter[eé]s|hipoteca)/.test(t))
    return 'Si tu hipoteca es variable, la cuota puede moverse en próximas revisiones.';

  // Energía / combustibles
  if (/(gasolina|di[eé]sel|petr[óo]leo|carburante|combustible|gas|electricidad|energ[íi]a)/.test(t))
    return 'Vigila precios en surtidor y facturas: podrían moverse estos días.';

  // Movilidad / huelgas
  if (/(huelga|paro|paros)/.test(t) && /(tren|metro|bus|rodalies|renfe|aeropuerto|vuelo|taxis?)/.test(t))
    return 'Revisa horarios y alternativas: puede haber retrasos o servicios mínimos.';

  // Vivienda / empleo / salarios
  if (/(alquiler|vivienda|vpo|salario|smi|empleo|paro\b)/.test(t))
    return 'Posibles cambios en vivienda o nómina; revisa condiciones y plazos.';

  // Impuestos / ayudas
  if (/(impuesto|iva|tasas?|bono|subsidio|deducci[oó]n)/.test(t))
    return 'Puede variar lo que pagas o recibes; revisa facturas, requisitos y fechas.';

  // Tecnología / plataformas (TikTok, redes sociales)
  if (/\b(tiktok|red(es)? social(es)?|instagram|facebook|twitter|x\.com)\b/.test(t))
    return 'Si usas la plataforma, podrían cambiar funciones, avisos o acceso según acuerdos.';

  // IA y tech normativa
  if (/\b(inteligencia artificial|ia\b|ai act|algoritmo|modelos? de ia)\b/.test(t))
    return 'Servicios con IA pueden ajustar avisos y permisos por nuevas normas.';

  // Clima / tiempo severo
  if (/(dana|tempor(al|ada)|lluvias intensas|olas? de calor|fr[ií]o|viento fuerte|inundaciones?)/.test(t))
    return 'Ajusta planes y desplazamientos; revisa alertas y previsión local.';

  // Sanidad / educación
  if (/(sanidad|salud|vacunas?|lista de espera|colegios?|universidad|matr[ií]cula|becas?)/.test(t))
    return 'Puede afectar a citas, trámites o calendarios; consulta tu centro o web oficial.';

  // Política / normativa
  if (/(decreto|ley|normativa|boe|parlamento|congreso|senado|gobierno|generalitat|ayuntamiento)/.test(t))
    return 'Cambios normativos: comprueba si impactan en tu actividad o trámites.';

  // Deportes / ocio
  if (/(liga|champions|concierto|festival|entradas|taquilla|partido)/.test(t))
    return 'Impacto puntual en planes y tráfico de la zona durante el evento.';

  // Fallback
  return neutral;
}

function impactTeenFrom(title = '', summary = '') {
  const t = (title + ' ' + summary).toLowerCase();

  if (/(eur[íi]bor|bce|tipos|hipoteca)/.test(t))
    return 'Si en casa hay hipoteca variable, la letra puede cambiar.';
  if (/(gasolina|di[eé]sel|petr[óo]leo|carburante|combustible|gas|electricidad)/.test(t))
    return 'Depósito y facturas pueden subir un poco → planes más caros.';
  if (/(huelga|paro|paros)/.test(t) && /(tren|metro|bus|rodalies|renfe|aeropuerto|vuelo|taxis?)/.test(t))
    return 'Ojo con tren/metro: retrasos y tocar madrugar.';
  if (/(alquiler|vivienda|vpo|salario|smi|empleo)/.test(t))
    return 'Pisos o curro: pueden cambiar precios o condiciones.';
  if (/(impuesto|iva|tasas?|bono|subsidio|deducci[oó]n)/.test(t))
    return 'Cosas más caras o cambios en ayudas; pregunta en casa.';
  if (/\b(tiktok|red(es)? social(es)?|instagram|facebook|twitter|x\.com)\b/.test(t))
    return 'Si usas la app, alguna opción puede cambiar.';
  if (/\b(inteligencia artificial|ia\b|ai act|algoritmo|modelos? de ia)\b/.test(t))
    return 'Apps con IA con más normas y avisos.';
  if (/(dana|temporal|lluvias intensas|ola de calor|fr[ií]o|viento|inundaciones?)/.test(t))
    return 'Plan B para entrenos/planes: tiempo chungo.';
  if (/(sanidad|vacunas?|colegios?|universidad|matr[ií]cula|becas?)/.test(t))
    return 'Fechas o trámites pueden moverse; revisa el centro.';
  if (/(liga|champions|concierto|festival|entradas|partido)/.test(t))
    return 'Más gente y tráfico; sal con margen.';

  return neutral;
}

// ---------- Normalización ----------
function normalizeItem(it, srcName) {
  const title = clean(it.title);
  const url = clean(it.link || it.guid || '');
  const published_at = iso(it.isoDate || it.pubDate || null);
  const summary = clean(it.contentSnippet || it.summary || it.content || '');

  let impact_adult = impactAdultFrom(title, summary);
  let impact_teen  = impactTeenFrom(title, summary);

  // HOTFIX: nunca dejar vacío
  if (!impact_adult) impact_adult = neutral;
  if (!impact_teen)  impact_teen  = neutral;

  return {
    title, url, source: srcName, published_at, summary,
    impact: impact_adult,                // compat
    impact_adult: impact_adult,
    impact_teen: impact_teen,
    glossary: glossaryText(`${title} ${summary}`)
  };
}

// ---------- Consensus ----------
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

// ---------- Fetch ----------
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
    await new Promise(r => setTimeout(r, 300));
  }
  return rows;
}

// ---------- Main ----------
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
  const espana = await buildBlock('España');
  const molins = await buildBlock('MolinsDeRei');
  const rioja = await buildBlock('LaRioja');
  const global = await buildBlock('Global');

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
    cataluna: keepPrevIfEmpty(catalunya, 'cataluna'),
    espana: keepPrevIfEmpty(espana, 'espana'),
    rioja: keepPrevIfEmpty(rioja, 'rioja'),
    background: keepPrevIfEmpty(global, 'background')
  };

  const meta = {
    version: BUILD_VERSION,
    builtAt: new Date().toISOString(),
    commit: GIT_SHA
  };
  fs.writeFileSync(META_PATH, JSON.stringify(meta, null, 2), 'utf-8');
  fs.writeFileSync(OUT_PATH, JSON.stringify(outCompat, null, 2), 'utf-8');

  console.log('latest.json actualizado', BUILD_VERSION);
}

main().catch(e => { console.error(e); process.exit(1); });
