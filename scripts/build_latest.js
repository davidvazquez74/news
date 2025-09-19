// scripts/build_latest.js
// Node ESM
import fs from 'fs';
import path from 'path';
import Parser from 'rss-parser';

const ROOT = process.cwd();
const DATA = path.join(ROOT, 'data');
const SOURCES = path.join(DATA, 'sources.json');
const OUT = path.join(DATA, 'latest.json');
const META = path.join(DATA, 'meta.json');

const BUILD_VERSION = process.env.BUILD_VERSION || `v-dev.${Date.now()}`;
const GIT_SHA = process.env.GIT_SHA || 'local';

const MAX_DAYS = 7;
const MIN_YEAR = 2023;
const NOW = Date.now();
const CUTOFF = NOW - MAX_DAYS*24*60*60*1000;

const parser = new Parser({ timeout: 15000, maxRedirects: 3 });

const iso = d => { try{return new Date(d).toISOString();}catch{return null;} };
const lc = s => (s||'').toLowerCase();
const clean = s => (s||'').replace(/\s+/g,' ').trim();
const okDate = d => {
  if(!d) return false;
  const ts = new Date(d).getTime();
  if (Number.isNaN(ts)) return false;
  const y = new Date(d).getUTCFullYear();
  return y>=MIN_YEAR && ts>=CUTOFF && ts<= NOW + 3*60*60*1000;
};

// Glossary
function glossaryText(text=''){
  const pairs = [
    ['Euríbor','Índice que mueve hipotecas variables.'],
    ['BCE','Banco Central Europeo: decide tipos.'],
    ['inflación','Subida general de precios.'],
    ['arancel','Impuesto a importaciones.'],
    ['OTAN','Alianza militar euroatlántica.'],
    ['AI Act','Ley europea que regula la IA.']
  ];
  const low = lc(text);
  const hits = [];
  for (const [term,expl] of pairs) if (low.includes(lc(term))) hits.push({ term, expl });
  return hits;
}

// Impact rules (ampliadas + sin huecos vacíos)
const BANNED = ['seguimiento recomendado','pendiente de evolución'];
const notGeneric = s => s && s.length>10 && !BANNED.some(b => lc(s).includes(b));
const NEUTRAL = 'Sin efecto directo en tu día a día.';

function impactAdultFrom(title='', summary=''){
  const t = (title+' '+summary).toLowerCase();
  if (/(eur[íi]bor|bce|inter[eé]s|hipoteca|inflaci[oó]n)/.test(t)) return 'Si tu hipoteca es variable, revisa próximas cuotas.';
  if (/(gasolina|di[eé]sel|petr[óo]leo|carburante|combustible|electricidad|luz|gas)/.test(t)) return 'Atento a precios de energía y surtidor: pueden moverse estos días.';
  if (/(huelga|paros?)\b.*(tren|metro|bus|aeropuerto|vuelo|taxi|rodalies|renfe)/.test(t)) return 'Planifica desplazamientos: puede haber retrasos y servicios mínimos.';
  if (/(alquiler|vivienda|vpo|salario|smi|empleo|paro\b)/.test(t)) return 'Revisa condiciones de vivienda o nómina: podrían cambiar.';
  if (/(impuesto|iva|tasas?|bono|subsidio|deducci[oó]n)/.test(t)) return 'Comprueba facturas y plazos: puede variar lo que pagas o recibes.';
  if (/\b(inteligencia artificial|ia\b|ai act|algoritmo|ciberseguridad|brecha)\b/.test(t)) return 'Cambios en apps y avisos por nuevas normas o fallos de seguridad.';
  if (/(dana|temporal|lluvias intensas|ola de calor|fr[ií]o|viento|inundaciones?)/.test(t)) return 'Ajusta planes y consulta alertas oficiales en tu zona.';
  if (/(colegios?|universidad|matr[ií]cula|becas?|calendario escolar)/.test(t)) return 'Atento a fechas y trámites del centro educativo.';
  if (/(decreto|ley|normativa|boe|parlamento|congreso|senado|gobierno|generalitat|ayuntamiento)/.test(t)) return 'Cambios normativos: revisa si afectan a tus trámites.';
  if (/(liga|champions|concierto|festival|entradas|taquilla)/.test(t)) return 'Más tráfico y afluencia en la zona del evento.';
  if (/(tiktok|instagram|red(es)? sociales?)/.test(t)) return 'Posibles cambios en funciones o privacidad de la app.';
  if (/(internet|ca[ií]da de servicios|apag[oó]n|aver[ií]a)/.test(t)) return 'Servicios digitales pueden fallar: contempla alternativas.';
  return NEUTRAL;
}
function impactTeenFrom(title='', summary=''){
  const t = (title+' '+summary).toLowerCase();
  if (/(eur[íi]bor|bce|inter[eé]s|hipoteca|inflaci[oó]n)/.test(t)) return 'Si en casa hay hipoteca, la letra puede variar. 💶';
  if (/(gasolina|di[eé]sel|petr[óo]leo|carburante|combustible|electricidad|luz|gas)/.test(t)) return 'Gasolina y facturas se mueven: planes algo más caros. ⛽';
  if (/(huelga|paros?)\b.*(tren|metro|bus|aeropuerto|vuelo|taxi|rodalies|renfe)/.test(t)) return 'Ojito con el metro/tren: retrasos y madrugón. 🚌';
  if (/(alquiler|vivienda|vpo|salario|smi|empleo)/.test(t)) return 'Pisos/curro: pueden cambiar precios o condiciones. 🏠';
  if (/(impuesto|iva|tasas?|bono|subsidio|deducci[oó]n)/.test(t)) return 'Cosas más caras o ayudas distintas: pregunta en casa. 🧾';
  if (/\b(inteligencia artificial|ia\b|ai act|algoritmo|ciberseguridad|brecha)\b/.test(t)) return 'Apps con cambios o avisos; alguna función puede ir distinta. 📱';
  if (/(dana|temporal|lluvias intensas|ola de calor|fr[ií]o|viento|inundaciones?)/.test(t)) return 'Plan B para entrenos/planes: tiempo chungo. 🌧️';
  if (/(colegios?|universidad|matr[ií]cula|becas?|calendario escolar)/.test(t)) return 'Fechas y trámites pueden moverse: revisa el centro. 📅';
  if (/(liga|champions|concierto|festival|entradas|barça|real madrid)/.test(t)) return 'Más gente y tráfico: llega con margen si vas. 🎟️';
  if (/(tiktok|instagram|red(es)? sociales?)/.test(t)) return 'La app puede cambiar opciones o limitar cosas. 📲';
  if (/(internet|ca[ií]da de servicios|apag[oó]n|aver[ií]a)/.test(t)) return 'Se pueden caer apps/servicios: ten plan B. 🌐';
  return 'Sin efecto directo en tu día a día.';
}

function normalizeItem(it, src){
  const title = clean(it.title);
  const url = clean(it.link || it.guid || '');
  const published_at = iso(it.isoDate || it.pubDate || null);
  const summary = clean(it.contentSnippet || it.summary || it.content || '');
  let impact_adult = impactAdultFrom(title, summary);
  let impact_teen  = impactTeenFrom(title, summary);
  if (!notGeneric(impact_adult)) impact_adult = 'Sin efecto directo en tu día a día.';
  if (!notGeneric(impact_teen))  impact_teen  = 'Sin efecto directo en tu día a día.';
  return {
    title, url, source: src, published_at, summary,
    impact: impact_adult,
    impact_adult, impact_teen,
    glossary: glossaryText(`${title} ${summary}`)
  };
}

function normalizeTitleKey(title=''){
  return title.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
}
function dedupeByTitle(rows, limit){
  const seenU=new Set(), seenT=new Set(), out=[];
  for (const r of rows.filter(x=>x.published_at).sort((a,b)=>new Date(b.published_at)-new Date(a.published_at))){
    const u=r.url||''; const t=lc(r.title);
    if ((u && seenU.has(u)) || seenT.has(t)) continue;
    seenU.add(u); seenT.add(t); out.push(r);
    if (out.length>=limit) break;
  }
  return out;
}
function applyConsensus(rows=[], consensus=2, maxItems=3){
  const map=new Map();
  for(const r of rows){
    const key = normalizeTitleKey(r.title); if(!key) continue;
    const ts = r.published_at ? new Date(r.published_at).getTime() : 0;
    const prev = map.get(key);
    if(!prev){ map.set(key,{item:r,count:1,latest:ts,sources:new Set([r.source])}); }
    else{
      if(!prev.sources.has(r.source)){ prev.count+=1; prev.sources.add(r.source); }
      if(ts>prev.latest){ prev.item=r; prev.latest=ts; }
    }
  }
  const eligible = [...map.values()].filter(x=>x.count>=consensus).sort((a,b)=>b.latest-a.latest).map(x=>x.item);
  return dedupeByTitle(eligible, maxItems);
}

async function fetchFeed(url){
  try{
    const feed = await parser.parseURL(url);
    return feed.items || [];
  }catch(e){
    console.error('Feed error:', url, e.message);
    return [];
  }
}
async function collectFromFeeds(feeds=[]){
  const rows=[];
  for(const f of feeds){
    const items = await fetchFeed(f.url);
    for (const it of items){
      const n = normalizeItem(it, f.name);
      if(!n.published_at) continue;
      if(!okDate(n.published_at)) continue;
      rows.push(n);
    }
    await new Promise(r=>setTimeout(r,200));
  }
  return rows;
}

async function buildBlock(src, name){
  const def = src[name]; if(!def || !Array.isArray(def.feeds)) return [];
  const rows = await collectFromFeeds(def.feeds);
  return applyConsensus(rows, def.consensus ?? 2, def.maxItems ?? 3);
}

async function main(){
  if (!fs.existsSync(SOURCES)) throw new Error('Falta data/sources.json');
  const src = JSON.parse(fs.readFileSync(SOURCES,'utf-8'));
  const prev = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT,'utf-8')) : null;

  const catalunya = await buildBlock(src, 'Catalunya');
  const espana    = await buildBlock(src, 'España');
  const molins    = await buildBlock(src, 'MolinsDeRei');
  const rioja     = await buildBlock(src, 'LaRioja');
  const global    = await buildBlock(src, 'Global');
  const deportes  = await buildBlock(src, 'Deportes');
  const radios    = await buildBlock(src, 'Radios');

  function keep(prevKey, currentArr){
    if ((!currentArr || currentArr.length===0) && prev && Array.isArray(prev[prevKey]) && prev[prevKey].length){
      return prev[prevKey];
    }
    return currentArr;
  }

  const out = {
    updated_at: new Date().toISOString(),
    version: BUILD_VERSION,
    commit: GIT_SHA,
    cataluna:  keep('cataluna', catalunya),
    espana:    keep('espana', espana),
    rioja:     keep('rioja', rioja),
    background: keep('background', global),
    deportes:  keep('deportes', deportes),
    radios:    keep('radios', radios),
    blocksOut: { Catalunya: catalunya, España: espana, MolinsDeRei: molins, LaRioja: rioja, Global: global }
  };

  fs.writeFileSync(OUT, JSON.stringify(out,null,2),'utf-8');
  fs.writeFileSync(META, JSON.stringify({version:BUILD_VERSION,builtAt:new Date().toISOString(),commit:GIT_SHA},null,2),'utf-8');
  console.log('latest.json actualizado', BUILD_VERSION);
}
main().catch(e=>{ console.error(e); process.exit(1); });
