
// scripts/impact_rules_v3.js
// Lightweight keyword-based impact classifier with safe defaults.
// Exports: classify(item) -> { tag, severity, horizon, action, impact_adult, impact_teen }
const URL = require('url');

const dict = {
  transporte: {
    kw: ['rodalies','renfe','adif','cercanías','cercanias','metro','bus','tmb','ave','avlo','ave-talgo','avión','aeropuerto','aena','carretera','tráfico','trafico','autopista','peaje','cortes de tráfico','huelga de tren','huelga de metro','atc','cercanías'],
    adult: 'Cambios en transporte: comprueba horarios y posibles retrasos.',
    teen: 'Trenes/metro raros hoy: mira la app y sal con margen 🚆',
    horizon: (t) => /hoy|ahora|esta tarde|esta mañana|en breve|restablecid|cortad/.test(t) ? 'hoy' : 'esta semana',
    severity: (t) => /cortad|suspendid|interrumpid|huelga|avería|incendio|tormenta/.test(t) ? 3 : 2,
    action: (t) => /restablecid|reanudad/.test(t) ? 'planificar' : 'planificar'
  },
  clima: {
    kw: ['dana','alerta amarilla','alerta naranja','ola de calor','ola de frío','temporal','tormenta','lluvia intensa','viento fuerte','inundac','granizo','nevada','riesgo meteorológico'],
    adult: 'Meteo complicada: revisa la previsión y evita desplazamientos innecesarios.',
    teen: 'Tiempo loco: chubasquero, powerbank y ojo al radar ⛈️',
    horizon: (t)=> /hoy|mañana|ahora/.test(t)?'hoy':'esta semana',
    severity: (t)=> /roja|naranja|grave|evacuac/.test(t)?3:2,
    action: _=>'planificar'
  },
  salud_publica: {
    kw: ['brote','alerta sanitaria','virus','gripe','covid','meningitis','vacun','salud pública','sanidad'],
    adult: 'Sigue indicaciones oficiales y revisa calendario de vacunas.',
    teen: 'Si hay brote: gel, sentido común y ya 😷',
    horizon: _=>'esta semana',
    severity: (t)=> /letal|mortalidad|hospitaliz/.test(t)?3:2,
    action: _=>'vigilar'
  },
  educacion: {
    kw: ['universidad','colegio','instituto','selectividad','evau','ebau','becas','matrícula','calendario escolar','huelga docente'],
    adult: 'Revisa calendario, becas y comunicaciones del centro.',
    teen: 'Profs en huelga/cambios: mira la app del insti 📚',
    horizon: (t)=> /hoy|mañana/.test(t)?'hoy':'esta semana',
    severity: 2,
    action: (t)=> /plazo|cierra|matr/i.test(t)?'accionar':'planificar'
  },
  redes_tech: {
    kw: ['tiktok','instagram','ig','x.com','twitter','whatsapp','caída','ciberataque','privacidad','datos personales','cookies','actualización'],
    adult: 'Apps y privacidad: revisa permisos y activa 2FA.',
    teen: 'Si hoy peta la app: respira, vuelve en un rato 😅',
    horizon: (t)=> /hoy|ahora/.test(t)?'hoy':'esta semana',
    severity: (t)=> /caída|brecha|hack/.test(t)?2:1,
    action: (t)=> /brecha|privacidad/.test(t)?'vigilar':'FYI'
  },
  deporte: {
    kw: ['barça','madrid','champions','liga','euroliga','derbi','partido','clasificación','fixture','calendario','entradas'],
    adult: 'Prevé cortes y aglomeraciones en horas de partido.',
    teen: 'Día de partido: quedadas sí, líos no. Llega antes ⚽',
    horizon: (t)=> /hoy|mañana/.test(t)?'hoy':'esta semana',
    severity: 2,
    action: 'planificar'
  },
  cultura: {
    kw: ['festival','concierto','estreno','museo','exposición','exposicion','entradas','gira','teatro','cine'],
    adult: 'Planifica entradas y transporte con antelación.',
    teen: 'Si vas, pilla entradas ya y mira horarios 🎟️',
    horizon: 'esta semana',
    severity: 1,
    action: 'planificar'
  },
  impuestos: {
    kw: ['irpf','iva','impuesto','cuota','cotización','cotizacion','retención','retencion','bonificación','subvención','subvencion','ayuda','renta'],
    adult: 'Podrían variar pagos o ayudas; revisa plazos y requisitos.',
    teen: 'Puede cambiar lo que cobras/pagas; coméntalo en casa 🧾',
    horizon: 'este mes',
    severity: 2,
    action: 'vigilar'
  },
  trabajo: {
    kw: ['convenio','smi','salario mínimo','oposiciones','erte','ere','paro','empleo','contrato'],
    adult: 'Comprueba nómina/condiciones y plazos de trámites.',
    teen: 'Si curres: mira turnos y nómina por si acaso 💼',
    horizon: 'este mes',
    severity: 2,
    action: 'vigilar'
  },
  seguridad: {
    kw: ['incendio','evacuación','accidente','explosión','incidente','secuestro','amenaza','bomba'],
    adult: 'Sigue indicaciones oficiales y evita la zona.',
    teen: 'Si estás cerca: cambia ruta y avisa por WhatsApp 🚨',
    horizon: 'hoy',
    severity: 3,
    action: 'planificar'
  },
  institucional: {
    kw: ['boe','decreto','congreso','senado','tsjc','tribunal','sentencia','ley','norma','boletín oficial','boletin oficial'],
    adult: 'Cambios normativos: revisa si impactan en tus trámites.',
    teen: 'Ley nueva = papeleo. Si te afecta, pregunta en casa 📝',
    horizon: 'este mes',
    severity: 2,
    action: 'vigilar'
  },
  lengua: {
    kw: ['catalán oficial','catalan oficial','cooficialidad','lenguas cooficiales','política lingüística','politica linguistica'],
    adult: 'Puede cambiar rotulación o trámites en catalán.',
    teen: 'Más catalán en apps/papeleo: chill, nada dramático 🗣️',
    horizon: 'próximos meses',
    severity: 1,
    action: 'FYI'
  }
};

const order = ['transporte','clima','salud_publica','educacion','redes_tech','deporte','cultura','impuestos','trabajo','seguridad','institucional','lengua'];

function firstTag(text) {
  const t = (text||'').toLowerCase();
  for (const key of order) {
    const {kw} = dict[key];
    if (kw.some(k => t.includes(k))) return key;
  }
  return null;
}

function fillSource(item){
  if(!item.source || !item.source.trim()){
    try {
      const host = URL.parse(item.url).host || '';
      item.source = host.replace(/^www\./,''); 
    } catch(_){ item.source = 'desconocido'; }
  }
}

function classify(item){
  const blob = [item.title, item.summary, item.source].filter(Boolean).join(' ').toLowerCase();
  let tag = firstTag(blob);

  // Transport special: AVE / Rodalies false positives under deporte
  if(!tag && /ave|rodalies|renfe|adif|cercan[ií]as|metro|tmb/.test(blob)) tag = 'transporte';

  // Fallbacks for pure política/actualidad: never leave "Sin efecto"
  if(!tag && /pp|psoe|junts|vox|podemos|moncloa|generalitat|parlament|elecciones|alcald[ií]a/.test(blob)) tag = 'institucional';

  if(!tag && /barcelona|molins de rei|catalunya|la rioja|logroño|girona|tarragona/.test(blob)) {
    tag = 'cultura'; // local soft default
  }

  if(!tag) tag = 'institucional'; // last safety net

  const d = dict[tag];

  const text = blob;
  const horizon = typeof d.horizon === 'function' ? d.horizon(text) : d.horizon;
  const severity = typeof d.severity === 'function' ? d.severity(text) : d.severity;
  const action = typeof d.action === 'function' ? d.action(text) : d.action;

  const impact_adult = d.adult;
  // Teen tone polishing with light slang + 0–2 emojis already embedded
  const impact_teen = d.teen.replace(/\s+/g,' ').trim();

  return { tag, horizon: horizon||'esta semana', severity: severity??1, action: action||'FYI', impact_adult, impact_teen };
}

module.exports = { classify, fillSource };
