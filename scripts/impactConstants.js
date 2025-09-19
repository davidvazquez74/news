// scripts/impactConstants.js
// Plain JS version (ESM) of your constants & keyword mapping

export const TAGS = [
  "finanzas",
  "economia",
  "negocios",
  "energía",
  "movilidad",
  "vivienda",
  "empleo",
  "impuestos",
  "clima",
  "salud",
  "educacion",
  "eventos",
  "deporte",
  "cultura",
  "seguridad",
  "justicia",
  "internacional",
  "tecnología",
  "medioambiente",
  "transporte",
  "salud_publica",
  "otros"
];

export const SEVERITIES = {
  NONE: 0,
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3
};

export const HORIZONS = ["hoy","esta semana","este mes","este año","sin plazo"];
export const ACTIONS  = ["FYI","vigilar","planificar","actuar"];

// Keyword -> default tag/severity/horizon/action (regex; order matters)
export const KEYWORD_TAG_MAP = [
  { re: /(eur[íi]bor|bce|tasas?|tipo(s)? de interes|hipoteca|inflaci[oó]n)/i, tag: "finanzas", severity: SEVERITIES.MEDIUM, horizon: "este mes", action: "vigilar" },
  { re: /(gasolina|di[eé]sel|petr[oó]leo|combustible|carburante|electricidad|luz|gas)/i, tag: "energía", severity: SEVERITIES.MEDIUM, horizon: "esta semana", action: "vigilar" },
  { re: /(huelga|paros?|paro)\b.*(tren|metro|bus|aeropuerto|vuelo|taxi|rodalies|renfe)/i, tag: "movilidad", severity: SEVERITIES.MEDIUM, horizon: "hoy", action: "planificar" },
  { re: /(alquiler|vivienda|vpo|hipoteca|pisos|inmobiliaria)/i, tag: "vivienda", severity: SEVERITIES.MEDIUM, horizon: "este mes", action: "vigilar" },
  { re: /(impuesto|iva|tasas?|bono|subsidio|deducci[oó]n)/i, tag: "impuestos", severity: SEVERITIES.MEDIUM, horizon: "este mes", action: "vigilar" },
  { re: /(dana|temporal|lluvias intensas|ola de calor|inundaci[oó]n|tormenta|olas? de calor)/i, tag: "clima", severity: SEVERITIES.MEDIUM, horizon: "hoy", action: "planificar" },
  { re: /(muert[eo]s?|cad[aá]ver|homicidio|asesinato|violencia sexual|accidente mortal)/i, tag: "seguridad", severity: SEVERITIES.LOW, horizon: "hoy", action: "vigilar" },
  { re: /(concierto|festival|partido|marat[oó]n|acto institucional|aniversario|celebraci[oó]n)/i, tag: "eventos", severity: SEVERITIES.MEDIUM, horizon: "esta semana", action: "planificar" },
  { re: /(champions|liga|mundial|copa|barcelon|barça|real madrid|atl[eé]tico)/i, tag: "deporte", severity: SEVERITIES.MEDIUM, horizon: "hoy", action: "planificar" },
  { re: /(covid|vacuna|brote|epidemia|hospitales|lista de espera)/i, tag: "salud", severity: SEVERITIES.MEDIUM, horizon: "esta semana", action: "vigilar" },
  { re: /\b(ia|inteligencia artificial|ciberseguridad|hackeo|brecha)\b/i, tag: "tecnología", severity: SEVERITIES.LOW, horizon: "esta semana", action: "FYI" },
  { re: /(empresa|fusi[oó]n|resultados|cotizaci[oó]n)/i, tag: "negocios", severity: SEVERITIES.LOW, horizon: "este mes", action: "FYI" },
  { re: /(juicio|sentencia|tribunal|fiscal)/i, tag: "justicia", severity: SEVERITIES.LOW, horizon: "esta semana", action: "FYI" },
  { re: /(incendio|contaminaci[oó]n|vertido|desastre ambiental)/i, tag: "medioambiente", severity: SEVERITIES.MEDIUM, horizon: "hoy", action: "vigilar" },
  // default
  { re: /.*/i, tag: "otros", severity: SEVERITIES.NONE, horizon: "sin plazo", action: "FYI" }
];

export function pickDefaultByKeywords(text) {
  for (const m of KEYWORD_TAG_MAP) {
    if (m.re.test(text)) return { tag: m.tag, severity: m.severity, horizon: m.horizon, action: m.action };
  }
  return { tag: "otros", severity: SEVERITIES.NONE, horizon: "sin plazo", action: "FYI" };
}