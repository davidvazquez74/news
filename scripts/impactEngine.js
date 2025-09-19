// scripts/impactEngine.js
// ESM module. Motor "lite" sin LLM: clasifica por keywords y redacta impactos breves.

import { pickDefaultByKeywords, SEVERITIES } from "./impactConstants.js";

const neutral = "Sin efecto directo en tu día a día.";

// util
const lc = (s)=>String(s||"").toLowerCase();
const sanitize = (s)=>String(s||"").replace(/\s+/g," ").trim();

export function impactFromText(title="", summary=""){
  const text = sanitize(`${title} ${summary}`);
  const { tag, severity, horizon, action } = pickDefaultByKeywords(text);

  // Redacciones específicas por tag (adult / teen)
  let adult = "", teen = "";

  switch (tag){
    case "finanzas":
      adult = "Si tu hipoteca es variable, revisa próximas cuotas.";
      teen  = "En casa puede cambiar la letra de la hipoteca. 💶";
      break;
    case "energía":
      adult = "Atento a facturas y surtidor: pueden moverse precios.";
      teen  = "Gasolina/luz pueden variar: ojo a gastos. ⛽";
      break;
    case "movilidad":
      adult = "Planifica desplazamientos: posibles retrasos o servicios mínimos.";
      teen  = "Metro/tren pueden fallar: sal con margen. 🚌";
      break;
    case "vivienda":
      adult = "Cambios en alquileres/hipotecas: revisa condiciones y plazos.";
      teen  = "Pisos más caros o normas nuevas: ojo. 🏠";
      break;
    case "impuestos":
      adult = "Podrían variar lo que pagas o recibes; revisa facturas y fechas.";
      teen  = "Impuestos/ayudas pueden cambiar; pregunta en casa. 🧾";
      break;
    case "clima":
      adult = "Ajusta planes y traslados; consulta alertas locales.";
      teen  = "Tiempo chungo: haz plan B. 🌧️";
      break;
    case "salud":
      adult = "Puede afectar citas o servicios; consulta tu centro.";
      teen  = "Citas/horarios del centro pueden cambiar. 📅";
      break;
    case "deporte":
    case "eventos":
      adult = "Más tráfico y afluencia en la zona del evento.";
      teen  = "Más gente y atascos cerca del evento. 🎟️";
      break;
    case "seguridad":
      adult = "Evita la zona y sigue indicaciones oficiales.";
      teen  = "No te acerques; espera avisos.";
      break;
    case "justicia":
    case "negocios":
    case "tecnología":
    default:
      adult = severity > SEVERITIES.NONE ? "Tenlo en cuenta para decisiones y trámites." : neutral;
      teen  = severity > SEVERITIES.NONE ? "Úsalo para decidir o planear. 🙂" : neutral;
  }

  // Cotas de longitud
  const clip = (s, max=22)=>{
    const words = s.trim().split(/\s+/);
    return (words.length<=max)? s : words.slice(0,max).join(" ") + "…";
  };

  adult = clip(sanitize(adult), 22);
  // teen: máximo 18 palabras, máx 1 emoji (aquí lo dejamos tal cual, textos ya cortos)
  teen  = clip(sanitize(teen), 18);

  return {
    adult_impact: adult,
    teen_impact: teen,
    tag, severity, horizon, action
  };
}