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

// ---------- Versión (inyectada por el workflow) ----------
const BUILD_VERSION = process.env.BUILD_VERSION || `v-dev.${Date.now()}`;
const GIT_SHA = process.env.GIT_SHA || 'local';

// ---------- Frescura ----------
const MAX_DAYS = 10;
const MIN_YEAR = 2023;
const NOW = Date.now();
const CUTOFF = NOW - MAX_DAYS * 24 * 60 * 60 * 1000;

// Parser RSS
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

// Normaliza caracteres mal decodificados comunes (mojibake)
function fixMojibake(s = '') {
  if (!s) return s;
  return s
    .replace(/Ã¡/g, 'á').replace(/Ã©/g, 'é').replace(/Ã­/g, 'í')
    .replace(/Ã³/g, 'ó').replace(/Ãº/g, 'ú').replace(/Ã±/g, 'ñ')
    .replace(/Ã/g, 'Á').replace(/Ã/g, 'É').replace(/Ã/g, 'Í')
    .replace(/Ã/g, 'Ó').replace(/Ã/g, 'Ú').replace(/Ã/g, 'Ñ')
    .replace(/â/g, '“').replace(/â/g, '”').replace(/â/g, '’')
    .replace(/â/g, '–').replace(/â/g, '—').replace(/â¦/g, '…')
    .replace(/â|â/g, '"').replace(/â/g, "'")
    .replace(/â¢/g, '•').replace(/â¢/g, '•')
    .replace(/â¨/g, ' ').replace(/â¨/g, ' ');
}

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

// ---------- Glosario breve ----------
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

// ---------- Impacto (reglas ampliadas + fallback garantizado) ----------

const NEUTRAL = 'Sin efecto directo en tu día a día.';
const TEEN_NEUTRAL = 'Sin efecto directo en tu día a día.';

const BANNED = [
  'seguimiento recomendado',
  'pendiente de evolución',
  'podría notarse en facturas o movilidad',
  'apps y servicios pueden cambiar reglas y permisos'
];
const notGeneric = (s='') => s && s.length > 12 && !BANNED.some(b => lc(s).includes(b));

// Deriva teen desde adulto si no hay uno específico
function teenFromAdult(a='') {
  if (!a) return TEEN_NEUTRAL;
  let t = a;
  t = t.replace(/\busted(es)?\b/gi, 'tú');
  // ligero toque juvenil
  if (t.length <= 110 && !/[\u{1F300}-\u{1FAFF}]/u.test(t)) t += ' 🙂';
  return t;
}

function impactRules(title = '', summary = '') {
  const text = lc(fixMojibake(`${title} ${summary}`));

  // Finanzas / tipos / hipotecas
  if (/(eur[íi]bor|bce|tipos? de inter[eé]s|hipoteca|inflaci[oó]n|ipc)/.test(text))
    return {
      adult: 'Si tu hipoteca es variable, revisa próximas cuotas y presupuesto.',
      teen:  'Si en casa hay hipoteca variable, la letra puede moverse. 💶'
    };

  // Energía / combustibles / luz / gas
  if (/(gasolina|di[eé]sel|petr[óo]leo|combustible|carburante|electricidad|luz\b|gas\b|energ[íi]a)/.test(text))
    return {
      adult: 'Atento a surtidor y factura: precios pueden moverse esta semana.',
      teen:  'Depósito y facturas pueden subir un poco → planes más caros. ⛽'
    };

  // Movilidad / huelgas / transporte / aeropuertos
  if (/(huelga|paros?\b)/.test(text) && /(tren|metro|bus|rodalies|renfe|aeropuerto|vuelo|taxis?)/.test(text))
    return {
      adult: 'Planifica desplazamientos: posibles retrasos y servicios mínimos.',
      teen:  'Ojito con tren/metro: retrasos y tocar madrugar. 🚌'
    };

  // Vivienda / alquiler / empleo / salarios
  if (/(alquiler|vivienda|vpo|salario|smi|empleo|paro\b)/.test(text))
    return {
      adult: 'Pueden cambiar condiciones de vivienda o nómina: revisa plazos.',
      teen:  'Pisos/curro: podrían cambiar precios o condiciones. 🏠'
    };

  // Impuestos / tasas / ayudas
  if (/(impuesto|iva\b|tasas?\b|bono|subsidio|deducci[oó]n)/.test(text))
    return {
      adult: 'Revisa facturas o ayudas: pueden variar importes y requisitos.',
      teen:  'Cosas más caras o cambios en ayudas; pregunta en casa. 🧾'
    };

  // Internacional / geopolítica relevante
  if (/(guerra|frente|alto el fuego|sanci[oó]n|otan|ue\b|un\b|nato|embargo|acuerdo internacional)/.test(text))
    return {
      adult: 'Posible efecto en precios y viajes si el escenario cambia.',
      teen:  'Si sube la tensión, pueden encarecerse vuelos o compras. ✈️'
    };

  // Redes / grandes plataformas (TikTok/privacidad)
  if (/(tiktok|instagram|facebook|meta|x\.com|twitter|red(es)? sociales?|privacidad|datos personales)/.test(text))
    return {
      adult: 'Apps pueden cambiar funciones o avisos; revisa permisos y tiempo de uso.',
      teen:  'Alguna función de la app puede cambiar; mira permisos. 📱'
    };

  // Cultura / TV / entretenimiento popular
  if (/(serie|premios|emmy|oscar|festival|concierto|estreno|netflix|hbo|disney\+)/.test(text))
    return {
      adult: 'Más interés y eventos: atención a horarios, entradas y movilidad.',
      teen:  'Más hype y colas para entradas; planifica con amigos. 🎟️'
    };

  // Empleo / ERE / aerolíneas / recortes
  if (/(ere|despidos?|recortes?)/.test(text) || (/(ryanair|vueling|iberia)\b/.test(text) && /(empleo|plantilla|base|aeropuerto)/.test(text)))
    return {
      adult: 'Si trabajas o viajas con la empresa afectada, revisa cambios y alternativas.',
      teen:  'Si voláis con esa aerolínea, pueden cambiar horarios o rutas. ✈️'
    };

  // Clima severo
  if (/(dana|temporal|lluvias intensas|ola de calor|inundaciones?|viento fuerte)/.test(text))
    return {
      adult: 'Ajusta planes y revisa alertas oficiales en tu zona.',
      teen:  'Plan B si hay mal tiempo; mira avisos. 🌧️'
    };

  // Sanidad / educación
  if (/(vacunas?|lista de espera|sanidad|salud|colegios?|universidad|matr[ií]cula|becas?)/.test(text))
    return {
      adult: 'Citas o trámites pueden moverse; consulta tu centro o web oficial.',
      teen:  'Fechas de clases/becas pueden cambiar; revisa el centro. 📅'
    };

  // Política / normativa (genérico)
  if (/(decreto|ley|normativa|boe|parlamento|congreso|senado|gobierno|generalitat|ayuntamiento)/.test(text))
    return {
      adult: 'Cambios normativos: comprueba si afectan a tus trámites o actividad.',
      teen:  'Pueden cambiar reglas; si te afecta, entérate. 📌'
    };

  // Seguridad / sucesos → sin alarma
  if (/(cad[aá]ver|homicidio|accidente|incendio|agresi[oó]n|detenci[oó]n|tribunal|juzgado)/.test(text))
    return {
      adult: 'Evita la zona y sigue indicaciones oficiales.',
      teen:  'No te acerques por allí; espera avisos.'
    };

  // Deportes / eventos masivos
  if (/(liga|champions|partido|derbi|concierto masivo|marat[oó]n)/.test(text))
    return {
      adult: 'Más tráfico y ocupación; sal con tiempo si estás cerca.',
      teen:  'Puede haber lío para moverse; queda con margen. ⚽'
    };

  // Fallback
  return { adult: NEUTRAL, teen: TEEN_NEUTRAL };
}

function impactAdultFrom(title = '', summary = '') {
  const { adult } = impactRules(title, summary);
  return notGeneric(adult) ? adult : NEUTRAL;
}
function impactTeenFrom(title = '', summary = '') {
  const { teen, adult } = impactRules(title, summary);
  const t = notGeneric(teen) ? teen : teenFromAdult(adult);
  return t || TEEN_NEUTRAL;
}

// ---------- Normalización ----------
function normalizeItem(it, srcName) {
  const rawTitle = clean(fixMojibake(it.title));
  const title = rawTitle || 'Sin título';
  const url = clean(it.link || it.guid || '');
  const published_at = iso(it.isoDate || it.pubDate || null);
  const summary = clean(fixMojibake(it.contentSnippet || it.summary || it.content || ''));

  const impact_adult = impactAdultFrom(title, summary);
  const impact_teen  = impactTeenFrom(title, summary);
  const impact = notGeneric(impact_adult) ? impact_adult : NEUTRAL;

  return {
    title, url, source: fixMojibake(srcName), published_at, summary,
    impact,
    impact_adult: impact,
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
    return out.map(it => ({
      ...it,
      // seguridad extra: jamás vacío
      impact: it.impact || NEUTRAL,
      impact_adult: it.impact_adult || NEUTRAL,
      impact_teen: it.impact_teen || teenFromAdult(it.impact_adult || NEUTRAL)
    }));
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
