/**
 * build_latest.js — valida/normaliza y garantiza data/latest.json y /latest.json
 */
const fs = require('fs');
const path = require('path');

const DATA_DIR   = path.join(process.cwd(), 'data');
const DATA_FILE  = path.join(DATA_DIR, 'latest.json');
const ROOT_FILE  = path.join(process.cwd(), 'latest.json');

function readJSON(p){ try{ return JSON.parse(fs.readFileSync(p,'utf8')); } catch { return null; } }
function writeJSON(p,o){ fs.mkdirSync(path.dirname(p),{recursive:true}); fs.writeFileSync(p, JSON.stringify(o,null,2),'utf8'); }

function scaffold(){
  return {
    updated_at: new Date().toISOString(),
    version: "local",
    cataluna: [], espana: [], rioja: [], background: [],
    deportes: [], radios: [],
    blocksOut: { Catalunya: [], España: [], LaRioja: [], MolinsDeRei: [], Global: [] }
  };
}

function normalize(data){
  const base = scaffold();
  const out = Object.assign(base, data||{});
  // asegura arrays
  for (const k of ['cataluna','espana','rioja','background','deportes','radios']) {
    if (!Array.isArray(out[k])) out[k] = [];
  }
  return out;
}

(function run(){
  let data = readJSON(DATA_FILE) || readJSON(ROOT_FILE) || scaffold();
  data = normalize(data);
  // fallback desde blocksOut si todo viene vacío
  const keys = ['cataluna','espana','rioja','background'];
  const total = keys.reduce((n,k)=>n + (Array.isArray(data[k])?data[k].length:0),0);
  if(total===0 && data.blocksOut){
    const map = { cataluna:'Catalunya', espana:'España', rioja:'LaRioja', background:'Global' };
    for (const k of keys){
      const bo = data.blocksOut[map[k]];
      if (Array.isArray(bo) && bo.length){
        data[k] = bo.map(n=>({
          title:String(n.title||'').trim(),
          url:n.url||'#',
          source:n.source||'',
          published_at:n.published_at||new Date().toISOString(),
          impact:n.impact||'',
          impact_teen:n.impact_teen||'',
          img:n.img||''
        }));
      }
    }
  }
  data.updated_at = new Date().toISOString();
  writeJSON(DATA_FILE, data);
  writeJSON(ROOT_FILE, data);
  console.log('OK: latest.json actualizado en data/ y raíz');
})();