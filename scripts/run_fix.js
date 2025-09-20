
// scripts/run_fix.js
// Post-processor for data/latest.json to ensure no neutral impacts and no broken teen strings.
const fs = require('fs');
const path = require('path');
const { classify, fillSource } = require('./impact_rules_v3');

const KEYS = ['cataluna','espana','rioja','background','deportes','radios','blocksOut'];

function normalizeTeen(s){
  if(!s) return '';
  // Remove broken unicode leftovers like "A     , ."
  s = s.replace(/A\s+,?\s+\.\s*/g,'').trim();
  // Remove multiple spaces
  s = s.replace(/\s{2,}/g,' ');
  // Strip neutral phrase
  s = s.replace(/sin efecto directo en tu d[ií]a a d[ií]a\.?/i,'');
  return s.trim();
}

function ensureImpact(item){
  // If all three missing or neutral, classify
  const isNeutral = (v)=> !v || /sin efecto directo en tu d[ií]a a d[ií]a/i.test(v);
  if (isNeutral(item.impact) && isNeutral(item.impact_adult) && isNeutral(item.impact_teen)) {
    const c = classify(item);
    item.tag = c.tag;
    item.severity = c.severity;
    item.horizon = c.horizon;
    item.action = c.action;
    item.impact = c.impact_adult;
    item.impact_adult = c.impact_adult;
    item.impact_teen = c.impact_teen;
  } else {
    // Patch individually if any field is neutral/broken
    const c = classify(item);
    if (isNeutral(item.impact)) item.impact = c.impact_adult;
    if (isNeutral(item.impact_adult)) item.impact_adult = c.impact_adult;
    if (isNeutral(item.impact_teen)) item.impact_teen = c.impact_teen;
    // Ensure meta present
    if (!item.tag || item.tag==='otros') item.tag = c.tag;
    if (item.severity==null || item.severity===0) item.severity = c.severity;
    if (!item.horizon || item.horizon==='sin plazo') item.horizon = c.horizon;
    if (!item.action || item.action==='FYI' && c.action!=='FYI') item.action = c.action;
  }

  // Final teen normalization
  item.impact_teen = normalizeTeen(item.impact_teen);
  item.impact = item.impact && item.impact.trim() ? item.impact : item.impact_adult;
  item.impact_adult = item.impact_adult && item.impact_adult.trim() ? item.impact_adult : item.impact;
  // Always ensure no neutrals remain
  const neutralRegex = /sin efecto directo en tu d[ií]a a d[ií]a/i;
  for (const f of ['impact','impact_adult','impact_teen']) {
    if (neutralRegex.test(item[f]||'')) {
      const c = classify(item);
      item[f] = f==='impact_teen' ? c.impact_teen : c.impact_adult;
    }
  }
  // Fill source if empty
  fillSource(item);
}

function processArray(arr){
  if(!Array.isArray(arr)) return 0;
  let changed = 0;
  for (const it of arr) {
    const before = JSON.stringify([it.impact,it.impact_adult,it.impact_teen,it.tag,it.severity,it.horizon,it.action]);
    ensureImpact(it);
    const after = JSON.stringify([it.impact,it.impact_adult,it.impact_teen,it.tag,it.severity,it.horizon,it.action]);
    if (before!==after) changed++;
  }
  return changed;
}

(function main(){
  const file = path.resolve('data/latest.json');
  if (!fs.existsSync(file)) {
    console.error('data/latest.json not found');
    process.exit(1);
  }
  const j = JSON.parse(fs.readFileSync(file,'utf8'));
  let totalChanged = 0;

  for (const k of KEYS) {
    if (k==='blocksOut') {
      const blocks = j[k]||{};
      for (const region of Object.keys(blocks)) {
        totalChanged += processArray(blocks[region]);
      }
      continue;
    }
    totalChanged += processArray(j[k]);
  }

  // Write back pretty
  fs.writeFileSync(file, JSON.stringify(j, null, 2), 'utf8');
  // Also write meta stats
  const stats = { updated_at: j.updated_at || new Date().toISOString(), changed: totalChanged };
  fs.writeFileSync('data/postfix_stats.json', JSON.stringify(stats, null, 2), 'utf8');
  console.log('Impacts fixed:', totalChanged);
})();
