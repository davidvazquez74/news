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

// ---------- Frescura ----------
const MAX_DAYS = 10; // admite noticias de hasta 10 días
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
  // tolerancia +3h por TZs/servidores
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

// ---------- Glosario (breve) ----------
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

// ---------- Impacto (reglas mejoradas; sin plantillas genéricas) ----------
const BANNED = [
  'seguimiento recomendado',
  'pendiente de evolución',
  'podría notarse en facturas o movilidad',
  'apps y servicios pueden cambiar reglas y permisos'
];
const notGeneric = (s='') => s && s.length > 12 && !BANNED.some(b => lc(s).includes(b));

function impactAdultFrom(title = '', summary = '') {
  const t = (title + ' ' + summary).toLowerCase();

  // Economía / hipotecas
  if (/(eur[íi]bor|bce|tipos de inter[eé]s|hipoteca)/.test(t))
    return 'Si tu hipoteca es variable, la cuota puede moverse en próximas revisiones.';

  // Combustibles / energía
  if (/(gasolina|di[eé]sel|petr[óo]leo|carburante|combustible|gas|electricidad|energ[íi]a)/.test(t))
    return 'Vigila precios en surtidor y facturas: podrían moverse estos días.';

  // Transporte / huelgas / aeropuertos
  if (/(huelga|paro|paros)/.test(t) && /(tren|metro|bus|rodalies|renfe|aeropuerto|vuelo|taxis?)/.test(t))
    return 'Revisa horarios y alternativas: puede haber retrasos o servicios mínimos.';

  // Vivienda / empleo / salarios
  if (/(alquiler|vivienda|vpo|hipoteca|salario|smi|empleo|paro\b)/.test(t))
    return 'Posibles cambios en vivienda o nómina; revisa condiciones y plazos.';

  // Impuestos / ayudas / tasas
  if (/(impuesto|iva|tasas?|bono|subsidio|deducci[oó]n)/.test(t))
    return 'Puede variar lo que pagas o recibes; revisa facturas, requisitos y fechas.';

  // IA y tech (solo si se menciona explícitamente)
  if (/\b(inteligencia artificial|ia\b|ai act|algoritmo|modelos? de ia)\b/.test(t))
    return 'Servicios con IA pueden cambiar avisos y permisos por nuevas normas.';

  // Clima / tiempo severo
  if (/(dana|tempor(al|ada)|lluvias intensas|olas? de calor|fr[ií]o|viento fuerte|inundaciones?)/.test(t))
    return 'Ajusta planes y desplazamientos; revisa alertas y previsión local.';

  // Sanidad / educación
  if (/(sanidad|salud|vacunas?|lista de espera|colegios?|universidad|matr[ií]cula|becas?)/.test(t))
    return 'Puede afectar a citas, trámites o calendarios; consulta tu centro o web oficial.';

  // Política / normativa (sin IA)
  if (/(decreto|ley|normativa|boe|parlamento|congreso|senado|gobierno|generalitat|ayuntamiento)/.test(t))
    return 'Cambios normativos: comprueba si impactan en tu actividad o trámites.';

  // Sucesos / tribunales / accidentes → no generalizar
  if (/(cad[aá]ver|homicidio|accidente|incendio|tribunal|juzgado|detenci[oó]n|agresi[oó]n)/.test(t))
    return '';

  // Deportes / ocio
  if (/(liga|champions|concierto|festival|entradas|taquilla)/.test(t))
    return 'Impacto puntual en planes y tráfico de la zona durante el evento.';

  return ''; // mejor vacío que frase robot
}

function impactTeenFrom(title = '', summary = '') {
  const t = (title + ' ' + summary).toLowerCase();

  if (/(eur[íi]bor|bce|tipos|hipoteca)/.test(t))
    return 'Si en casa hay hipoteca variable, la letra puede cambiar. 💶';
  if (/(gasolina|di[eé]sel|petr[óo]leo|carburante|combustible|gas|electricidad)/.test(t))
    return 'Depósito y facturas pueden subir un poco → planes más caros. ⛽';
  if (/(huelga|paro|paros)/.test(t) && /(tren|metro|bus|rodalies|renfe|aeropuerto|vuelo|taxis?)/.test(t))
    return 'Ojito con el metro/tren: retrasos y tocar madrugar. 🚌';
  if (/(alquiler|vivienda|vpo|salario|smi|empleo)/.test(t))
    return 'Pisos/curro: pueden cambiar precios o condiciones. 🏠';
  if (/(impuesto|iva|tasas?|bono|subsidio|deducci[oó]n)/.test(t))
    return 'Cosas más caras o cambios en ayudas; pregunta en casa. 🧾';
  if (/\b(inteligencia artificial|ia\b|ai act|algoritmo|modelos? de ia)\b/.test(t))
    return 'Apps con IA con más normas y avisos; alguna función cambia. 📱';
  if (/(dana|temporal|lluvias intensas|ola de calor|fr[ií]o|viento|inundaciones?)/.test(t))
    return 'Plan B para entrenos/planes: tiempo chungo. 🌧️';
  if (/(sanidad|vacunas?|colegios?|universidad|matr[ií]cula|becas?)/.test(t))
    return 'Fechas y trámites pueden moverse: revisa el centro. 📅';
  if (/(liga|champions|concierto|festival|entradas)/.test(t))
    return 'Más gente y tráfico cerca del evento; llega con margen. 🎟️';

  if (/(cad[aá]ver|homicidio|accidente|incendio|tribunal|juzgado|detenci[oó]n|agresi[oó]n)/.test(t))
    return '';

  return '';
}

// ---------- Normalización ----------
function normalizeItem(it, srcName) {
  const title = clean(it.title);
  const url = clean(it.link || it.guid || '');
  const published_at = iso(it.isoDate || it.pubDate || null);
  const summary = clean(it.contentSnippet || it.summary || it.content || '');

  const impact_adult = impactAdultFrom(title, summary);
  const impact_teen  = impactTeenFrom(title, summary);
  const impact = notGeneric(impact_adult) ? impact_adult : ''; // compat con frontend

  return {
    title, url, source: srcName, published_at, summary,
    impact,
    impact_adult: impact,
    impact_teen: notGeneric(impact_teen) ? impact_teen : '',
    glossary: glossaryText(`${title} ${summary}`)
  };
}

// ---------- Consensus helpers ----------
function normalizeTitleKey(title=''){
  return title
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g,' ')
    .trim();
}

// Aplica consenso por título (aparece en ≥ consensus fuentes del bloque) y recorta a maxItems
function applyConsensus(rows = [], consensus = 2, maxItems = 3) {
  const map = new Map(); // key -> {item, count, latest, sources:Set}
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
      if (ts > prev.latest) {
        prev.item = r; prev.latest = ts;
      }
    }
  }
  const eligible = [...map.values()]
    .filter(x => x.count >= consensus)
    .sort((a,b) => b.latest - a.latest)
    .map(x => x.item);

  // dedupe adicional por URL/título y recorte final
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
    // pequeño respiro para no saturar servidores
    await new Promise(r => setTimeout(r, 300));
  }
  return rows;
}

// ---------- Main ----------
async function main() {
  if (!fs.existsSync(SOURCES_PATH)) {
    throw new Error(`No existe ${SOURCES_PATH}. Crea data/sources.json con tus feeds.`);
  }
  const src = JSON.parse(fs.readFileSync(SOURCES_PATH, 'utf-8'));

  // Cargar previo para fallback
  const prev = fs.existsSync(OUT_PATH) ? JSON.parse(fs.readFileSync(OUT_PATH, 'utf-8')) : null;

  // Helper para construir cada bloque con consenso y límites
  async function buildBlock(blockName) {
    const def = src[blockName];
    if (!def || !Array.isArray(def.feeds)) return [];
    const rows = await collectFromFeeds(def.feeds);
    console.log(`block "${blockName}" raw items: ${rows.length}`);
    const out = applyConsensus(rows, def.consensus ?? 2, def.maxItems ?? 3);
    console.log(`block "${blockName}" after consensus(${def.consensus}) & maxItems(${def.maxItems}): ${out.length}`);
    return out;
  }

  // Construcción por bloques
  const catalunya = await buildBlock('Catalunya');
  const espana = await buildBlock('España');
  const molins = await buildBlock('MolinsDeRei');
  const rioja = await buildBlock('LaRioja');
  const global = await buildBlock('Global');

  // Fallback: si un bloque queda vacío, conserva el último bueno
  function keepPrevIfEmpty(currentArr, prevKey) {
    if ((!currentArr || currentArr.length === 0) && prev && Array.isArray(prev[prevKey]) && prev[prevKey].length) {
      console.log(`⚠️ keep previous for section: ${prevKey} (no fresh items)`);
      return prev[prevKey];
    }
    return currentArr;
  }

  // Compatibilidad con tu frontend actual:
  // cataluna, espana, rioja, background (y además exponemos los bloques nuevos)
  const outCompat = {
    updated_at: new Date().toISOString(),
    cataluna: keepPrevIfEmpty(catalunya, 'cataluna'),
    espana: keepPrevIfEmpty(espana, 'espana'),
    rioja: keepPrevIfEmpty(rioja, 'rioja'),
    background: keepPrevIfEmpty(global, 'background')
  };

  // Añadimos bloque MolinsDeRei en estructura complementaria (por si quieres usarlo en el front en el futuro)
  const blocksOut = {
    Catalunya: catalunya,
    España: espana,
    MolinsDeRei: molins,
    LaRioja: rioja,
    Global: global
  };

  const finalOut = { ...outCompat, blocksOut };

  fs.writeFileSync(OUT_PATH, JSON.stringify(finalOut, null, 2), 'utf-8');

  const counts = {
    cataluna: finalOut.cataluna?.length || 0,
    espana: finalOut.espana?.length || 0,
    rioja: finalOut.rioja?.length || 0,
    background: finalOut.background?.length || 0,
    MolinsDeRei: blocksOut.MolinsDeRei?.length || 0
  };
  console.log('latest.json actualizado →', OUT_PATH, '\ncounts:', counts);
}

main().catch(e => { console.error(e); process.exit(1); });
