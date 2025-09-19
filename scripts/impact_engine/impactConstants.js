// scripts/impact_engine/impactConstants.js
export const TAGS = [
  "finanzas","economia","negocios","energía","movilidad","vivienda","empleo","impuestos","clima",
  "salud","educacion","eventos","deporte","cultura","seguridad","justicia","internacional",
  "tecnología","medioambiente","transporte","salud_publica","otros"
];

export const SEVERITIES = { NONE:0, LOW:1, MEDIUM:2, HIGH:3 };
export const HORIZONS = ["hoy","esta semana","este mes","este año","sin plazo"];
export const ACTIONS = ["FYI","vigilar","planificar","actuar"];

export const KEYWORD_TAG_MAP = [
  { re: /(eur[íi]bor|bce|tasas?|tipo(?:s)? de interes|hipoteca|inflaci[oó]n)/i, tag:"finanzas", severity:2, horizon:"este mes", action:"vigilar" },
  { re: /(gasolina|di[eé]sel|petr[oó]leo|combustible|carburante|electricidad|luz|gas)/i, tag:"energía", severity:2, horizon:"esta semana", action:"vigilar" },
  { re: /(huelga|paros?|paro)\b.*(tren|metro|bus|aeropuerto|vuelo|taxi|rodalies|renfe)/i, tag:"movilidad", severity:2, horizon:"hoy", action:"planificar" },
  { re: /(alquiler|vivienda|vpo|hipoteca|pisos|inmobiliaria)/i, tag:"vivienda", severity:2, horizon:"este mes", action:"vigilar" },
  { re: /(impuesto|iva|tasas?|bono|subsidio|deducci[oó]n)/i, tag:"impuestos", severity:2, horizon:"este mes", action:"vigilar" },
  { re: /(dana|temporal|lluvias intensas|ola de calor|inundaci[oó]n|tormenta|olas? de calor)/i, tag:"clima", severity:2, horizon:"hoy", action:"planificar" },
  { re: /(muert[eo]s?|cad[aá]ver|homicidio|asesinato|violencia sexual|accidente mortal)/i, tag:"seguridad", severity:1, horizon:"hoy", action:"vigilar" },
  { re: /(concierto|festival|partido|marat[oó]n|acto institucional|aniversario|celebraci[oó]n)/i, tag:"eventos", severity:2, horizon:"esta semana", action:"planificar" },
  { re: /(champions|liga|mundial|copa|bar(?:ça|celona)|real madrid|atl[eé]tico)/i, tag:"deporte", severity:2, horizon:"hoy", action:"planificar" },
  { re: /(covid|vacuna|brote|epidemia|hospitales|lista de espera)/i, tag:"salud", severity:2, horizon:"esta semana", action:"vigilar" },
  { re: /(tiktok|instagram|facebook|meta|\bx\b|twitter|red(?:es)? social(?:es)?).*(acuerdo|prohibici[oó]n|norma|regulaci[oó]n|ee\.?uu\.?|ue|china|gobierno|congreso)/i,
    tag:"tecnología", severity:1, horizon:"esta semana", action:"FYI" },
  { re: /(inteligencia artificial|\bia\b|ai act|algoritmo|modelos? de ia)/i, tag:"tecnología", severity:1, horizon:"esta semana", action:"FYI" },
  { re: /(empresa|fusi[oó]n|resultados|cotizaci[oó]n)/i, tag:"negocios", severity:1, horizon:"este mes", action:"FYI" },
  { re: /(juicio|sentencia|tribunal|fiscal)/i, tag:"justicia", severity:1, horizon:"esta semana", action:"FYI" },
  { re: /(incendio|contaminaci[oó]n|vertido|desastre ambiental)/i, tag:"medioambiente", severity:2, horizon:"hoy", action:"vigilar" },
  { re: /.*/i, tag:"otros", severity:0, horizon:"sin plazo", action:"FYI" }
];

export const NEUTRAL = "Sin efecto directo en tu día a día.";

export function pickDefaultByKeywords(text=""){
  for (const m of KEYWORD_TAG_MAP){
    if (m.re.test(text)) return { tag:m.tag, severity:m.severity, horizon:m.horizon, action:m.action };
  }
  return { tag:"otros", severity:0, horizon:"sin plazo", action:"FYI" };
}

export function defaultImpactsForTag(tag){
  switch(tag){
    case "finanzas":      return { adult:"Si tu hipoteca es variable, la cuota puede moverse en próximas revisiones.", teen:"En casa puede cambiar la letra de la hipoteca. 💶" };
    case "energía":       return { adult:"Precios de luz/combustible podrían moverse; revisa facturas o repostajes.",  teen:"Gasolina o luz pueden variar; ojo con gastos. ⛽" };
    case "movilidad":     return { adult:"Revisa horarios y rutas: posibles retrasos o servicios mínimos.",             teen:"Metro/tren pueden dar guerra; sal con margen. 🚌" };
    case "vivienda":      return { adult:"Pueden cambiar precios o condiciones de alquiler/hipoteca.",                  teen:"Pisos y alquileres pueden moverse. 🏠" };
    case "impuestos":     return { adult:"Puede variar lo que pagas o recibes; revisa plazos y requisitos.",           teen:"Impuestos/ayudas pueden cambiar; pregunta en casa. 🧾" };
    case "clima":         return { adult:"Ajusta planes y desplazamientos; consulta alertas oficiales.",               teen:"Plan B si el tiempo se tuerce. 🌧️" };
    case "eventos":
    case "deporte":       return { adult:"Más tráfico y gente en la zona; llega con tiempo.",                          teen:"Habrá jaleo por el evento; ve antes. 🎟️" };
    case "seguridad":     return { adult:"Evita la zona y sigue indicaciones oficiales.",                               teen:"No te acerques; espera avisos." };
    case "tecnología":    return { adult:"Tus apps pueden cambiar funciones o permisos; revisa avisos.",                teen:"Alguna app puede cambiar cosas; mira notificaciones. 📱" };
    case "justicia":      return { adult:"Efecto indirecto: estate atento a cambios normativos.",                       teen:"No cambia tu día a día inmediato." };
    case "medioambiente": return { adult:"Podrían aplicarse restricciones o cortes; consulta el municipio.",            teen:"Puede haber cortes o avisos en la zona." };
    default:              return { adult: NEUTRAL, teen: NEUTRAL };
  }
}
