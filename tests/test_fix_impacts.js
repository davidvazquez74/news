// tests/test_fix_impacts.js
// Minimal tests (Node). Run: node tests/test_fix_impacts.js

import assert from 'assert';
import { applyNeutralEnhancer } from '../scripts/fix_impacts.js';

function makeItem(title, summary='', impact='Sin efecto directo en tu día a día.', teen='') {
  return { title, summary, impact, impact_adult: impact, impact_teen: teen };
}

// Declaración política
let item = makeItem('El ministro dice que revisará X');
item = applyNeutralEnhancer(item);
assert.ok(item.impact_teen.toLowerCase().includes('postureo') || item.impact_teen.includes('chill'));

// Trámite fiscal
item = makeItem('ERC registra ley para que Catalunya recaude IRPF');
item = applyNeutralEnhancer(item);
assert.ok(item.impact.toLowerCase().includes('trámite') || item.impact.toLowerCase().includes('podrían cambiar pagos'));

// Agenda
item = makeItem('Los Reyes inauguran exposición en Luxor');
item = applyNeutralEnhancer(item);
assert.ok(item.impact.toLowerCase().includes('agenda pública') || item.impact.toLowerCase().includes('sin efecto práctico'));

// Defensa informativa
item = makeItem('España envía tres cazas A-400 a ejercicio OTAN');
item = applyNeutralEnhancer(item);
assert.ok(item.impact.toLowerCase().includes('defensa'));

console.log('OK: basic enhancer tests passed.');