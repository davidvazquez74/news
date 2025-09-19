// scripts/fetch_weather.js — servidor (workflow) con textos en español
import fs from 'fs';
import path from 'path';

const LAT = parseFloat(process.env.WX_LAT || '41.41');
const LON = parseFloat(process.env.WX_LON || '2.02');
const TZ  = process.env.WX_TZ || 'Europe/Madrid';

const DATA_DIR = path.join(process.cwd(), 'data');
const OUT_PATH = path.join(DATA_DIR, 'weather.json');

const WMO_ES = {
  0:  { summary: 'Soleado',     icon: 'Soleado' },
  1:  { summary: 'Despejado',   icon: 'Despejado' },
  2:  { summary: 'Nubes',       icon: 'Nubes' },
  3:  { summary: 'Nubes',       icon: 'Nubes' },
  45: { summary: 'Niebla',      icon: 'Niebla' },
  48: { summary: 'Niebla',      icon: 'Niebla' },
  51: { summary: 'Llovizna',    icon: 'Llovizna' },
  53: { summary: 'Llovizna',    icon: 'Llovizna' },
  55: { summary: 'Llovizna',    icon: 'Llovizna' },
  61: { summary: 'Lluvia',      icon: 'Lluvia' },
  63: { summary: 'Lluvia',      icon: 'Lluvia' },
  65: { summary: 'Lluvia',      icon: 'Lluvia' },
  66: { summary: 'Lluvia',      icon: 'Lluvia' },
  67: { summary: 'Lluvia',      icon: 'Lluvia' },
  71: { summary: 'Nieve',       icon: 'Nieve' },
  73: { summary: 'Nieve',       icon: 'Nieve' },
  75: { summary: 'Nieve',       icon: 'Nieve' },
  77: { summary: 'Nieve',       icon: 'Nieve' },
  80: { summary: 'Lluvia',      icon: 'Lluvia' },
  81: { summary: 'Lluvia',      icon: 'Lluvia' },
  82: { summary: 'Lluvia',      icon: 'Lluvia' },
  85: { summary: 'Nieve',       icon: 'Nieve' },
  86: { summary: 'Nieve',       icon: 'Nieve' },
  95: { summary: 'Tormenta',    icon: 'Tormenta' },
  96: { summary: 'Tormenta',    icon: 'Tormenta' },
  99: { summary: 'Tormenta',    icon: 'Tormenta' }
};

async function main(){
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,weather_code&timezone=${encodeURIComponent(TZ)}`;
  const r = await fetch(url, { headers: { 'User-Agent': 'news-app-ci/1.0' }});
  if (!r.ok) throw new Error(`Open‑Meteo HTTP ${r.status}`);
  const j = await r.json();
  const curr = j.current || j.current_weather || {};
  const tempC = typeof curr.temperature_2m === 'number' ? curr.temperature_2m :
                typeof curr.temperature === 'number' ? curr.temperature : null;
  const code  = typeof curr.weather_code === 'number' ? curr.weather_code : null;
  const map   = (code!=null && WMO_ES[code]) ? WMO_ES[code] : { summary: 'Despejado', icon:'Despejado' };

  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  const out = {
    tempC: (tempC!=null)?Math.round(tempC):null,
    summary: map.summary,
    icon: map.icon,
    updatedAt: new Date().toISOString(),
    source: 'open-meteo'
  };
  fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2), 'utf-8');
  console.log('weather.json actualizado (ES) →', OUT_PATH, out);
}

main().catch(e => { console.error(e); process.exit(1); });
