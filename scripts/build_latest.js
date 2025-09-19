
// scripts/build_latest.js
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

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// ---------- Versión (inyectada por el workflow) ----------
const BUILD_VERSION = process.env.BUILD_VERSION || `v-dev.${Date.now()}`;
const GIT_SHA = process.env.GIT_SHA || 'local';

// ---------- Frescura ----------
const MAX_DAYS = 10;
const MIN_YEAR = 2023;
const NOW = Date.now();
const CUTOFF = NOW - MAX_DAYS * 24 * 60 * 60 * 1000;

const parser = new Parser({ timeout: 15000, maxRedirects: 3, headers: { 'User-Agent': 'Mozilla/5.0 (+https://github.com/davidvazquez74/news)' } });

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
const wc = (s='') => s.trim().split(/\s+/).filter(Boolean).length;

// ---------- Glosario ----------
function glossaryText(text='') {
  const pairs = [
    ['Euríbor', 'Índice que mueve hipotecas variables.'],
    ['BCE', 'Banco Central Europeo: decide tipos.'],
    ['inflación', 'Subida general de precios.'],
    ['arancel', 'Impuesto a importaciones.'],
    ['OTAN', 'Alianza militar euroatlántica.'],
    ['IA', 'Tecnología que automatiza tareas y toma decisiones.'],
    ['AI Act', 'Norma UE que regula la IA.'],
  ];
  const low = lc(text);
  const hits = [];
  for (const [term, expl] of pairs) if (low.includes(lc(term))) hits.push({ term, expl });
  return hits;
}

// ============== MOTOR DE IMPACTOS (Adult + Teen 2.0) ==============
// SÓLO REGLAS (sin LLM). Nunca devolvemos vacío.

const NEUTRAL_ADULT = 'Sin efecto directo en tu día a día.';
const NEUTRAL_TEEN  = 'A ti no te cambia nada, bro. 🙂';

// Ayuda
function within(maxWords, s){ return wc(s) <= maxWords; }
function clampAdult(s){
  const t = clean(s);
  if (!t) return NEUTRAL_ADULT;
  // sin emojis
  if (/[^\p{L}\p{N}\p{P}\p{Z}]/u.test(t)) return NEUTRAL_ADULT;
  if (!within(22, t)) return NEUTRAL_ADULT;
  return t;
}
function clampTeen(s){
  let t = clean(s);
  if (!t) return NEUTRAL_TEEN;
  // Máx 1 emoji visual. Contemos con regex sencilla
  const emojis = (t.match(/[\u231A-\u2764\u2702-\u27B0\u1F300-\u1FAD6\u1F900-\u1F9FF\u1FA70-\u1FAFF\u2600-\u26FF]/g) || []).length;
  if (emojis > 1) {
    // quita extras (deja el primero)
    let count = 0;
    t = t.replace(/([\u231A-\u2764\u2702-\u27B0\u1F300-\u1FAD6\u1F900-\u1F9FF\u1FA70-\u1FAFF\u2600-\u26FF])/g, (m)=> (++count>1?'':m));
  }
  if (!within(18, t)) {
    // recorte simple por palabras
    t = t.split(/\s+/).slice(0,18).join(' ');
  }
  return t;
}

function impactRules(title='', summary=''){
  const text = lc(`${title} ${summary}`);

  // === Seguridad / policial / sucesos ===
  if (/(homicidio|asesinato|violencia sexual|tiroteo|apunal|apuñal|cad[aá]ver|accidente mortal|explosi[oó]n)/.test(text)){
    return {
      adult: 'Evita la zona y sigue las indicaciones oficiales.',
      teen:  'No te acerques, bro; espera avisos oficiales. 🚫'
    };
  }

  // === Defensa, OTAN, maniobras, despliegues sin movilización civil ===
  if (/(otan|maniobras|despliegue|aviones?|cazas?|a-?400|radar)\b/.test(text) && !/(movilidad|cortes|trafic|tráfico|huelga)/.test(text)){
    return {
      adult: 'Actividad militar informativa; sin cambios en tu día a día.',
      teen:  'Solo ruido de aviones, chill. ✈️'
    };
  }

  // === Fiscalidad / impuestos / IRPF / normativa económica del hogar ===
  if (/(impuesto|iva|irpf|tasas?|deducci[oó]n|subsidio|bono(?!s))/i.test(text)){
    return {
      adult: 'Podrían cambiar pagos o ayudas; revisa facturas y requisitos.',
      teen:  'Puede cambiar lo que pagas/cobras; pregunta en casa. 🧾'
    };
  }

  // === Euríbor / tipos / hipoteca ===
  if (/(eur[íi]bor|bce|tipo(s)? de inter[eé]s|hipoteca)/.test(text)){
    return {
      adult: 'Si tu hipoteca es variable, revisa próximas cuotas.',
      teen:  'En casa podría subir la letra; ojo. 💸'
    };
  }

  // === Energía / combustibles ===
  if (/(gasolina|di[eé]sel|petr[oó]leo|combustible|carburante|luz|electricidad|gas\b)/.test(text)){
    return {
      adult: 'Vigila precios de surtidor y facturas estos días.',
      teen:  'Echar gasolina/luz igual sube un poco, bro. ⛽'
    };
  }

  // === Huelgas/transporte/movilidad ===
  if (/(huelga|paros?)\b.*\b(tren|metro|bus|aeropuerto|vuelo|taxi|rodalies|renfe|ferrocarril)/.test(text) ||
      /(cortes?|trafic|tr[aá]fico|retenciones?).*(evento|concierto|partido)/.test(text)){
    return {
      adult: 'Revisa horarios y alternativas; posibles retrasos y cortes.',
      teen:  'Llega antes: retrasos y cortes, cero dramas. 🚌'
    };
  }

  // === Vivienda / alquiler ===
  if (/(alquiler|vivienda|vpo|pisos|inmobiliaria)/.test(text)){
    return {
      adult: 'Pueden variar precios o condiciones de vivienda.',
      teen:  'Buscar piso puede ponerse más caro, full. 🏠'
    };
  }

  // === Clima adverso / DANA / alertas ===
  if (/(dana|temporal|lluvias intensas|inundaci[oó]n|tormenta|ola de calor|viento fuerte|alerta meteo)/.test(text)){
    return {
      adult: 'Ajusta planes y desplazamientos; consulta la previsión local.',
      teen:  'Plan B si llueve a saco; cuida el móvil. 🌧️'
    };
  }

  // === Salud / listas de espera / campañas vacunación ===
  if (/(covid|vacunas?|brote|epidemia|lista de espera|centro de salud|hospital)/.test(text)){
    return {
      adult: 'Puede afectar a citas o campañas; consulta tu centro.',
      teen:  'Si te toca vacuna/cita, estate atento al aviso. 💉'
    };
  }

  // === Educación / universidad / becas / matrícula ===
  if (/(colegios?|institutos?|universidad|matr[ií]cula|becas?)/.test(text)){
    return {
      adult: 'Calendarios y trámites pueden moverse; revisa fechas.',
      teen:  'Exámenes/fechas pueden cambiar; ojo al campus. 📅'
    };
  }

  // === Cultura / ocio / festivales / fiestas locales ===
  if (/(festival|concierto|fiesta|feria|exposici[oó]n|premios?).*(hoy|semana|fin de semana|ciudad|barrio)?/.test(text)){
    return {
      adult: 'Más gente y cortes puntuales; planifica desplazamientos.',
      teen:  'Se va a petar, llega pronto y pilla agua. 🎉'
    };
  }

  // === Deporte masivo ===
  if (/(champions|liga|mundial|copa del rey|barça|real madrid|atl[eé]tico|clásico)/i.test(text)){
    return {
      adult: 'Picos de tráfico y afluencia; prevé margen extra.',
      teen:  'Partidazo: metro a tope y cola everywhere. ⚽'
    };
  }

  // === Tecnología / redes / IA ===
  if (/\b(ia|inteligencia artificial|tiktok|instagram|whatsapp|x\.com|ciberseguridad|brecha|hackeo|datos personales)\b/i.test(text)){
    return {
      adult: 'Apps y servicios podrían cambiar avisos o permisos.',
      teen:  'Actualizaciones en apps; revisa permisos, bro. 📱'
    };
  }

  // === Internacional con efecto difuso en hogar medio ===
  if (/\b(guerra|conflicto|geopol[ií]tica|sanci[oó]n|bloqueo|otan|nato|rusia|china|ee\.uu\.)\b/i.test(text)){
    return {
      adult: 'Impacto indirecto (precios o mercados); mantente informado.',
      teen:  'Es global; a ti poco te cambia hoy. 🌍'
    };
  }

  // === Reportajes/soft news/personajes ===
  if (/(entrevista|perfil|reportaje|cr[oó]nica|historia humana|aniversario|conmemoraci[oó]n)/i.test(text)){
    return {
      adult: NEUTRAL_ADULT,
      teen:  NEUTRAL_TEEN
    };
  }

  // DEFAULT
  return {
    adult: NEUTRAL_ADULT,
    teen:  NEUTRAL_TEEN
  };
}

function computeImpacts(title='', summary=''){
  const { adult, teen } = impactRules(title, summary);
  return {
    impact_adult: clampAdult(adult),
    impact_teen:  clampTeen(teen),
    impact: clampAdult(adult) // compat
  };
}

// ---------- Normalización ----------
function normalizeItem(it, srcName) {
  const title = clean(it.title);
  const url = clean(it.link || it.guid || '');
  const published_at = iso(it.isoDate || it.pubDate || null);
  const summary = clean(it.contentSnippet || it.summary || it.content || '');

  const { impact_adult, impact_teen, impact } = computeImpacts(title, summary);

  return {
    title, url, source: srcName, published_at, summary,
    impact,
    impact_adult,
    impact_teen,
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
  if (!fs.existsSync(SOURCES_PATH)) {
    console.warn(`No existe ${SOURCES_PATH}. Se generará un latest.json mínimo.`);
  }
  const src = fs.existsSync(SOURCES_PATH) ? JSON.parse(fs.readFileSync(SOURCES_PATH, 'utf-8')) : {};
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
  const deportes = await buildBlock('Deportes');
  const radios = await buildBlock('Radios');

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
    background: keepPrevIfEmpty(global, 'background'),
    deportes: keepPrevIfEmpty(deportes, 'deportes'),
    radios: keepPrevIfEmpty(radios, 'radios')
  };

  // blocksOut para depuración
  outCompat.blocksOut = {
    Catalunya: catalunya,
    España: espana,
    MolinsDeRei: molins,
    LaRioja: rioja,
    Global: global
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
