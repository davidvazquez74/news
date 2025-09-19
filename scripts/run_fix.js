
// scripts/run_fix.js
// ESM module
import fs from "fs";
import { enhanceAll } from "./impact_rules_v2.js";

const path = "data/latest.json";

if (!fs.existsSync(path)) {
  console.error("latest.json not found at data/latest.json");
  process.exit(1);
}

const raw = fs.readFileSync(path, "utf8");
let json;
try {
  json = JSON.parse(raw);
} catch (e) {
  console.error("Invalid JSON in data/latest.json:", e.message);
  process.exit(1);
}

const enhanced = enhanceAll(json);
fs.writeFileSync(path, JSON.stringify(enhanced, null, 2), "utf8");

// Also touch meta with timestamp
const metaPath = "data/meta.json";
let meta = {};
try { meta = JSON.parse(fs.readFileSync(metaPath, "utf8")); } catch {}
meta.lastEnhancedAt = new Date().toISOString();
fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), "utf8");

console.log("Impacts enhanced ✔");
