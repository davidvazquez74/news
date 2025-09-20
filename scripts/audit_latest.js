
// scripts/audit_latest.js
// Quick audit: counts by tag and neutrals remaining.
const fs = require('fs');
const path = require('path');

function countItems(arr, acc){
  if(!Array.isArray(arr)) return;
  for(const it of arr){
    const tag = it.tag || 'sin_tag';
    acc.tags[tag] = (acc.tags[tag]||0)+1;
    for(const f of ['impact','impact_adult','impact_teen']){
      const v = (it[f]||'').toLowerCase();
      if (/sin efecto directo en tu d[ií]a a d[ií]a/.test(v)) acc.neutrals++;
    }
  }
}

(function(){
  const file = path.resolve('data/latest.json');
  if(!fs.existsSync(file)){ console.error('data/latest.json missing'); process.exit(1); }
  const j = JSON.parse(fs.readFileSync(file,'utf8'));
  const acc = { tags:{}, neutrals:0 };
  for(const k of ['cataluna','espana','rioja','background']){
    countItems(j[k], acc);
  }
  if (j.blocksOut){
    for(const region of Object.keys(j.blocksOut)){
      countItems(j.blocksOut[region], acc);
    }
  }
  console.log('Tag counts:', acc.tags);
  console.log('Neutral phrases remaining:', acc.neutrals);
})();
