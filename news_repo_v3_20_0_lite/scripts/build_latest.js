
import fs from 'fs';
import path from 'path';
import Parser from 'rss-parser';

const parser = new Parser({ timeout: 15000 });
const ROOT = process.cwd();
const SOURCES_PATH = path.join(ROOT, 'data', 'sources.json');
const OUT_PATH = path.join(ROOT, 'data', 'latest.json');

const cutoffMs = 1000 * 60 * 60 * 48; // 48h
const cutoff = new Date(Date.now() - cutoffMs);

// --- Dynamic glossary dictionary ---
const GLOSSARY = [
  ['BCE','Banco Central Europeo. Decide tipos de interés: afecta a hipotecas.'],
  ['Euríbor','Índice que usan muchos bancos para calcular hipotecas variables.'],
  ['inflación','Subida general de precios.'],
  ['AI Act','Ley europea que regula los riesgos de la inteligencia artificial.'],
  ['OTAN','Alianza militar de países de Europa y Norteamérica.'],
  ['DANA','Depresión Aislada en Niveles Altos: lluvias muy intensas.'],
  ['déficit','Cuando el Estado gasta más de lo que ingresa.'],
  ['arancel','Impuesto a productos importados.'],
  ['bono social','Descuento en factura de energía para hogares vulnerables.']
];

function detectGlossary(text){
  const hits = [];
  const lc = (text||'').toLowerCase();
  for (const [term, expl] of GLOSSARY){
    if (lc.includes(term.toLowerCase())){
      hits.push({ term, expl });
    }
  }
  return hits;
}

// --- Natural impact: small heuristics + tone curated ---
function naturalImpact(item){
  const t = (item.title||'').toLowerCase();
  const s = (item.summary||'').toLowerCase();
  const blob = `${t} ${s}`;

  // Transport / strikes
  if (/\bhuelga|par(o|os)\b/.test(blob) && /\bmetro|tren|rodalies|renfe|bus|aeropuerto|vuelo/.test(blob)){
    return 'Si usas transporte público, revisa horarios: posibles retrasos o servicios mínimos.';
  }
  // Weather / DANA
  if (/\bdana|lluvia(s)? torrencial(es)?|alerta (amarilla|naranja|roja)|temporal\b/.test(blob)){
    return 'Planifica desplazamientos y comprueba alertas: puede haber cortes de carretera y retrasos.';
  }
  // Energy / fuel
  if (/\bcrudo|petróleo|gasolina|di[eé]sel|refiner(í|i)a|oleoducto\b/.test(blob)){
    return 'Puede encarecer el combustible y el transporte en las próximas semanas.';
  }
  // Mortgages / BCE
  if (/\btipos de inter[eé]s|bce|eur[íi]bor\b/.test(blob)){
    return 'Si tu hipoteca es variable, tu cuota puede cambiar: ojo a próximas revisiones.';
  }
  // Housing
  if (/\balquiler|hipoteca|vivienda|smi\b/.test(blob)){
    return 'Impacto en bolsillo: alquiler/hipoteca o nómina pueden moverse.';
  }
  // Tech / AI
  if (/\binteligencia artificial|ai act|algoritmo|modelo\b/.test(blob)){
    return 'Apps y servicios que usas pueden cambiar: más controles y transparencia.';
  }
  // International conflict
  if (/\bgaza|israel|ucrania|rusia|iran|yemen|mar rojo|otan\b/.test(blob)){
    return 'Atento a vuelos/seguridad si viajas y a posibles subidas de energía.';
  }
  // Elections / policy
  if (/\beleccion(es)?|presupuesto(s)?|decreto|impuesto(s)?\b/.test(blob)){
    return 'Cambios normativos que pueden afectar trámites, ayudas o impuestos.';
  }
  // Default fallback
  return 'Seguimiento recomendado: puede afectar a precios, servicios o movilidad si escala.';
}

function cleanItem(it, sourceName){
  const title = (it.title || '').trim();
  const url = (it.link || it.guid || '').trim();
  const published_at = (it.isoDate || it.pubDate) ? new Date(it.isoDate || it.pubDate).toISOString() : new Date().toISOString();
  const summary = (it.contentSnippet || it.content || it.summary || '').replace(/\s+/g,' ').trim().slice(0, 300);

  const impact = naturalImpact({title, summary});
  const glossary = detectGlossary(`${title} ${summary}`);

  return {
    title, summary, impact, glossary,
    source: sourceName,
    url, published_at
  };
}

async function fetchFeed(url){
  try {
    const feed = await parser.parseURL(url);
    return feed.items || [];
  } catch (e) {
    console.error('Feed error:', url, e.message);
    return [];
  }
}

async function gatherSection(list){
  const out = [];
  for (const src of list){
    const items = await fetchFeed(src.rss);
    for (const it of items){
      const date = new Date(it.isoDate || it.pubDate || Date.now());
      if (date >= cutoff) {
        out.push(cleanItem(it, src.name));
      }
    }
    await new Promise(r=>setTimeout(r, 700));
  }
  out.sort((a,b)=> new Date(b.published_at) - new Date(a.published_at));
  const seen = new Set();
  return out.filter(n=>{
    if (!n.url || seen.has(n.url)) return false;
    seen.add(n.url);
    return true;
  }).slice(0, 6);
}

async function main(){
  const sources = JSON.parse(fs.readFileSync(SOURCES_PATH, 'utf-8'));
  const data = { updated_at: new Date().toISOString(), cataluna:[], espana:[], rioja:[], background:[] };

  data.cataluna = await gatherSection(sources.cataluna || []);
  data.espana   = await gatherSection(sources.espana   || []);
  data.rioja    = await gatherSection(sources.rioja    || []);
  data.background = await gatherSection(sources.background || []);

  fs.writeFileSync(OUT_PATH, JSON.stringify(data, null, 2), 'utf-8');
  console.log('latest.json written:', OUT_PATH);
}

main().catch(e=>{ console.error(e); process.exit(1); });
