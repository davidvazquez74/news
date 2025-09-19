
/**
 * scripts/check-mojibake.js
 * Frena el pipeline si aún hay mojibake tras el saneado.
 */
const fs = require("fs");
const path = require("path");

const infile = path.join("data","latest.json");
if (!fs.existsSync(infile)) {
  console.error("latest.json not found for guardrail.");
  process.exit(2);
}

const txt = fs.readFileSync(infile, "utf8");
// caracteres basura habituales cuando hay UTF-8 mal interpretado
const bad = /[ÂÃ](?![a-zA-Z])|â€œ|â€\u009d|ï¸|ðŸ/;
if (bad.test(txt)) {
  console.error("Mojibake detectado tras saneado: abortando commit.");
  process.exit(3);
}
console.log("Sin mojibake ✅");
