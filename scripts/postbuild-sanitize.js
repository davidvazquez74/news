
/**
 * scripts/postbuild-sanitize.js
 * Post-procesa data/latest.json para arreglar mojibake (Â, Ã, â€œ, ï¸, ðŸ…)
 * Seguro: si algo falla, sale con código !=0 para que el workflow no publique.
 */
const fs = require("fs");
const path = require("path");

const BAD_PATTERN = /[ÂÃ](?![a-zA-Z])|â€œ|â€\u009d|ï¸|ðŸ/;

function fixText(s = "") {
  if (typeof s !== "string" || s.length === 0) return s;
  // si contiene rastros de mojibake, intentamos reconvertir
  if (BAD_PATTERN.test(s)) {
    try {
      // latin1 -> utf8 arregla casos típicos de mojibake
      return Buffer.from(s, "latin1").toString("utf8");
    } catch (e) {
      // último recurso: devuelve original
      return s;
    }
  }
  return s;
}

function sanitizeAny(node) {
  if (node == null) return node;
  if (typeof node === "string") return fixText(node);
  if (Array.isArray(node)) return node.map(sanitizeAny);
  if (typeof node === "object") {
    const out = {};
    for (const k of Object.keys(node)) {
      out[k] = sanitizeAny(node[k]);
    }
    return out;
  }
  return node;
}

(function main() {
  const infile = path.join("data","latest.json");
  if (!fs.existsSync(infile)) {
    console.error("latest.json not found, abort.");
    process.exit(2);
  }

  const raw = fs.readFileSync(infile, "utf8");
  let json;
  try {
    json = JSON.parse(raw);
  } catch (e) {
    console.error("Invalid JSON in latest.json:", e.message);
    process.exit(2);
  }

  const before = JSON.stringify(json);
  const clean = sanitizeAny(json);
  const after  = JSON.stringify(clean);

  // escribe sólo si hay cambios
  if (before !== after) {
    fs.writeFileSync(infile, JSON.stringify(clean, null, 2), "utf8");
    console.log("Sanitized latest.json (UTF-8 fix applied).");
  } else {
    console.log("No mojibake detected in latest.json.");
  }
})();
