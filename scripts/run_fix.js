// scripts/run_fix.js
// Run this after your existing build step. It reads data/latest.json, enhances impacts, and writes back.
// Usage: node scripts/run_fix.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { applyNeutralEnhancer } from './fix_impacts.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const target = path.resolve(__dirname, '..', 'data', 'latest.json');
if (!fs.existsSync(target)) {
  console.error('data/latest.json not found at', target);
  process.exit(1);
}

const raw = fs.readFileSync(target, 'utf8');
let json;
try {
  json = JSON.parse(raw);
} catch (e) {
  console.error('Invalid JSON in data/latest.json:', e.message);
  process.exit(2);
}

const buckets = ['cataluna', 'espana', 'rioja', 'background', 'deportes', 'radios'];
let changed = 0;

for (const k of buckets) {
  if (Array.isArray(json[k])) {
    const before = JSON.stringify(json[k]);
    json[k] = json[k].map(applyNeutralEnhancer);
    const after = JSON.stringify(json[k]);
    if (before !== after) changed++;
  }
}

// write back atomically
const tmp = target + '.tmp';
fs.writeFileSync(tmp, JSON.stringify(json, null, 2), 'utf8');
fs.renameSync(tmp, target);
console.log('Fix applied. Buckets changed:', changed);