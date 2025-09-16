
import fs from 'fs';
import path from 'path';
import Parser from 'rss-parser';

const parser = new Parser({ timeout: 15000 });
const ROOT = process.cwd();
const SOURCES_PATH = path.join(ROOT, 'data', 'sources.json');
const OUT_PATH = path.join(ROOT, 'data', 'latest.json');

const now = new Date();
const cutoffMs = 1000 * 60 * 60 * 48; // 48h
const cutoff = new Date(Date.now() - cutoffMs);

const sleep = (ms)=>new Promise(r=>setTimeout(r,ms));

function iso(d){ try{ return new Date(d).toISOString(); } catch { return new Date().toISOString(); } }

async function fetchFeed(url){
  try {
    const feed = await parser.parseURL(url);
    return feed.items || [];
  } catch (e) {
    console.error('Feed error:', url, e.message);
    return [];
  }
}

function pickImpact(title=''){
  title = title.toLowerCase();
  if (title.includes('gas') || title.includes('petrol') || title.includes('petróleo') || title.includes('oil')) return 'Puede afectar precios de gasolina y transporte.';
  if (title.includes('huelga') || title.includes('paro')) return 'Podría impactar horarios y servicios.';
  if (title.includes('lluvia') || title.includes('tormenta') || title.includes('dana') ) return 'Planifica desplazamientos: posibles cortes y retrasos.';
  if (title.includes('tren') || title.includes('metro') || title.includes('rodalies')) return 'Más/menos frecuencias y cambios de horario si usas transporte público.';
  if (title.includes('alquiler') || title.includes('hipoteca')) return 'Puede afectar tu alquiler o hipoteca.';
  return '';
}

function cleanItem(it, sourceName){
  const title = (it.title || '').trim();
  const url = (it.link || it.guid || '').trim();
  const published_at = iso(it.isoDate || it.pubDate || new Date());
  const summary = (it.contentSnippet || it.content || it.summary || '').replace(/\s+/g,' ').trim().slice(0, 280);
  return {
    title,
    summary,
    impact: pickImpact(title),
    source: sourceName,
    url,
    published_at
  };
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
    await sleep(800); // be gentle
  }
  // sort by recency, unique by url
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
