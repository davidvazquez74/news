// scripts/impact_rules.js
export const TEEN_TONE = {
  softenSensitive: (s) => s, // hook para moderar si hace falta
  fmt: (s) => s.replace(/\s+/g,' ').trim()
};

export const RULES = [
  // Transporte / huelgas / movilidad
  {
    re: /(huelga|paros?)\b.*(tren|metro|bus|rodalies|renfe|aeropuerto|vuelo|taxi)/i,
    tag: "movilidad", severity: 2, horizon: "hoy", action: "planificar",
    adult: "Ajusta desplazamientos; consulta horarios y alternativas.",
    teen:  "Ojo con tren/metro: sal antes o busca plan B 🚇"
  },
  // Clima severo
  {
    re: /(dana|temporal|ola de calor|tormenta|inundaci[oó]n|alerta meteorol[oó]gica)/i,
    tag: "clima", severity: 2, horizon: "hoy", action: "planificar",
    adult: "Revisa la previsión y evita desplazamientos innecesarios.",
    teen:  "Tiempo loco: lleva agua/chubasquero y cuida el móvil ⛈️"
  },
  // Finanzas / impuestos / IRPF
  {
    re: /(irpf|impuesto|iva|retencion|deducci[oó]n)/i,
    tag: "impuestos", severity: 2, horizon: "este mes", action: "vigilar",
    adult: "Podrían variar pagos o ayudas; revisa plazos y requisitos.",
    teen:  "Puede cambiar lo que cobras/pagas; coméntalo en casa 🧾"
  },
  // Energía / carburantes / luz
  {
    re: /(gasolina|di[eé]sel|luz|electricidad|factura electrica|peajes?)/i,
    tag: "energía", severity: 2, horizon: "esta semana", action: "vigilar",
    adult: "Vigila precios y consumo estos días.",
    teen:  "Gasolina/luz más volátil: plan con cabeza 💡"
  },
  // Educación
  {
    re: /(colegio|institut|universidad|beca|selectividad|evau|matr[ií]cula|calendario escolar|huelga docente)/i,
    tag: "educacion", severity: 2, horizon: "esta semana", action: "planificar",
    adult: "Revisa calendario, becas y comunicaciones del centro.",
    teen:  "Profs de huelga/cambios: mira la app del insti 📚"
  },
  // Salud pública
  {
    re: /(alerta sanitaria|brote|vacuna|covid|gripe|virus)/i,
    tag: "salud_publica", severity: 2, horizon: "esta semana", action: "vigilar",
    adult: "Sigue indicaciones oficiales y revisa calendario de vacunas.",
    teen:  "Si hay brote: gel, sentido común y ya 😷"
  },
  // Deportes - Barça / eventos masivos
  {
    re: /(bar[cç]a|fc barcelona|real madrid|champions|liga|clásico)/i,
    tag: "deporte", severity: 2, horizon: "hoy", action: "planificar",
    adult: "Prevé cortes y aglomeraciones en horas de partido.",
    teen:  "Día de partido: quedadas sí, líos no. Llega antes ⚽"
  },
  // Cultura / conciertos / festivales
  {
    re: /(festival|concierto|entradas agotadas|estreno|premio|exposición)/i,
    tag: "cultura", severity: 1, horizon: "esta semana", action: "planificar",
    adult: "Planifica entradas y transporte con antelación.",
    teen:  "Si vas, pilla entradas ya y mira horarios 🎟️"
  },
  // Tecnología / redes sociales
  {
    re: /(tiktok|instagram|x\.com|twitter|privacidad|ca[ií]da global|hackeo|ciber)/i,
    tag: "tecnología", severity: 1, horizon: "esta semana", action: "FYI",
    adult: "Revisa privacidad y permisos; posibles caídas puntuales.",
    teen:  "Si TikTok/IG falla, chill: prueba más tarde. Cuida tus datos 🔐"
  },
  // Seguridad / sucesos
  {
    re: /(hallazgo|cad[aá]ver|homicidio|agresi[oó]n|terrorismo)/i,
    tag: "seguridad", severity: 1, horizon: "hoy", action: "vigilar",
    adult: "Evita la zona y sigue canales oficiales.",
    teen:  "Evita esa zona y comparte info solo oficial 🙏"
  }
];

export function deriveImpact(title="", summary=""){
  const text = `${title} ${summary}`;
  for (const r of RULES){
    if (r.re.test(text)){
      return {
        adult_impact: r.adult,
        teen_impact: TEEN_TONE.fmt(r.teen),
        tag: r.tag, severity: r.severity, horizon: r.horizon, action: r.action,
        rationale: "rule-match", confidence: 0.8
      };
    }
  }
  return {
    adult_impact: "Sin efecto directo en tu día a día.",
    teen_impact: "Sin efecto directo en tu día a día.",
    tag: "otros", severity: 0, horizon: "sin plazo", action: "FYI",
    rationale: "fallback", confidence: 0.4
  };
}
