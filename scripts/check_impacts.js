// scripts/check_impacts.js
// Verifica que latest.json tenga impactos no vacíos y cumpla reglas básicas

import fs from "fs";

const latestPath = "data/latest.json";
if (!fs.existsSync(latestPath)) {
  console.error("❌ No existe data/latest.json");
  process.exit(1);
}

const raw = fs.readFileSync(latestPath, "utf-8");
const j = JSON.parse(raw);

const blocks = ["cataluna", "espana", "rioja", "background"];
let errors = 0;

for (const b of blocks) {
  const arr = j[b] || [];
  arr.forEach((n, i) => {
    const ai = n.impact_adult || "";
    const ti = n.impact_teen || "";
    if (!ai && !ti) {
      console.warn(`⚠️  ${b}[${i}] (${n.title?.slice(0,50)}...) SIN impacto`);
      errors++;
    }
  });
}

if (errors > 0) {
  console.error(`❌ Detectados ${errors} ítems sin impacto.`);
  process.exit(2);
} else {
  console.log("✅ Todos los ítems tienen impactos.");
}
