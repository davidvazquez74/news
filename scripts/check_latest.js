const fs = require('fs');
const p = 'data/latest.json';
if (!fs.existsSync(p)) throw new Error('data/latest.json no existe');
const d = JSON.parse(fs.readFileSync(p,'utf8'));
const keys = ['cataluna','espana','rioja','background'];
if (!d.updated_at) throw new Error('updated_at faltante');
for (const k of keys) if (!Array.isArray(d[k])) throw new Error(`Campo ${k} no es array`);
const total = keys.reduce((n,k)=>n + d[k].length, 0);
console.log('OK latest.json – total items:', total);