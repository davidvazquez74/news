// scripts/build_latest.js
// ES Module. Necesita: `rss-parser` en package.json
import fs from 'fs';
import path from 'path';
import Parser from 'rss-parser';

const parser = new Parser({ timeout: 15000 });
const ROOT = process.cwd();
const SOURCES = path.join(ROOT, 'data', 'sources.json');
const OUT = path.join(ROOT, 'data', 'latest.json');

// --- FRESCURA ---
const MAX_DAYS = 7;
const MIN_YEAR = 2024;
const now = Date.now();
const cutoff = now - MAX_DAYS * 24 * 60 * 60 * 1000;

// --- UTILIDADES ---
const iso = (d) => {
  try { return new Date(d).toISOString(); } catch { return null; }
};
const okDate = (d) => {
  if (!d) return false;
  const ts = new Date(d).getTime();
  if (Number.isNaN(ts)) return false;
  const y = new Date(d).getUTCFullYear();
  return y >= MIN_YEAR && ts >= cutoff && ts <= now + 60 * 1000;
};
const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();
const lc = (s) => (s || '').toLowerCase();
const dedupe = (rows, n) => {
  const seenU = new Set(), seenT = new Set(), out = [];
  for (const r of rows.sort((a,b)=>new Date(b.published_at)-new Date(a.published_at))) {
    const u = r.url || '', t = lc(r.title);
    if ((u && seenU.has(u)) || seenT.has(t)) continue;
    seenU.add(u); seenT.add(t); out.push(r);
    if (out.length >= n) break;
  }
  return out;
};

// --- GLOSARIO MUY BREVE (opcional) ---
function glossaryText(text='') {
  const pairs = [
    ['Euríbor', 'Índice que mueve hipotecas variables.'],
    ['BCE', 'Banco Central Europeo: decide tipos de interés.'],
    ['inflación', 'Subida general de precios.'],
    ['arancel', 'Impuesto a importaciones.'],
    ['OTAN', 'Alianza militar euroatlántica.'],
    ['AI Act', 'Ley europea que regula la IA.'],
  ];
  const low = lc(text);
  const hits = [];
  for (const [term, expl] of pairs) if (low.includes(lc(term))) hits.push({ term, expl });
  return hits;
}

// --- REGLAS DE IMPACTO ---
const BANNED = [
  'seguimiento recomendado',
  'pendiente de evolución',
  'podría notarse en facturas o movilidad',
];

function notGeneric(s='') {
  const test = lc(s);
  return s && s.length > 12 && !BANNED.some(b => test.includes(b));
}

function impactAdultFrom(title='', summary='') {
  const blob = lc(`${title} ${summary}`);

  // 1) Temas con impacto claro y cotidiano
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
    return 'Apps y servicios pueden cambiar reglas y permisos: más avisos y controles.';

  if (/(israel|gaza|ucrania|rusia|iran|yemen|otan|mar rojo)/.test(blob))
    return 'Si viajas, consulta alertas y vuelos; la energía y la logística pueden moverse.';

  // 2) Sucesos/cronistas (hallazgos, sucesos, tribunales sin cambio normativo)
  if (/(suceso|cad[aá]ver|homicidio|accidente|incendio|tribunal|juzgado|detenci[oó]n|agresi[oó]n)/.test(blob))
    return ''; // no inventamos impacto general: suceso puntual → sin impacto cotidiano

  // 3) Si nada aplica: sin impacto (mejor vacío que genérico)
  return '';
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

  // Sucesos puntuales → sin impacto teen inventado
  if (/(suceso|cad[aá]ver|homicidio|accidente|incendio|tribunal|juzgado|detenci[oó]n|agresi[oó]n)/.test(blob))
    return '';

  return ''; // sin genéricos
}

// --- NORMALIZACIÓN ---
function normalize(it, srcName) {
  const title = clean(it.title);
  const url = clean(it.link || it.guid || '');
  const published_at = iso(it.isoDate || it.pubDate || null);
  const summary = clean(it.contentSnippet || it.summary || it.content || '');

  // Impactos
  const impA = impactAdultFrom(title, summary);
  const impT = impactTeenFrom(title, summary);

  const impact = notGeneric(impA) ? impA : ''; // compat: "impact" = adulto (si existe)

  return {
    title, url, source: srcName, published_at, summary,
    impact,                  // compat para el frontend actual
    impact_adult: impact,    // campo explícito
    impact_teen: notGeneric(impT) ? impT : '',
    glossary: glossaryText(`${title} ${summary}`)
  };
}

// --- FETCH ---
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
    // pequeño respiro para no saturar
    await new Promise(r => setTimeout(r, 500));
  }
  return dedupe(rows, limit);
}

// --- MAIN ---
async function main() {
  const sources = JSON.parse(fs.readFileSync(SOURCES, 'utf-8'));
  const data = {
    updated_at: new Date().toISOString(),
    cataluna: await buildSection(sources.cataluna),
    espana: await buildSection(sources.espana),
    rioja: await buildSection(sources.rioja),
    background: await buildSection(sources.background)
  };

  fs.writeFileSync(OUT, JSON.stringify(data, null, 2), 'utf-8');
  console.log('latest.json actualizado →', OUT);
}

main().catch(e => { console.error(e); process.exit(1); });