// scripts/build_latest.js
// Build "defensivo": asegura latest.json válido y publicado en data/ y raíz.
// - Si data/latest.json está vacío, intenta poblar desde blocksOut (aceptando "España"/"EspaÃ±a").
// - Escribe SIEMPRE a data/latest.json y a /latest.json (para que la app encuentre uno u otro).

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_LATEST = path.join(DATA_DIR, 'latest.json');
const ROOT_LATEST = path.join(process.cwd(), 'latest.json');

function readJsonSafe(p){
  try {
    if (!fs.existsSync(p)) return null;
    const txt = fs.readFileSync(p, 'utf8');
    if (!txt.trim()) return null;
    return JSON.parse(txt);
  } catch(e){
    console.warn(`[build_latest] No pude leer ${p}:`, e.message);
    return null;
  }
}

function writeJson(p, obj){
  const txt = JSON.stringify(obj, null, 2);
  fs.writeFileSync(p, txt, 'utf8');
  console.log(`[build_latest] escrito ${p} (${txt.length} bytes)`);
}

function mapFromBlocks(arr){
  return (arr || []).map(n => ({
    title: n.title,
    url: n.url,
    source: n.source || '',
    published_at: n.published_at,
    summary: n.summary || '',
    impact: n.impact || 'FYI',
    impact_adult: n.impact_adult || n.impact || 'FYI',
    impact_teen: n.impact_teen || n.impact || 'FYI',
    tag: n.tag || 'otros',
    severity: (n.severity !== undefined ? n.severity : 0),
    horizon: n.horizon || 'sin plazo',
    action: n.action || 'FYI',
    img: n.img || ''
  }));
}

function normalize(raw){
  const nowIso = new Date().toISOString();
  const d = raw || {};

  const bo = d.blocksOut || {};
  const boCatalunya = bo.Catalunya || bo["Cataluña"] || bo["Cataluna"] || [];
  const boEspana    = bo["España"] || bo["Espana"] || bo["Espa\u00f1a"] || bo["EspaÃ±a"] || [];
  const boLaRioja   = bo.LaRioja || bo["La Rioja"] || [];
  const boGlobal    = bo.Global || bo["Mundo"] || [];
  const boMolins    = bo.MolinsDeRei || [];

  const cataluna  = Array.isArray(d.cataluna)  ? d.cataluna  : [];
  const espana    = Array.isArray(d.espana)    ? d.espana    : [];
  const rioja     = Array.isArray(d.rioja)     ? d.rioja     : [];
  const background= Array.isArray(d.background)? d.background: [];

  const out = {
    updated_at: d.updated_at || nowIso,
    version: d.version || 'ci',
    commit: d.commit || process.env.GITHUB_SHA?.slice(0,7) || 'local',
    cataluna:  cataluna.length   ? cataluna   : mapFromBlocks(boCatalunya),
    espana:    espana.length     ? espana     : mapFromBlocks(boEspana),
    rioja:     rioja.length      ? rioja      : mapFromBlocks(boLaRioja),
    background:background.length ? background : mapFromBlocks(boGlobal),
    deportes:  Array.isArray(d.deportes) ? d.deportes : [],
    radios:    Array.isArray(d.radios)   ? d.radios   : [],
    blocksOut: d.blocksOut || {}
  };

  return out;
}

(function main(){
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

  // Lee el existente (si hay)
  const seed = readJsonSafe(DATA_LATEST) || readJsonSafe(ROOT_LATEST) || {
    updated_at: new Date().toISOString(),
    version: 'seed',
    cataluna: [], espana: [], rioja: [], background: [],
    deportes: [], radios: [],
    blocksOut: { Catalunya:[], "España":[], LaRioja:[], MolinsDeRei:[], Global:[] }
  };

  const normalized = normalize(seed);

  // Publica en ambos sitios
  writeJson(DATA_LATEST, normalized);
  writeJson(ROOT_LATEST, normalized);
})();
