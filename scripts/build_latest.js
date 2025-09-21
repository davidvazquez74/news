/**
 * scripts/build_latest.js
 * - Asegura data/latest.json (o crea scaffold si falta)
 * - Normaliza claves de blocksOut (España/LaRioja/etc)
 * - Copia a latest.json en raíz para servir en GitHub Pages
 */
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'latest.json');
const ROOT_LATEST = path.join(process.cwd(), 'latest.json');

function safeReadJSON(file){
  try{
    const raw = fs.readFileSync(file,'utf8');
    return JSON.parse(raw);
  }catch(e){ return null; }
}

function writeJSON(file, obj){
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(obj, null, 2), 'utf8');
}

function normalizeBlocksOutKeys(obj){
  if (!obj.blocksOut) return obj;
  const bo = obj.blocksOut;
  const fixed = {};
  Object.keys(bo).forEach(k=>{
    // Normalizar claves potencialmente mal-encodeadas
    const map = {
      'EspaÃ±a': 'España',
      'LaRioja': 'LaRioja',
      'Catalunya': 'Catalunya',
      'Global': 'Global',
      'MolinsDeRei': 'MolinsDeRei',
      'España': 'España'
    };
    const key = map[k] || k;
    fixed[key] = bo[k];
  });
  obj.blocksOut = fixed;
  return obj;
}

function run(){
  let data = safeReadJSON(DATA_FILE);
  if (!data){
    // scaffold mínimo si no existe aún
    data = {
      updated_at: new Date().toISOString(),
      cataluna: [], espana: [], rioja: [], background: [],
      deportes: [], radios: [],
      blocksOut: { Catalunya: [], España: [], MolinsDeRei: [], LaRioja: [], Global: [] },
      version: 'ci', commit: process.env.GITHUB_SHA ? process.env.GITHUB_SHA.slice(0,7) : 'local'
    };
  } else {
    data.updated_at = new Date().toISOString();
  }

  data = normalizeBlocksOutKeys(data);

  writeJSON(DATA_FILE, data);
  writeJSON(ROOT_LATEST, data);

  console.log('latest.json actualizado en data/ y raíz.');
}

run();
