// scripts/fetch_weather.js
// Fallback: escribe weather.json en español aunque falle la API remota
import fs from 'fs';

const WX_LAT = process.env.WX_LAT || "41.41";
const WX_LON = process.env.WX_LON || "2.02";
const WX_TZ  = process.env.WX_TZ  || "Europe/Madrid";

const out = {
  tempC: null,
  summary: "Clear",
  summary_es: "Despejado",
  icon: "Clear",
  updatedAt: new Date().toISOString(),
  source: "fallback"
};

fs.mkdirSync('data',{recursive:true});
fs.writeFileSync('data/weather.json', JSON.stringify(out,null,2), 'utf8');
console.log("weather.json (fallback) written:", {WX_LAT,WX_LON,WX_TZ});
