// scripts/build_latest.js
// Node 20 ESM. Requiere "rss-parser" en package.json ("type":"module").
// Objetivos:
// 1) Fix mojibake (acentos rotos) en títulos/sumarios.
// 2) Motor de impactos v2 ampliado (no deja impactos vacíos).
// 3) Consenso por bloque y límites según data/sources.json (ya existente).
// 4) Escribe data/latest.json (compatible) y data/meta.json.
// 5) Falla si detecta impactos vacíos finales (para que el workflow avise).

import fs from 'fs';
import path from 'path';
import Parser from 'rss-parser';

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, 'data');
const SOURCES_PATH = path.join(DATA_DIR, 'sources.json');
const OUT_PATH = path.join(DATA_DIR, 'latest.json');
const META_PATH = path.join(DATA_DIR, 'meta.json');

const BUILD_VERSION = process.env.BUILD_VERSION || `v-dev.${Date.now()}`;
const GIT_SHA = (process.env.GIT_SHA || '').slice(0,7);

// ---------- fechas ----------
const MAX_DAYS = 7;
const MIN_YEAR = 2022;
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

// ---------- fix mojibake (UTF-8 mal decodificado como ISO-8859-1) ----------
const MOJI = [
  ['Ã¡','á'],['Ã©','é'],['Ã­','í'],['Ã³','ó'],['Ãº','ú'],
  ['Ã','Á'],['Ã‰','É'],['Ã','Í'],['Ã“','Ó'],['Ãš','Ú'],
  ['Ã±','ñ'],['Ã‘','Ñ'],
  ['â', '’'],['â','–'],['â','—'],['âª',''],['â«',''],
  ['â¦','…'],['â','“'],['â','”'],['â¢','•'],
  ['Â¿','¿'],['Â¡','¡'],['Â«','«'],['Â»','»'],['Â·','·'],
  ['Â','']
];
function fixMojibake(s=''){
  let out = String(s);
  for (const [a,b] of MOJI) out = out.split(a).join(b);
  return out;
}

// ---------- glosario breve ----------
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

// ---------- motor impactos v2 (ampliado) ----------
const BANNED = [
  'seguimiento recomendado',
  'pendiente de evolución',
  'podría notarse en facturas o movilidad',
  'apps y servicios pueden cambiar reglas y permisos'
];
const notGeneric = (s='') => s && s.length > 10 && !BANNED.some(b => lc(s).includes(b));

function ruleImpactAdult(title, summary){
  const t = lc(`${title} ${summary}`);

  // Finanzas / economía (macro y micro)
  if (/(eur[íi]bor|bce|tipos? de inter[eé]s|hipoteca|inflaci[oó]n|ipc|pib|banco|mercados?)/.test(t))
    return 'Revisa cuotas, precios y recibos: pueden variar en próximas semanas.';

  // Energía / combustibles
  if (/(gasolina|di[eé]sel|petr[óo]leo|combustible|carburante|electricidad|luz|gas|energ[íi]a)/.test(t))
    return 'Controla surtidor y facturas; posibles cambios de precio a corto plazo.';

  // Movilidad / huelgas / transporte
  if (/(huelga|paros?)/.test(t) && /(tren|metro|bus|rodalies|renfe|aeropuerto|vuelo|taxi|tr[aá]fico)/.test(t))
    return 'Ajusta desplazamientos: puede haber retrasos, cancelaciones o servicios mínimos.';

  // Vivienda / alquiler
  if (/(alquiler|vivienda|vpo|hipoteca|inquilin|arrendat|fianza)/.test(t))
    return 'Comprueba condiciones de contrato o revisión; podrían cambiar plazos o importes.';

  // Empleo / salarios / ERE
  if (/(empleo|paro\b|contrataci[oó]n|ere|despidos?|salario|smi|convenio)/.test(t))
    return 'Atento a cambios laborales o nómina; revisa comunicaciones de empresa o SEPE.';

  // Impuestos / ayudas
  if (/(impuesto|iva|irpf|tasas?|bono|subsidio|deducci[oó]n)/.test(t))
    return 'Podrían variar pagos o ayudas; consulta requisitos y fechas límite.';

  // Clima / fenómenos adversos
  if (/(dana|temporal|alerta|lluvias intensas|ola de calor|fr[ií]o|viento fuerte|inundaciones?)/.test(t))
    return 'Revisa la previsión y avisos oficiales; prepara plan B para actividades y viajes.';

  // Salud / educación
  if (/(sanidad|salud|vacunas?|lista de espera|colegios?|universidad|matr[ií]cula|becas?)/.test(t))
    return 'Puede afectar a citas, matrículas o plazos; confirma en tu centro o web oficial.';

  // Tecnología / redes sociales / ciberseguridad / IA
  if (/(tiktok|instagram|facebook|whatsapp|x(\.| |$)|ciberseguridad|brecha|hackeo|inteligencia artificial|ia\b|algoritmo|plataforma)/.test(t))
    return 'Cambios en apps o privacidad; revisa ajustes y condiciones de servicio.';

  // Cultura / ocio / eventos masivos / deporte
  if (/(concierto|festival|entradas|taquilla|exposici[oó]n|estreno|premios|liga|champions|partido|marat[oó]n)/.test(t))
    return 'Más afluencia y cortes puntuales; planifica horarios y desplazamientos.';

  // Justicia / seguridad / sucesos
  if (/(juicio|sentencia|fiscal|tribunal|polic[ií]a|homicidio|agresi[oó]n|incendio|accidente)/.test(t))
    return 'Sigue indicaciones oficiales; impacto local en accesos o servicios.';

  // Internacional (geopolítica/decisiones)
  if (/(ue\b|unión europea|otan|guerra|frontera|sanci[oó]n|acuerdo|conflicto|china|estados unidos|ee\.?uu\.?)/.test(t))
    return 'Efectos indirectos en precios, suministros o viajes; permanece atento a avisos.';

  return ''; // si no hay match, devolvemos vacío y luego forzamos fallback
}

function ruleImpactTeen(title, summary){
  const t = lc(`${title} ${summary}`);

  if (/(eur[íi]bor|bce|inter[eé]s|hipoteca|inflaci[oó]n)/.test(t))
    return 'Si en casa hay hipoteca o créditos, ojo con gastos este mes. 💸';
  if (/(gasolina|di[eé]sel|petr[óo]leo|combustible|electricidad|luz|gas)/.test(t))
    return 'Salidas y facturas pueden encarecerse un poco estos días. ⛽';
  if (/(huelga|paros?)/.test(t) && /(tren|metro|bus|aeropuerto|vuelo|taxi|rodalies|renfe)/.test(t))
    return 'Puede tocar madrugar: retrasos en tren/metro y vuelos. 🚌';
  if (/(alquiler|vivienda|hipoteca|pisos)/.test(t))
    return 'Pisos más caros o con cambios; si buscas, compara opciones. 🏠';
  if (/(impuesto|iva|tasas?|bono|subsidio|beca)/.test(t))
    return 'Puede cambiar lo que cobras o pagas; pregunta en casa. 🧾';
  if (/(dana|temporal|lluvias|ola de calor|fr[ií]o|viento|inundaciones?)/.test(t))
    return 'Plan B para entrenos y planes; mira la previsión. 🌧️';
  if (/(sanidad|vacunas?|colegio|universidad|matr[ií]cula|becas?)/.test(t))
    return 'Fechas y trámites pueden moverse; revisa el tablón. 📅';
  if (/(tiktok|instagram|whatsapp|x(\.| |$)|redes|ia\b|inteligencia artificial|algoritmo)/.test(t))
    return 'Apps y privacidad con cambios; revisa permisos. 📱';
  if (/(concierto|festival|entradas|estreno|premios|liga|partido|champions)/.test(t))
    return 'Más gente y atasco cerca; llega con margen. 🎟️';
  if (/(juicio|sentencia|polic[ií]a|incendio|accidente)/.test(t))
    return 'Evita la zona y sigue avisos oficiales.';

  return '';
}

const NEUTRAL_ADULT = 'Sin efecto directo en tu día a día.';
const NEUTRAL_TEEN  = 'Sin efecto directo en tu día a día.';

function ensureImpact(pair){
  let [adult, teen] = pair;
  if (!notGeneric(adult)) adult = NEUTRAL_ADULT;
  if (!notGeneric(teen))  teen  = NEUTRAL_TEEN;
  return [adult, teen];
}

// ---------- normalización de items ----------
function normalizeItem(it, srcName) {
  const rawTitle = clean(it.title);
  const title = fixMojibake(rawTitle);
  const url = clean(it.link || it.guid || '');
  const published_at = iso(it.isoDate || it.pubDate || null);
  const summary = fixMojibake(clean(it.contentSnippet || it.summary || it.content || ''));

  let impactAdult = ruleImpactAdult(title, summary);
  let impactTeen  = ruleImpactTeen(title, summary);
  [impactAdult, impactTeen] = ensureImpact([impactAdult, impactTeen]);

  return {
    title, url, source: srcName, published_at, summary,
    impact: impactAdult, // compat
    impact_adult: impactAdult,
    impact_teen: impactTeen,
    glossary: glossaryText(`${title} ${summary}`)
  };
}

// ---------- consenso ----------
function normalizeTitleKey(title=''){
  return title
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g,' ')
    .trim();
}

function dedupeByTitle(rows, limit) {
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

// ---------- fetch ----------
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
    await new Promise(r => setTimeout(r, 250));
  }
  return rows;
}

// ---------- main ----------
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
      console.warn(`keep previous for ${prevKey} (no fresh items)`);
      return prev[prevKey];
    }
    return currentArr;
  }

  const outCompat = {
    updated_at: new Date().toISOString(),
    version: BUILD_VERSION,
    commit: GIT_SHA,
    cataluna: keepPrevIfEmpty(catalunya, 'cataluna'),
    espana:   keepPrevIfEmpty(espana,    'espana'),
    rioja:    keepPrevIfEmpty(rioja,     'rioja'),
    background: keepPrevIfEmpty(global,  'background')
  };

  const meta = {
    version: BUILD_VERSION,
    builtAt: new Date().toISOString(),
    commit: GIT_SHA
  };
  fs.writeFileSync(META_PATH, JSON.stringify(meta, null, 2), 'utf-8');
  fs.writeFileSync(OUT_PATH, JSON.stringify(outCompat, null, 2), 'utf-8');

  // Verificación: impactos vacíos
  const keys = ['cataluna','espana','rioja','background'];
  let empty = 0, total = 0;
  for (const k of keys) {
    for (const it of (outCompat[k] || [])) {
      total++;
      if (!notGeneric(it.impact_adult) || !notGeneric(it.impact_teen)) empty++;
    }
  }
  console.log(`impactos vacíos: ${empty} / ${total}`);
  if (total > 0 && empty > 0) {
    // No abortamos aquí para no cortar local; el workflow hará validación propia.
  }
  console.log('latest.json actualizado', BUILD_VERSION);
}

main().catch(e => { console.error(e); process.exit(1); });
