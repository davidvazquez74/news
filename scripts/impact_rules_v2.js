
// scripts/impact_rules_v2.js
// ESM module
/**
 * Enhance a single news item with adult/teen impacts and tags.
 * Guarantees non-empty impact fields and teen tone.
 */
export function enhanceItem(item = {}, region = "") {
  const t = (item.title || "").toLowerCase();
  const s = (item.summary || "").toLowerCase();
  const src = (item.source || "").toLowerCase();
  const url = (item.url || "").toLowerCase();

  const text = `${t} ${s} ${src} ${url}`;

  const hasAny = (arr) => arr.some(k => text.includes(k));
  const re = (exp) => new RegExp(exp, "i");
  const m = (exp) => re(exp).test(text);

  // Buckets
  const B = {
    transport: hasAny(["rodalies","renfe","metro","huelga","trafico","cercanias","aeropuerto","vuelos","ryanair","ave","bus","catalunya metro","tmb"]),
    weather: hasAny(["ola de calor","dana","temporal","tormenta","lluvia","viento","alerta meteo","aemet","protección civil","proteccion civil"]),
    economy: hasAny(["ipc","inflación","inflacion","paro","salario","nómina","nomina","irpf","iva","subvención","subvencion","ayuda","beca","hipoteca","euribor","precios","alquiler"]),
    taxes: hasAny(["irpf","iva","impuesto","tributo","hacienda","recaude el irpf","recaudar el irpf"]),
    education: hasAny(["colegio","universidad","selectividad","ebau","matrícula","matricula","beca","curso escolar","profesores","huelga docente","examenes","exámenes"]),
    health: hasAny(["salud","vacuna","covid","brotes","gripe","alerta sanitaria","centro de salud","hospital"]),
    tech_social: hasAny(["tiktok","instagram","ig ","facebook","meta","whatsapp","x.com","twitter","redes sociales","caída","caida","privacidad","datos","filtración","filtracion","ciberataque"]),
    sports: hasAny(["barça","barca","fc barcelona","madrid","real madrid","liga","champions","copa del rey","euroliga","nba","deportivo","partido","jornada","clasificación","fichaje"]),
    culture: hasAny(["festival","concierto","estreno","cine","museo","exposición","exposicion","teatro","fiestas","san mateo","fiesta mayor"]),
    security: hasAny(["protesta","manifestación","manifestacion","incidente","policia","seguridad","violencia","delito","estafa"]),
    geopolitics: hasAny(["otan","nato","guerra","rusia","ucrania","israel","gaza","frontera","defensa","cazas","avión a-400","a-400"]),
    monarchy: hasAny(["reyes","felipe","letizia","casa real"]),
    language_policy: hasAny(["catalán","catalan","oficial en la ue","cooficialidad"])
  };

  let impact_adult = "";
  let impact_teen = "";
  let tag = "";
  let severity = "low";
  let horizon = "none"; // immediate, soon, watch, none
  let action = "";

  // Rule order matters: specific -> general
  if (B.transport) {
    tag = "transporte";
    severity = "medium";
    horizon = "soon";
    action = "Revisa horarios y alertas en tu app habitual.";
    impact_adult = "Transporte con posibles retrasos o cambios. Revisa horarios/avisos antes de salir.";
    impact_teen = "Movidas en el transporte. Mira la app antes de salir o te comes el retraso, bro. 🚇⌚";
  } else if (B.weather) {
    tag = "tiempo";
    severity = "medium";
    horizon = "soon";
    action = "Planifica ropa y desplazamientos; evita riesgos.";
    impact_adult = "Tiempo inestable: ajusta planes y ropa; sigue avisos oficiales.";
    impact_teen = "Tiempo loco: chaqueta/paraguas ready y ojo a las alertas. 🌧️🧥";
  } else if (B.taxes) {
    tag = "impuestos";
    severity = "medium";
    horizon = "watch";
    action = "Comprueba facturas, retenciones o deducciones.";
    impact_adult = "Cambios fiscales a la vista: podrían variar retenciones o trámites.";
    impact_teen = "Tema impuestos: a tu familia le puede tocar pagar/cobrar distinto. Pregunta en casa. 🧾";
  } else if (B.economy) {
    tag = "economía";
    severity = "medium";
    horizon = "watch";
    action = "Revisa presupuestos y plazos.";
    impact_adult = "Puede variar lo que pagas o recibes (precios, becas, facturas). Revisa plazos.";
    impact_teen = "Precios/ayudas pueden moverse. Cero vibes si suben, pero heads up. 📈";
  } else if (B.education) {
    tag = "educación";
    severity = "medium";
    horizon = "soon";
    action = "Consulta calendario, becas o cambios de clase.";
    impact_adult = "Cambios en calendario educativo o becas; revisa requisitos y fechas.";
    impact_teen = "Clases/exámenes/becas pueden cambiar. Revísalo o te pilla, literal. 📝";
  } else if (B.health) {
    tag = "salud";
    severity = "medium";
    horizon = "watch";
    action = "Sigue consejos sanitarios y actualiza cartilla vacunal si procede.";
    impact_adult = "Aviso de salud pública: medidas o citas podrían ajustarse en los próximos días.";
    impact_teen = "Tema salud: mejor cuidar hábitos y estar al loro de avisos. 💊";
  } else if (B.tech_social) {
    tag = "redes/tech";
    severity = "low";
    horizon = "soon";
    action = "Revisa privacidad, contraseñas y estado del servicio.";
    impact_adult = "Cambios o incidencias en apps/redes: revisa privacidad y disponibilidad.";
    impact_teen = "Apps/redes con salseo (caídas o cambios). Si X/TikTok se cae, chill. 🔐📱";
  } else if (B.sports) {
    tag = "deportes";
    severity = "low";
    horizon = "soon";
    action = "Consulta horarios y tráfico en evento.";
    impact_adult = "Deportes/eventos: puede haber tráfico o cambios de horarios.";
    impact_teen = "Partidos y fichajes on fire. Ojo a horarios si vas o lo ves con la peña. ⚽";
  } else if (B.culture) {
    tag = "ocio/cultura";
    severity = "low";
    horizon = "soon";
    action = "Compra entradas con antelación; revisa cortes de calles.";
    impact_adult = "Eventos y cultura: planifica entradas y desplazamientos.";
    impact_teen = "Planes guays (conci, festi, cine). Pilla entradas antes que vuelen. 🎟️";
  } else if (B.security) {
    tag = "seguridad";
    severity = "medium";
    horizon = "immediate";
    action = "Evita zonas afectadas y sigue indicaciones oficiales.";
    impact_adult = "Incidencias/seguridad: evita zonas afectadas y sigue avisos.";
    impact_teen = "Está movida la zona: mejor no te metas ahí, bro. 🚫";
  } else if (B.geopolitics) {
    tag = "geopolítica";
    severity = "low";
    horizon = "watch";
    action = "Solo informativo, sin cambios locales inmediatos.";
    impact_adult = "Cobertura internacional/defensa; sin efecto directo inmediato.";
    impact_teen = "Noticias de fuera: info interesante pero cero impacto hoy. 🌍";
  } else if (B.monarchy) {
    tag = "institucional";
    severity = "low";
    horizon = "none";
    action = "Solo informativo.";
    impact_adult = "Agenda institucional sin efectos prácticos para tu día a día.";
    impact_teen = "Acto oficial. Todo chill para ti. 🙂";
  } else if (B.language_policy) {
    tag = "política lingüística";
    severity = "low";
    horizon = "watch";
    action = "Pendiente de trámites y plazos.";
    impact_adult = "Debate lingüístico: impacto práctico si cambian trámites/servicios.";
    impact_teen = "Tema idiomas en UE: por ahora, talk y poco más. 🗣️";
  } else {
    // fallback decente, nunca vacío
    tag = "general";
    severity = "low";
    horizon = "none";
    action = "Solo informativo.";
    impact_adult = "Noticia general sin cambios inmediatos en tu rutina.";
    impact_teen = "Info random pero interesante; para tu día, cero drama. 🙂";
  }

  // Clamp teen tone (avoid offensive content by design)
  const clean = (str) => (str || "").trim();

  return {
    ...item,
    tag, severity, horizon, action,
    impact: clean(impact_adult),
    impact_adult: clean(impact_adult),
    impact_teen: clean(impact_teen)
  };
}

/**
 * Enhance whole payload { cataluna, espana, rioja, background, ... }
 */
export function enhanceAll(json) {
  const keys = Object.keys(json).filter(k => Array.isArray(json[k]));
  for (const k of keys) {
    json[k] = (json[k] || []).map(item => enhanceItem(item, k));
  }
  if (!json.version) json.version = "v-enhanced";
  return json;
}
