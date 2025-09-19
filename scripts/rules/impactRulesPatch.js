// scripts/rules/impactRulesPatch.js
// Reglas de "cobertura mínima" + tono teen. No pisa tus reglas existentes;
// solo cubre vacíos o el neutro genérico.

import { cleanText } from "../utils/text.js";

const NEUTRALS = new Set([
  "Sin efecto directo en tu día a día.",
  "Sin efecto directo en tu día a día",
  "Sin efecto directo en tu d\u00eda a d\u00eda.",
  ""
]);

// Utilidades
const has = (txt, ...needles) => {
  const s = ` ${cleanText(txt).toLowerCase()} `;
  return needles.some(n => s.includes(` ${n.toLowerCase()} `) || s.includes(n.toLowerCase()));
};

function mk(res) {
  // Asegura límites de emojis (máx 2)
  const limitEmojis = s => {
    const parts = Array.from(s);
    let count = 0;
    return parts.map(ch => {
      const isEmoji = /\p{Extended_Pictographic}/u.test(ch);
      if (isEmoji) {
        if (count < 2) { count++; return ch; }
        return ""; // descarta extra
      }
      return ch;
    }).join("");
  };
  res.impact = cleanText(res.impact || "");
  res.impact_adult = cleanText(res.impact_adult || res.impact);
  res.impact_teen = limitEmojis(cleanText(res.impact_teen || res.impact));
  return res;
}

// Plantillas
const TEMPLATES = {
  defense: () => mk({
    impact: "Info de defensa/OTAN; no cambia nada en tu día a día ahora mismo.",
    impact_adult: "Info de defensa/OTAN; no cambia nada en tu día a día ahora mismo.",
    impact_teen: "Tema OTAN/defensa, chill: no te afecta al plan de hoy. 💬"
  }),
  royalty: () => mk({
    impact: "Acto institucional / protocolo; sin impacto práctico.",
    impact_adult: "Acto institucional / protocolo; sin impacto práctico.",
    impact_teen: "Evento royal de postureo. Cero vibes para hoy, bro. 😅"
  }),
  politics_talk: () => mk({
    impact: "Declaración o posicionamiento político; útil como contexto, sin trámites inmediatos.",
    impact_adult: "Declaración o posicionamiento político; útil como contexto, sin trámites inmediatos.",
    impact_teen: "Política hablando de política. Literal, nada que te cambie hoy. 💤"
  }),
  culture_generic: () => mk({
    impact: "Interés cultural; si te encaja, mira fechas y entradas.",
    impact_adult: "Interés cultural; si te encaja, mira fechas y entradas.",
    impact_teen: "Plan cultural chill. Si te mola, guarda fecha y listo. 🎟️"
  }),
  econ_tax: () => mk({
    impact: "Podrían cambiar pagos o ayudas; revisa facturas y requisitos.",
    impact_adult: "Podrían cambiar pagos o ayudas; revisa facturas y requisitos.",
    impact_teen: "Puede tocar cartera (pagos/ayudas). Ojo fechas, bro. 🧾"
  }),
  fallback: () => mk({
    impact: "Sin cambios prácticos hoy; guárdalo como contexto.",
    impact_adult: "Sin cambios prácticos hoy; guárdalo como contexto.",
    impact_teen: "Info útil pero cero impacto hoy. Tranquis. 🙂"
  }),
};

export function fillImpactsForItem(it) {
  const title = `${it.title || ""}`;
  const sum = `${it.summary || ""}`;
  const text = `${title} — ${sum}`;

  const emptyImpact = !it.impact || NEUTRALS.has(it.impact);
  const emptyAdult  = !it.impact_adult || NEUTRALS.has(it.impact_adult);
  const emptyTeen   = !it.impact_teen || NEUTRALS.has(it.impact_teen);

  if (!(emptyImpact || emptyAdult || emptyTeen)) return it; // ya tiene algo válido

  let tmpl = null;

  // Defensa / OTAN
  if (has(text, "OTAN", "Armada", "Ejército", "defensa", "NATO")) tmpl = TEMPLATES.defense();

  // Realeza / protocolo
  if (!tmpl && has(text, "Reyes", "Casa Real", "reina", "rey", "zarzuela")) tmpl = TEMPLATES.royalty();

  // Política sin norma (palabras de hablar/criticar/anunciar sin BOE/ley)
  if (!tmpl && has(text, "declaró", "afirmó", "replica", "acusó", "compareció", "llamadas", "defiende")) {
    tmpl = TEMPLATES.politics_talk();
  }

  // Cultura genérica
  if (!tmpl && has(text, "festival", "concierto", "estreno", "museo", "exposición", "teatro", "Luxor")) {
    tmpl = TEMPLATES.culture_generic();
  }

  // Fiscalidad / ayudas
  if (!tmpl && has(text, "IRPF", "impuesto", "subsidio", "ayuda", "factura", "LOFCA")) {
    tmpl = TEMPLATES.econ_tax();
  }

  // Fallback
  if (!tmpl) tmpl = TEMPLATES.fallback();

  it.impact = emptyImpact ? tmpl.impact : it.impact;
  it.impact_adult = emptyAdult ? tmpl.impact_adult : it.impact_adult;
  it.impact_teen = emptyTeen ? tmpl.impact_teen : it.impact_teen;

  return it;
}
