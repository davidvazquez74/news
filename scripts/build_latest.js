// scripts/build_latest.js
import fs from 'fs';
import path from 'path';
import Parser from 'rss-parser';

const parser = new Parser({ timeout: 15000 });
const ROOT = process.cwd();
const SOURCES_PATH = path.join(ROOT, 'data', 'sources.json');
const OUT_PATH = path.join(ROOT, 'data', 'latest.json');

/** ==== CONFIGURACIÓN DE FRESCURA ==== */
const MAX_DAYS = 7;            // Solo noticias de los últimos 7 días
const MIN_YEAR = 2024;         // Blindaje anti-históricas
const PER_SECTION_LIMIT = 6;   // Máximo por sección

const now = Date.now();
const cutoff = now - MAX_DAYS * 24 * 60 * 60 * 1000;

/** ==== UTILIDADES ==== */
const iso = (d) => {
  try { return new Date(d).toISOString(); }
  catch { return null; }
};

const validDate = (d) => {
  if (!d) return false;
  const ts = new Date(d).getTime();
  if (Number.isNaN(ts)) return false;
  const year = new Date(d).getUTCFullYear();
  return (year >= MIN_YEAR) && (ts >= cutoff) && (ts <= now + 60 * 1000); // no futuro
};

const cleanText = (s) => (s || '').replace(/\s+/g, ' ').trim();

function detectGlossary(text = '') {
  const GLOSSARY = [
    ['BCE', 'Banco Central Europeo. Decide tipos de interés: afecta a hipotecas.'],
    ['Euríbor', 'Índice para hipotecas variables.'],
    ['inflación', 'Subida general de precios.'],
    ['AI Act', 'Ley europea que regula la IA por niveles de riesgo.'],
    ['OTAN', 'Alianza militar euroatlántica.'],
    ['DANA', 'Depresión Aislada: lluvias muy intensas.'],
    ['déficit', 'Cuando el Estado gasta más de lo que ingresa.'],
    ['arancel', 'Impuesto a productos importados.'],
    ['bono social', 'Descuento en energía para hogares vulnerables.'],
  ];
  const lc = text.toLowerCase();
  const hits = [];
  for (const [term, expl] of GLOSSARY) {
    if (lc.includes(term.toLowerCase())) hits.push({ term, expl });
  }
  return hits;
}

function naturalImpact({ title = '', summary = '' }) {
  const blob = `${title} ${summary}`.toLowerCase();
  if (/\bhuelga|par(o|os)\b/.test(blob) && /\bmetro|tren|rodalies|renfe|bus|aeropuerto|vuelo/.test(blob))
    return 'Si usas transporte público, revisa horarios: posibles retrasos o servicios mínimos.';
  if (/\bdana|lluvia(s)? torrencial(es)?|alerta (amarilla|naranja|roja)|temporal\b/.test(blob))
    return 'Planifica desplazamientos y comprueba alertas: puede haber cortes y retrasos.';
  if (/\bcrudo|petróleo|gasolina|di[eé]sel|refiner(í|i)a|oleoducto\b/.test(blob))
    return 'Puede encarecer el combustible y el transporte en las próximas semanas.';
  if (/\btipos de inter[eé]s|bce|eur[íi]bor\b/.test(blob))
    return 'Si tu hipoteca es variable, tu cuota puede moverse en próximas revisiones.';
  if (/\balquiler|hipoteca|vivienda|smi\b/.test(blob))
    return 'Impacto en bolsillo: alquiler/hipoteca o nómina pueden cambiar.';
  if (/\binteligencia artificial|ai act|algoritmo|modelo\b/.test(blob))
    return 'Apps y servicios pueden cambiar: más controles y transparencia.';
  if (/\bgaza|israel|ucrania|rusia|iran|yemen|mar rojo|otan\b/.test(blob))
    return 'Si viajas, atento a seguridad/vuelos; posible impacto en energía.';
  if (/\beleccion(es)?|presupuesto(s)?|decreto|impuesto(s)?\b/.test(blob))
    return 'Cambios normativos que pueden tocar trámites, ayudas o impuestos.';
  return 'Seguimiento recomendado: puede afectar a precios, servicios o movilidad si escala.';
}

function normalizeItem(it, sourceName) {
  const title = cleanText(it.title);
  const url = cleanText(it.link || it.guid || '');
  const published_at = iso(it.isoDate || it.pubDate || null);
  const summary = cleanText(it.contentSnippet || it.content || it.summary || '');

  return {
    title,
    url,
    source: sourceName,
    published_at,
    summary,
    impact: naturalImpact({ title, summary }),
    glossary: detectGlossary(`${title} ${summary}`),
  };
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

async function gatherSection(sources) {
  const rows = [];
  let total = 0, droppedOld = 0, droppedNoDate = 0, kept = 0;

  for (const src of (sources || [])) {
    const items = await fetchFeed(src.rss);
    for (const it of items) {
      total++;
      const n = normalizeItem(it, src.name);
      if (!n.published_at) { droppedNoDate++; continue; }
      if (!validDate(n.published_at)) { droppedOld++; continue; }
      rows.push(n);
    }
    // evitar ban por crawl agresivo
    await new Promise(r => setTimeout(r, 700));
  }

  // ordenar por fecha desc
  rows.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));

  // deduplicado por URL y por título (por si hay mirrors)
  const seenUrl = new Set();
  const seenTitle = new Set();
  const out = [];
  for (const r of rows) {
    const keyU = r.url || '';
    const keyT = r.title.toLowerCase();
    if ((keyU && seenUrl.has(keyU)) || seenTitle.has(keyT)) continue;
    seenUrl.add(keyU);
    seenTitle.add(keyT);
    out.push(r);
    if (out.length >= PER_SECTION_LIMIT) break;
  }

  kept = out.length;
  console.log(`[section] total=${total} kept=${kept} old=${droppedOld} nodate=${droppedNoDate}`);
  return out;
}

async function main() {
  const sources = JSON.parse(fs.readFileSync(SOURCES_PATH, 'utf-8'));
  const data = {
    updated_at: new Date().toISOString(),
    cataluna: [],
    espana: [],
    rioja: [],
    background: []
  };

  data.cataluna   = await gatherSection(sources.cataluna);
  data.espana     = await gatherSection(sources.espana);
  data.rioja      = await gatherSection(sources.rioja);
  data.background = await gatherSection(sources.background);

  // si algo se quedó vacío, lo dejamos vacío (mejor que rellenar con antiguas)
  fs.writeFileSync(OUT_PATH, JSON.stringify(data, null, 2), 'utf-8');
  console.log('latest.json written →', OUT_PATH);
}

main().catch(e => { console.error(e); process.exit(1); });
