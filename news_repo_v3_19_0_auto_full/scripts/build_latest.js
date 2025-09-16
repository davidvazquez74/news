
import fs from 'fs';
import path from 'path';
import Parser from 'rss-parser';

const parser = new Parser({ timeout: 15000 });
const ROOT = process.cwd();
const SOURCES_PATH = path.join(ROOT, 'data', 'sources.json');
const OUT_PATH = path.join(ROOT, 'data', 'latest.json');

const cutoffMs = 1000 * 60 * 60 * 48; // 48h
const cutoff = new Date(Date.now() - cutoffMs);

function iso(d){ try{ return new Date(d).toISOString(); } catch { return new Date().toISOString(); } }

async function fetchFeed(url){
  try{
    const feed = await parser.parseURL(url);
    return feed.items || [];
  }catch(e){
    console.error('Feed error:', url, e.message);
    return [];
  }
}

function pickImpact(title=''){
  const t = title.toLowerCase();
  if (t.includes('huelga')||t.includes('paro')) return 'Tu transporte o servicios pueden verse alterados.';
  if (t.includes('lluvia')||t.includes('dana')||t.includes('tormenta')) return 'Planifica desplazamientos: posibles cortes y retrasos.';
  if (t.includes('gas')||t.includes('petróleo')||t.includes('oil')) return 'Posible subida de gasolina y transporte.';
  if (t.includes('alquiler')||t.includes('hipoteca')) return 'Puede afectar a tu alquiler o hipoteca.';
  return '';
}

function clean(it, src){
  const title=(it.title||'').trim();
  const url=(it.link||it.guid||'').trim();
  const published_at=iso(it.isoDate||it.pubDate||Date.now());
  const summary=(it.contentSnippet||it.content||it.summary||'').replace(/\s+/g,' ').trim().slice(0,280);
  return {title, summary, impact:pickImpact(title), source:src, url, published_at};
}

async function gather(list){
  const out=[];
  for(const s of list){
    const items=await fetchFeed(s.rss);
    for(const it of items){
      const d = new Date(it.isoDate||it.pubDate||Date.now());
      if(d >= cutoff) out.push(clean(it, s.name));
    }
  }
  out.sort((a,b)=> new Date(b.published_at)-new Date(a.published_at));
  const seen=new Set(); const uniq=[];
  for(const n of out){ if(!n.url || seen.has(n.url)) continue; seen.add(n.url); uniq.push(n); if(uniq.length>=6) break; }
  return uniq;
}

async function main(){
  const cfg = JSON.parse(fs.readFileSync(SOURCES_PATH,'utf-8'));
  const data = { updated_at:new Date().toISOString(), cataluna:[], espana:[], rioja:[], background:[] };
  data.cataluna = await gather(cfg.cataluna||[]);
  data.espana   = await gather(cfg.espana||[]);
  data.rioja    = await gather(cfg.rioja||[]);
  data.background = await gather(cfg.background||[]);
  fs.writeFileSync(OUT_PATH, JSON.stringify(data,null,2), 'utf-8');
  console.log('latest.json written.');
}
main().catch(e=>{ console.error(e); process.exit(1); });
