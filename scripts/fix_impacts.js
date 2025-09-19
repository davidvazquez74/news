// scripts/fix_impacts.js
// Enhances neutral/empty impacts so nothing stays empty or "Sin efecto..." without context.
// No external deps. ES module compatible (Node 18+).

export const has = (s, re) => re.test((s || '').toLowerCase());

export function classifyNeutralReason(item) {
  const t = `${item.title || ''} ${item.summary || ''}`.toLowerCase();

  const saysRe       = /\b(declar|asegur|replic|critic|defiend|promet|anuncia que|dice que)\b/;
  const approveRe    = /\b(apro(b|v)ad[oa]|entra en vigor|publica(do)? en (boe|doue)|sanciona|firma decreto)\b/;
  const startRe      = /\b(registra(n)? (propuesta|ley|p\/l)|proposición de ley|proposicion de ley|anteproyecto|consulta pública|consulta publica|enmiend|dictamen)\b/;
  const agendaRe     = /\b(visita|agenda|acto|recepci(ó|o)n|inaugur|audiencia|gira)\b/;
  const defenseRe    = /\b(otan|maniobras|ejercicio|cazas?|a-?400|fragata|flanco (este|oeste)|destacamento)\b/;
  const civilAlertRe = /\b(alerta|evacuaci(ó|o)n|confinamiento|cierre.*(vial|estaci(ó|o)n|aeropuerto)|suspensi(ó|o)n de (clases|servicios))\b/;
  const fiscalRe     = /\b(irpf|impuesto|tasa(s)?|tarifa(s)?|peaje(s)?|beca(s)?|subsidio(s)?|ayuda(s)?)\b/;

  if (has(t, defenseRe) && !has(t, civilAlertRe)) return 'defensa_info';
  if (has(t, agendaRe)  && !has(t, civilAlertRe)) return 'agenda';
  if (has(t, startRe)   && !has(t, approveRe))    return 'tramite';
  if (has(t, saysRe)    && !has(t, approveRe))    return 'declaracion';
  if (has(t, fiscalRe)  && has(t, startRe))       return 'fiscal_tramite';
  return null;
}

export function composeImpactFor(reason) {
  switch (reason) {
    case 'declaracion':
      return {
        adult: 'Seguimiento político: por ahora no cambia nada en trámites ni servicios.',
        teen:  'Tranqui bro, es postureo político hoy; nada te cambia 👌'
      };
    case 'tramite':
      return {
        adult: 'En trámite: si avanza, podría cambiar pagos/ayudas. Ojo a plazos más adelante.',
        teen:  'Work in progress: aún no te toca; si sale, tocará cartera 🧾'
      };
    case 'agenda':
      return {
        adult: 'Agenda pública: sin efecto práctico para tu día a día.',
        teen:  'Evento de foto, cero vibes para ti 😅'
      };
    case 'defensa_info':
      return {
        adult: 'Info de defensa: no afecta a trámites, vuelos o servicios.',
        teen:  'Es tema de militares, tú chill ✌️'
      };
    case 'fiscal_tramite':
      return {
        adult: 'Podrían cambiar pagos o ayudas si se aprueba; revisa facturas y requisitos cuando avance.',
        teen:  'Si esto sale, igual te sube/baja algo de pasta; por ahora nada 🧾'
      };
    default:
      return {
        adult: 'Sin cambios prácticos hoy.',
        teen:  'Todo chill, nada te afecta 😎'
      };
  }
}

export function ensureNonEmpty(text, fallback) {
  const clean = (text || '').trim();
  if (clean.length < 15) return fallback;
  // avoid broken leftovers like "A , ."
  const broken = /^[A-Za-zÁ-ú]?\s*,?\s*\.\s*[\p{Emoji_Presentation}\p{Emoji}]*$/u;
  if (broken.test(clean)) return fallback;
  return clean;
}

export function applyNeutralEnhancer(item) {
  const looksNeutralAdult = ((item.impact_adult || item.impact || '') + '').toLowerCase().includes('sin efecto directo')
                          || (item.impact_adult || '').trim() === ''
                          || (item.impact || '').trim() === '';
  const looksNeutralTeen  = (item.impact_teen || '').trim() === ''
                          || /A\s*,?\s*\.\s*|S\s*,?\s*\.\s*|P\s*,?\s*\./.test(item.impact_teen || '');

  if (!looksNeutralAdult && !looksNeutralTeen) return item;

  const reason = classifyNeutralReason(item) || 'default';
  const { adult, teen } = composeImpactFor(reason);

  if (looksNeutralAdult) {
    item.impact = adult;
    item.impact_adult = adult;
  }
  if (looksNeutralTeen) {
    item.impact_teen = teen;
  }

  item.impact_adult = ensureNonEmpty(item.impact_adult, 'Sin cambios prácticos hoy.');
  item.impact_teen  = ensureNonEmpty(item.impact_teen,  'Todo chill, nada te afecta 😎');

  // optional metadata for UI/filters
  item.tag = item.tag || reason;
  if (!item.severity) item.severity = 'low';
  if (!item.horizon)  item.horizon  = (reason === 'tramite' || reason === 'fiscal_tramite') ? 'weeks' : 'now';
  if (!item.action)   item.action   = (reason === 'tramite' || reason === 'fiscal_tramite') ? 'stay_tuned' : 'none';

  return item;
}

export function patchArray(arr = []){
  return arr.map(applyNeutralEnhancer);
}