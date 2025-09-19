// scripts/build_latest.js
// Node ESM script
import fs from 'fs';
import Parser from 'rss-parser';
import { SOURCES } from './sources.js';
import { deriveImpact } from './impact_rules.js';

const parser = new Parser({
  timeout: 15000,
  headers: { 'User-Agent': 'news-bot/1.0 (+github actions)' }
});

function sanitize(s){
  return String(s||'').replace(/\s+/g,' ').trim();
}

function toItem(entry){
  const title = sanitize(entry.title);
  const url = entry.link || entry.guid || '';
  const source = sanitize(entry.creator || entry.author || entry.source || '');
  const published_at = entry.isoDate || entry.pubDate || new Date().toISOString();
  const summary = sanitize(entry.contentSnippet || entry.content || entry.summary || '');

  const imp = deriveImpact(title, summary);
  return {
    title, url, source, published_at, summary,
    impact: imp.adult_impact,
    impact_adult: imp.adult_impact,
    impact_teen: imp.teen_impact,
    tag: imp.tag, severity: imp.severity, horizon: imp.horizon, action: imp.action
  };
}

async function readFeed(url){
  try{
    const feed = await parser.parseURL(url);
    return (feed.items||[]).slice(0,8).map(toItem);
  }catch(e){
    console.warn('Feed fail', url, e.message);
    return [];
  }
}

async function pullAll(){
  const buckets = { cataluna:[], espana:[], rioja:[], background:[], deportes:[], radios:[] };
  for (const key of Object.keys(buckets)){
    const list = SOURCES[key] || [];
    for (const u of list){
      const got = await readFeed(u);
      buckets[key].push(...got);
      if (buckets[key].length >= 18) break;
    }
  }
  // Dedup by title+url
  const dedup = arr => {
    const seen = new Set(); const out = [];
    for (const it of arr){
      const k = (it.title||'') + '|' + (it.url||'');
      if (!seen.has(k)){ seen.add(k); out.push(it); }
    }
    return out.slice(0,24);
  };
  for (const k of Object.keys(buckets)) buckets[k] = dedup(buckets[k]);

  const out = {
    updated_at: new Date().toISOString(),
    version: process.env.BUILD_VERSION || "v-dev."+Date.now(),
    commit: process.env.GIT_SHA || "local",
    ...buckets,
    blocksOut: { Catalunya: buckets.cataluna, España: buckets.espana, MolinsDeRei: [], LaRioja: buckets.rioja, Global: buckets.background }
  };
  fs.mkdirSync('data', { recursive:true });
  fs.writeFileSync('data/latest.json', JSON.stringify(out, null, 2), 'utf8');
  fs.writeFileSync('data/meta.json', JSON.stringify({version: out.version, builtAt: out.updated_at, commit: out.commit}, null, 2), 'utf8');
  console.log('latest.json written OK');
}

await pullAll();
