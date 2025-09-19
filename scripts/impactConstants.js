// impactConstants.js
export const TAGS = [
  "finanzas","economia","negocios","energía","movilidad","vivienda","empleo","impuestos","clima",
  "salud","educacion","eventos","deporte","cultura","seguridad","justicia","internacional",
  "tecnología","medioambiente","transporte","salud_publica","otros"
];

export const SEVERITIES = { NONE:0, LOW:1, MEDIUM:2, HIGH:3 };
export const HORIZONS = ["hoy","esta semana","este mes","este año","sin plazo"];
export const ACTIONS = ["FYI","vigilar","planificar","actuar"];

export const KEYWORD_TAG_MAP = [
  { re: /(eur[íi]bor|bce|tasas?|tipo(s)? de interes|hipoteca|inflaci[oó]n)/i, tag:"finanzas", severity:2, horizon:"este mes", action:"vigilar" },
  { re: /(gasolina|di[eé]sel|petr[oó]leo|combustible|carburante|electricidad|luz|gas)/i, tag:"energía", severity:2, horizon:"esta semana", action:"vigilar" },
  { re: /(huelga|paros?|paro)\b.*(tren|metro|bus|aeropuerto|vuelo|taxi|rodalies|renfe)/i, tag:"movilidad", severity:2, horizon:"hoy", action:"planificar" },
  { re: /(alquiler|vivienda|vpo|hipoteca|pisos|inmobiliaria)/i, tag:"vivienda", severity:2, horizon:"este mes", action:"vigilar" },
  { re: /(impuesto|iva|tasas?|bono|subsidio|deducci[oó]n)/i, tag:"impuestos", severity:2, horizon:"este mes", action:"vigilar" },
  { re: /(dana|temporal|lluvias intensas|ola de calor|inundaci[oó]n|tormenta)/i, tag:"clima", severity:2, horizon:"hoy", action:"planificar" },
  { re: /(concierto|festival|partido|marat[oó]n|acto institucional|aniversario)/i, tag:"eventos", severity:2, horizon:"esta semana", action:"planificar" },
  { re: /(champions|liga|mundial|copa|Barça|Real Madrid)/i, tag:"deporte", severity:2, horizon:"hoy", action:"planificar" },
  { re: /(covid|vacuna|brote|epidemia|hospital)/i, tag:"salud", severity:2, horizon:"esta semana", action:"vigilar" },
  { re: /(IA|inteligencia artificial|ciberseguridad|hackeo)/i, tag:"tecnología", severity:1, horizon:"esta semana", action:"FYI" },
  { re: /.*/i, tag:"otros", severity:0, horizon:"sin plazo", action:"FYI" }
];

export function pickDefaultByKeywords(text=""){
  for (const m of KEYWORD_TAG_MAP){
    if (m.re.test(text)) return { tag:m.tag, severity:m.severity, horizon:m.horizon, action:m.action };
  }
  return { tag:"otros", severity:0, horizon:"sin plazo", action:"FYI" };
}
