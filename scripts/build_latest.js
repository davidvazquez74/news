// scripts/build_latest.js
// Node ESM. Requiere "rss-parser" en package.json y "type":"module"
import fs from 'fs';
import path from 'path';
import Parser from 'rss-parser';

// ------------------ Config ------------------
const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, 'data');
const SOURCES_PATH = path.join(DATA_DIR, 'sources.json');
const OUT_PATH = path.join(DATA_DIR, 'latest.json');

// Frescura: acepta noticias de los últimos 10 días (algunos RSS retrasan fechas)
const MAX_DAYS = 10;
const MIN_YEAR = 2023;
const NOW = Date.now();
const CUTOFF = NOW - MAX_DAYS * 24 * 60 * 60 * 1000;

const parser = new Parser({ timeout: 15000, maxRedirects: 3 });

// ------------------ Utilidades ------------------
const iso = (d) => {
  try { return new Date(d).toISOString(); } catch { return null; }
};

const okDate = (d) => {
  if (!d) return false;
  const ts = new Date(d).getTime();
  if (Number.isNaN(ts)) return false;
  const y = new Date(d).getUTCFullYear();
  // tolerancia +3h por TZ/servidores
  return y >= MIN_YEAR && ts >= CUTOFF && ts <= (NOW + 3 * 60 * 60 * 1000);
};

const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();
const lc = (s) => (s || '').toLowerCase();

const dedupe = (rows, limit) => {
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

// ------------------ Glosario (opcional, breve) ------------------
function glossaryText(text='') {
  const pairs = [
    ['Euríbor', 'Índice que mueve hipotecas variables.'],
    ['BCE', 'Banco Central Europeo: decide tipos.'],
    ['inflación', 'Subida general de precios.'],
    ['arancel', 'Impuesto a importaciones.'],
    ['OTAN', 'Alianza militar euroatlántica.'],
    ['AI Act', 'Ley europea que regula la IA.'],
  ];
  const low = lc(text);
  const hits = [];
  for (const [term, expl] of pairs) {
    if (low.includes(lc(term))) hits.push({ term, expl });
  }
  return hits;
}

// ------------------ Impacto (sin plantillas genéricas) ------------------
const BANNED = [
  'seguimiento recomendado',
  'pendiente de evolución',
  'podría notarse en facturas o movilidad',
  'apps y servicios pueden cambiar reglas y permisos',
];

const notGeneric = (s='') => {
  const t = lc(s);
  return s && s.length > 12 && !BANNED.some(b => t.includes(b));
};

function impactAdultFrom(title='', summary='') {
  const blob = lc(`${title} ${summary}`);

  if (/(eur[íi]bor|bce|tipos de inter[eé]s)/.test(blob))
    return 'Si tu hipoteca es variable, la cuota puede moverse en próximas revisiones.';

  if (/(gasolina|di[eé]sel|petr[óo]leo|combustible|carburante)/.test(blob))
    return 'Repostar puede salir algo más caro; compara gasolineras o ajusta trayectos.';

  if (/(huelga|paro)/.test(blob) && /(tren|metro|bus|rodalies|renfe|aeropuerto|vuelo)/.test(blob))
    return 'Revisa horarios y alternativas: podrían aparecer retrasos o servicios mínimos.';

  if (/(alquiler|vivienda|hipoteca|vpo|smi)/.test(blob))
    return 'Posible efecto en vivienda o nómina: revisa condiciones, ayudas y fechas.';

  if (/(impuesto|iva|tasas?|subsidio|bono)/.test(blob))
    return 'Puede cambiar lo que pagas o recibes; revisa facturas y requisitos.';

  if (/(inteligencia artificial|ia|algoritmo|ai act|modelo)/.test(blob))
    return 'Apps y servicios pueden mostrar más avisos y controles por normas de IA.';

  if (/(israel|gaza|ucrania|rusia|iran|yemen|otan|mar rojo)/.test(blob))
    return 'Si viajas, consulta alertas y vuelos; la energía y la logística pueden moverse.';

  // Sucesos sin efecto general -> no inventamos impacto
  if (/(suceso|cad[aá]ver|homicidio|accidente|incendio|tribunal|juzgado|detenci[oó]n|agresi[oó]n)/.test(blob))
    return '';

  return ''; // sin genéricos
}

function impactTeenFrom(title='', summary='') {
  const blob = lc(`${title} ${summary}`);

  if (/(eur[íi]bor|bce|tipos)/.test(blob))
    return 'Si en casa hay hipoteca variable, la letra puede cambiar. 💶';
  if (/(gasolina|di[eé]sel|petr[óo]leo|combustible|carburante)/.test(blob))
    return 'Depósito algo más caro → finde y viajes suben un poco. ⛽';
  if (/(huelga|paro)/.test(blob) && /(tren|metro|bus|rodalies|renfe|aeropuerto|vuelo)/.test(blob))
    return 'Ojito con metro/tren: retrasos y tocar madrugar. 🚌';
  if (/(alquiler|vivienda|hipoteca|vpo|smi)/.test(blob))
    return 'Pisos y curros: pueden cambiar precios o condiciones. 🏠';
  if (/(impuesto|iva|tasas?|subsidio|bono)/.test(blob))
    return 'Cosas algo más caras o cambios en ayudas; pregunta en casa. 🧾';
  if (/(inteligencia artificial|ia|algoritmo|ai act|modelo)/.test(blob))
    return 'Más normas en apps con IA; alguna función puede cambiar. 📱';
  if (/(israel|gaza|ucrania|rusia|iran|yemen|otan|mar rojo)/.test(blob))
    return 'Si viajas, mira alertas y vuelos; la gasolina puede subir. ✈️';

  if (/(suceso|cad[aá]ver|homicidio|accidente|incendio|tribunal|juzgado|detenci[oó]n|agresi[oó]n)/.test(blob))
    return '';

  return '';
}

// ------------------ Normalización de ítems ------------------
function normalize(it, srcName) {
  const title = clean(it.title);
  const url = clean(it.link || it.guid || '');
  const published_at = iso(it.isoDate || it.pubDate || null);
  const summary = clean(it.contentSnippet || it.summary || it.content || '');

  const impact_adult = impactAdultFrom(title, summary);
  const impact_teen  = impactTeenFrom(title, summary);

  const impact = notGeneric(impact_adult) ? impact_adult : ''; // compat: campo "impact"

  return {
    title, url, source: srcName, published_at, summary,
    impact,
    impact_adult: impact,
    impact_teen: notGeneric(impact_teen) ? impact_teen : '',
    glossary: glossaryText(`${title} ${summary}`)
  };
}

// ------------------ Fetch & Build ------------------
async function fetchFeed(url) {
  try {
    const feed = await parser.parseURL(url);
    return feed.items || [];
  } catch (e) {
    console.error('Feed error:', url, e.message);
    return [];
  }
}

async function buildSection(sources = [], limit = 6) {
  const rows = [];
  for (const s of sources) {
    const items = await fetchFeed(s.rss);
    for (const it of items) {
      const n = normalize(it, s.name);
      if (!n.published_at) continue;
      if (!okDate(n.published_at)) continue;
      rows.push(n);
    }
    // pequeño respiro para no saturar servidores
    await new Promise(r => setTimeout(r, 300));
  }
  const out = dedupe(rows, limit);
  console.log(`section "${(sources[0]?.region||'') || sources.map(x=>x.name).join(' | ')}" => ${out.length} items`);
  return out;
}

// ------------------ Main ------------------
async function main() {
  if (!fs.existsSync(SOURCES_PATH)) {
    throw new Error(`No existe ${SOURCES_PATH}. Crea data/sources.json con tus feeds.`);
  }

  const sources = JSON.parse(fs.readFileSync(SOURCES_PATH, 'utf-8'));
  const PREV = fs.existsSync(OUT_PATH) ? JSON.parse(fs.readFileSync(OUT_PATH, 'utf-8')) : null;

  const built = {
    updated_at: new Date().toISOString(),
    cataluna: await buildSection(sources.cataluna || []),
    espana:   await buildSection(sources.espana   || []),
    rioja:    await buildSection(sources.rioja    || []),
    background: await buildSection(sources.background || [])
  };

  // Si alguna sección vino vacía, conserva la anterior (mejor que dejar en blanco)
  ['cataluna','espana','rioja','background'].forEach(k => {
    if ((!built[k] || built[k].length === 0) && PREV && Array.isArray(PREV[k]) && PREV[k].length) {
      built[k] = PREV[k];
      console.log(`⚠️ keep previous for section: ${k} (no fresh items)`);
    }
  });

  fs.writeFileSync(OUT_PATH, JSON.stringify(built, null, 2), 'utf-8');

  const counts = Object.fromEntries(['cataluna','espana','rioja','background'].map(k => [k, built[k]?.length || 0]));
  console.log('latest.json actualizado →', OUT_PATH, '\ncounts:', counts);
}

// Execute
main().catch(e => { console.error(e); process.exit(1); });
