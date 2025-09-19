// scripts/impactConstants.js
// ESM module: taxonomía, señales y mapa de keywords ampliado

export const TAGS = [
  "finanzas","economia","negocios","energía","combustibles","utilidades",
  "movilidad","transporte","vivienda","empleo","impuestos",
  "clima","medioambiente","incendios",
  "salud","salud_publica","educacion",
  "seguridad","justicia",
  "internacional","geopolitica","europeo",
  "tecnología","ia","ciberseguridad","privacidad","redes_sociales","apps","suscripciones","dispositivos",
  "cultura","eventos","deporte","turismo","comercio",
  "otros"
];

export const SEVERITIES = { NONE:0, LOW:1, MEDIUM:2, HIGH:3 };
export const HORIZONS = ["hoy","mañana","esta semana","este mes","este año","sin plazo"];
export const ACTIONS = ["FYI","vigilar","planificar","actuar"];

// Palabras útiles para ajustar severidad/urgencia
export const SIGNALS = {
  URGENCY: /(hoy|mañana|última hora|de inmediato|de forma inmediata|en las próximas horas)/i,
  STRONG: /(prohíbe|obligatorio|obliga|multas?|sanciones?|cierres?|corte total|evacuaci[oó]n|estado de alarma|emergencia)/i,
  RISK: /(alerta|aviso|riesgo|peligro|temporal|dana|ola de calor|ola de frío|viento fuerte|inundaci[oó]n|tormenta)/i,
  SERVICE_DOWN: /(caída|caido|apag[oó]n|interrupci[oó]n|corte|aver[ií]a|indisponible)/i,
  PRICE_UP: /(sube|encarece|al alza|incrementa|récord|récords?)/i,
  PRICE_DOWN: /(baja|abarata|a la baja|reduce|desciende)/i
};

// Lugares clave (para marcar “local” si aparece en título/resumen)
export const LOCAL_PLACES = [
  // Cataluña / BCN área
  "barcelona","cataluña","catalunya","girona","tarragona","lleida","rodalies","molins de rei","hospitalet",
  // La Rioja
  "la rioja","logroño","calahorra","har[oó]",
  // Zaragoza
  "zaragoza",
  // Madrid
  "madrid",
  // Euskadi / Bilbao
  "bilbao","donostia","san sebastián","vitoria","euskadi","pais vasco","san mamés","san mames",
  // Extranjeras habituales
  "amsterdam","parís","paris","londres","praga","roma","berlín","berlin"
];

// Mapa ampliado de keywords → tag+defaults
export const KEYWORD_TAG_MAP = [
  // Finanzas / economía / empleo / vivienda / impuestos
  { re: /(eur[íi]bor|bce|tipos? de inter[eé]s|hipotecas? variables?|inflaci[oó]n|ipc|deuda|bonos?)/i, tag:"finanzas", severity:2, horizon:"este mes", action:"vigilar" },
  { re: /(paro|empleo|smi|salarios?|convenio|erte|ere\b)/i, tag:"empleo", severity:2, horizon:"este mes", action:"vigilar" },
  { re: /(alquiler|vivienda|vpo|hipotecas?\b|inmobiliari[ao])/i, tag:"vivienda", severity:2, horizon:"este mes", action:"vigilar" },
  { re: /(impuestos?|iva|irpf|tasas?|bono|subsidio|deducci[oó]n|cotizaciones?)/i, tag:"impuestos", severity:2, horizon:"este mes", action:"vigilar" },
  { re: /(pib|crecimiento|recesi[oó]n|econom[ií]a)/i, tag:"economia", severity:1, horizon:"este año", action:"FYI" },
  { re: /(empresa|fusi[oó]n|opas?|resultados|cotizaci[oó]n|beneficios?)/i, tag:"negocios", severity:1, horizon:"este mes", action:"FYI" },

  // Energía / combustibles / utilidades
  { re: /(luz|electricidad|tarifa|peaje|kwh|factura el[eé]ctrica)/i, tag:"energía", severity:2, horizon:"esta semana", action:"vigilar" },
  { re: /(gasolina|di[eé]sel|petr[oó]leo|combustible|carburante|gas\b)/i, tag:"combustibles", severity:2, horizon:"esta semana", action:"vigilar" },
  { re: /(agua|fibra|internet|m[oó]vil|telefon[ií]a)/i, tag:"utilidades", severity:1, horizon:"esta semana", action:"FYI" },

  // Transporte / movilidad
  { re: /(huelga|paros?)\b.*(tren|metro|bus|aeropuerto|vuelo|taxi|rodalies|renfe|cercan[ií]as)/i, tag:"movilidad", severity:2, horizon:"hoy", action:"planificar" },
  { re: /(tr[aá]fico|retenciones?|peajes?|itv|dgt)/i, tag:"transporte", severity:1, horizon:"hoy", action:"planificar" },

  // Educación / salud
  { re: /(colegios?|universidad|matr[ií]cula|becas?|selectividad|eva[uú])/i, tag:"educacion", severity:1, horizon:"este mes", action:"vigilar" },
  { re: /(sanidad|salud|vacunas?|brote|epidemia|hospital(es)?|listas? de espera)/i, tag:"salud", severity:2, horizon:"esta semana", action:"vigilar" },

  // Seguridad / justicia
  { re: /(detenci[oó]n|homicidio|agresi[oó]n|robo|estafa|trama|terrorismo)/i, tag:"seguridad", severity:1, horizon:"hoy", action:"vigilar" },
  { re: /(juicio|sentencia|audiencia|tribunal|fiscal[ií]a|tc|ts)/i, tag:"justicia", severity:1, horizon:"esta semana", action:"FYI" },

  // Internacional / geopolítica / UE
  { re: /(otan|ue\b|comisi[oó]n europea|parlamento europeo|bce\b)/i, tag:"europeo", severity:1, horizon:"este año", action:"FYI" },
  { re: /(ucrania|rusia|gaza|israel|medio oriente|venezuela|taiw[aá]n|china|ee\.?uu\.?)/i, tag:"geopolitica", severity:1, horizon:"esta semana", action:"FYI" },
  { re: /(acuerdo|cumbre|tratado|sanci[oó]n|embargo)\b.*(china|ee\.?uu\.?|ue\b|otan)/i, tag:"internacional", severity:1, horizon:"esta semana", action:"FYI" },

  // Tecnología / IA / privacidad / ciber / redes / apps / dispositivos / suscripciones
  { re: /\b(ia|inteligencia artificial|ai act|modelo|algoritmo|chatbot)\b/i, tag:"ia", severity:1, horizon:"esta semana", action:"FYI" },
  { re: /(ciberataque|ransomware|phishing|brecha|filtraci[oó]n de datos)/i, tag:"ciberseguridad", severity:2, horizon:"hoy", action:"actuar" },
  { re: /(privacidad|cookies|datos personales|gdpr|rgpd)/i, tag:"privacidad", severity:1, horizon:"este mes", action:"vigilar" },
  { re: /(tiktok|instagram|facebook|meta|twitter|x\.com|snapchat|twitch|youtube|reddit)/i, tag:"redes_sociales", severity:1, horizon:"esta semana", action:"FYI" },
  { re: /(whatsapp|telegram|signal|spotify|netflix|hbo|max|disney\+|prime video|apple tv\+|itunes)/i, tag:"apps", severity:1, horizon:"esta semana", action:"FYI" },
  { re: /(iphone|android|pixel|samsung|ipad|macbook|port[áa]til|consola|playstation|xbox|switch)/i, tag:"dispositivos", severity:1, horizon:"este mes", action:"FYI" },
  { re: /(suscripci[oó]n|subida de precio|cuota mensual)/i, tag:"suscripciones", severity:1, horizon:"este mes", action:"vigilar" },

  // Cultura / eventos / deporte
  { re: /(festival|concierto|exposici[oó]n|teatro|cine|premios?|emmys?|oscars?)/i, tag:"cultura", severity:1, horizon:"esta semana", action:"planificar" },
  { re: /(partido|final|derbi|champions|liga|ol[ií]mpicos?)/i, tag:"deporte", severity:1, horizon:"hoy", action:"planificar" },
  { re: /(macroconcierto|cabalgata|marat[oó]n|gran premio|feria)/i, tag:"eventos", severity:1, horizon:"esta semana", action:"planificar" },

  // Clima / medioambiente / incendios
  { re: /(dana|temporal|ola de calor|ola de frío|viento fuerte|inundaci[oó]n|tormenta)/i, tag:"clima", severity:2, horizon:"hoy", action:"planificar" },
  { re: /(contaminaci[oó]n|vertido|sequ[ií]a|residuos)/i, tag:"medioambiente", severity:1, horizon:"esta semana", action:"vigilar" },
  { re: /(incendio forestal|fuego descontrolado|nivel extremo de incendios?)/i, tag:"incendios", severity:2, horizon:"hoy", action:"planificar" },

  // Turismo / comercio / viajes
  { re: /(turismo|viajes|aerol[ií]neas|hotel(es)?|visados?|pasaportes?)/i, tag:"turismo", severity:1, horizon:"este mes", action:"FYI" },
  { re: /(supermercado|cesta de la compra|precios?|ofertas?|rebajas?)/i, tag:"comercio", severity:1, horizon:"esta semana", action:"FYI" },

  // Por defecto
  { re: /.*/i, tag:"otros", severity:0, horizon:"sin plazo", action:"FYI" }
];
