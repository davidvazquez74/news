// scripts/impact_engine/impactEngine.js
// Motor de impacto sin API (keywords). Devuelve adulto/teen + metadatos.
const BANNED = [
  "seguimiento recomendado",
  "pendiente de evolución",
  "podría notarse en facturas o movilidad",
  "apps y servicios pueden cambiar reglas y permisos",
  "sin efecto directo en tu día a día"
];

const TAGS = [
  "finanzas","economia","negocios","energía","movilidad","vivienda","empleo",
  "impuestos","clima","salud","educacion","eventos","deporte","cultura",
  "seguridad","justicia","internacional","tecnología","medioambiente","transporte",
  "salud_publica","otros"
];

function norm(s=""){ return String(s||"").replace(/\s+/g," ").trim(); }
function low(s=""){ return norm(s).toLowerCase(); }

function pickByKeywords(text){
  const t = low(text);
  const map = [
    {re:/(eur[íi]bor|bce|tipo(s)? de inter[eé]s|hipoteca|inflaci[oó]n)/, tag:"finanzas", sev:2, hor:"este mes", act:"vigilar",
     adult:"Si tu hipoteca es variable, puede moverse la cuota en próximas revisiones.",
     teen:"Si en casa hay hipoteca variable, la letra puede cambiar. 💶"},
    {re:/(gasolina|di[eé]sel|petr[óo]leo|combustible|carburante|electricidad|luz|gas)/, tag:"energía", sev:2, hor:"esta semana", act:"vigilar",
     adult:"Vigila precios en surtidor y factura: pueden moverse estos días.",
     teen:"Depósito y luz pueden variar un poco; ojo con gastos. ⛽"},
    {re:/(huelga|paros?)/, and:/(tren|metro|bus|aeropuerto|vuelo|taxi|rodalies|renfe)/, tag:"movilidad", sev:2, hor:"hoy", act:"planificar",
     adult:"Revisa horarios y alternativas: pueden darse retrasos o servicios mínimos.",
     teen:"Ojito con el metro/tren: retrasos y tocar madrugar. 🚌"},
    {re:/(alquiler|vivienda|vpo|pisos|hipoteca|inmobiliaria)/, tag:"vivienda", sev:2, hor:"este mes", act:"vigilar",
     adult:"Posibles cambios en precios o condiciones de vivienda; revisa plazos.",
     teen:"Pisos más caros o cambios; pregunta en casa. 🏠"},
    {re:/(impuesto|iva|tasas?|bono|subsidio|deducci[oó]n)/, tag:"impuestos", sev:2, hor:"este mes", act:"vigilar",
     adult:"Puede variar lo que pagas o recibes; revisa facturas y requisitos.",
     teen:"Cosas más caras o ayudas con cambios; atentos en casa. 🧾"},
    {re:/(dana|temporal|lluvias intensas|ola de calor|inundaci[oó]n|tormenta|viento fuerte)/, tag:"clima", sev:2, hor:"hoy", act:"planificar",
     adult:"Ajusta planes y desplazamientos; consulta alertas locales.",
     teen:"Plan B para entrenos/planes: tiempo chungo. 🌧️"},
    {re:/(covid|vacuna|brote|epidemia|hospitales|lista de espera)/, tag:"salud", sev:2, hor:"esta semana", act:"vigilar",
     adult:"Puede afectar a citas y tiempos de espera; consulta tu centro.",
     teen:"Citas o horarios pueden cambiar; revisa avisos. 📅"},
    {re:/(juicio|sentencia|tribunal|fiscal)/, tag:"justicia", sev:1, hor:"esta semana", act:"FYI",
     adult:"Seguimiento informativo; impacto directo bajo salvo partes afectadas.",
     teen:"Es más de info que de cambios para ti."},
    {re:/(champions|liga|mundial|copa|barça|real madrid|atl[eé]tico|concierto|festival|entradas)/, tag:"eventos", sev:1, hor:"hoy", act:"planificar",
     adult:"Puede haber más tráfico y ocupación en la zona durante el evento.",
     teen:"Más gente y lío por la zona; sal con tiempo. 🎟️"},
    {re:/(ia\b|inteligencia artificial|ciberseguridad|hackeo|brecha|algoritmo|ai act)/, tag:"tecnología", sev:1, hor:"esta semana", act:"FYI",
     adult:"Algunas apps o webs podrían cambiar avisos o permisos.",
     teen:"Alguna app puede pedir más permisos. 📱"}
  ];

  for (const m of map){
    if (m.and){
      if (m.re.test(t) && m.and.test(t)) return m;
    } else if (m.re.test(t)) return m;
  }
  return {tag:"otros", sev:0, hor:"sin plazo", act:"FYI",
          adult:"Sin efecto directo en tu día a día.",
          teen:"Sin efecto directo en tu día a día."};
}

export function generateImpactFromKeywords(title="", summary=""){
  const text = `${title} ${summary}`;
  const m = pickByKeywords(text);
  const adult = norm(m.adult);
  const teen  = norm(m.teen);

  const cleanAdult = (!adult || BANNED.some(b=>adult.toLowerCase().includes(b))) ? "Sin efecto directo en tu día a día." : adult;
  const cleanTeen  = (!teen  || BANNED.some(b=>teen.toLowerCase().includes(b))) ? "Sin efecto directo en tu día a día." : teen;

  return {
    adult: cleanAdult,
    teen: cleanTeen,
    tag: m.tag,
    severity: m.sev,
    horizon: m.hor,
    action: m.act,
    confidence: m.tag==="otros" ? 0.5 : 0.8
  };
}
