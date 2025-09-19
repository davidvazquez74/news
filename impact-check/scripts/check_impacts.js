// impact-check/scripts/check_impacts.js
import fs from "fs";

const LATEST = "data/latest.json";
if (!fs.existsSync(LATEST)) {
  console.error("❌ No existe data/latest.json");
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(LATEST, "utf-8"));
let missing = [];

function checkBlock(name, arr) {
  if (!Array.isArray(arr)) return;
  arr.forEach((item, i) => {
    const impactA = item.impact_adult || item.impact || "";
    const impactT = item.impact_teen || "";
    if (!impactA && !impactT) {
      missing.push(`${name}[${i}] → "${item.title}"`);
    }
  });
}

checkBlock("cataluna", data.cataluna);
checkBlock("espana", data.espana);
checkBlock("rioja", data.rioja);
checkBlock("background", data.background);

if (missing.length) {
  console.error("⚠️ Noticias SIN impacto:");
  missing.forEach(x => console.error(" - " + x));
  process.exit(2);
} else {
  console.log("✅ Todos los ítems tienen impactos.");
}
