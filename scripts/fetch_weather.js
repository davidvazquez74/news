
// scripts/fetch_weather.js (placeholder compatible)
// Genera un weather.json mínimo si falla el fetch real.
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const OUT = path.join(DATA_DIR, 'weather.json');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const stamp = new Date().toISOString();
const fallback = {
  tempC: null,
  summary: "Despejado",
  icon: "Despejado",
  updatedAt: stamp,
  source: "fallback"
};

try {
  // Aquí podrías llamar a una API si dispones de clave
  fs.writeFileSync(OUT, JSON.stringify(fallback, null, 2), 'utf-8');
  console.log("weather.json OK (fallback)");
} catch (e) {
  console.error("weather.json error:", e.message);
  fs.writeFileSync(OUT, JSON.stringify(fallback, null, 2), 'utf-8');
}
