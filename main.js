
function fmtDate(date){
  const d = new Date(date);
  const pad = n => String(n).padStart(2,'0');
  return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ---------- Heurísticas y overrides de impacto ----------
const OVERRIDES = {
  energia: {
    impact:       "Vigila precios y consumo estos días.",
    impact_adult: "Vigila precios y consumo estos días.",
    impact_teen:  "Gasolina/luz más volátil: plan con cabeza 💡",
    action:       "vigilar",
    defaultH:     "esta semana",
    minSeverity:  2,
  },
  impuestos: {
    impact:       "Podrían variar pagos o ayudas; revisa plazos y requisitos.",
    impact_adult: "Podrían variar pagos o ayudas; revisa plazos y requisitos.",
    impact_teen:  "Puede cambiar lo que cobras/pagas; coméntalo en casa 🧾",
    action:       "vigilar",
    defaultH:     "este mes",
    minSeverity:  2,
  },
  salud_publica: {
    impact:       "Sigue indicaciones oficiales y revisa calendario de vacunas.",
    impact_adult: "Sigue indicaciones oficiales y revisa calendario de vacunas.",
    impact_teen:  "Si hay brote: gel, sentido común y ya 😷",
    action:       "vigilar",
    defaultH:     "esta semana",
    minSeverity:  2,
  },
  educacion: {
    impact:       "Revisa calendario, becas y comunicaciones del centro.",
    impact_adult: "Revisa calendario, becas y comunicaciones del centro.",
    impact_teen:  "Profs de huelga/cambios: mira la app del insti 📚",
    action:       "planificar",
    defaultH:     "esta semana",
    minSeverity:  2,
  },
  ciberseguridad: {
    impact:       "Posibles interrupciones en servicios digitales; ten planes alternativos.",
    impact_adult: "Posibles interrupciones en servicios digitales; ten planes alternativos.",
    impact_teen:  "Apps/servicios KO a ratos: respira y ten plan B 📵",
    action:       "planificar",
    defaultH:     "hoy",
    minSeverity:  2,
  },
};

function guessTag(item){
  const t = (item.tag||'').toLowerCase();
  if (t && t !== 'otros') return t;
  const text = `${item.title||''} ${item.summary||''}`.toLowerCase();
  const has = (s)=> text.includes(s);
  if (has('luz')||has('gas')||has('energ')) return 'energia';
  if (has('impuesto')||has('iva')||has('tarifa')||has('ayuda')||has('subsidio')) return 'impuestos';
  if (has('salud')||has('virus')||has('brote')||has('vacun')) return 'salud_publica';
  if (has('colegio')||has('universidad')||has('escuela')||has('beca')) return 'educacion';
  if (has('ciberataque')||has('hack')||has('ransom')||has('sistemas caídos')||has('colapsa los aeropuertos')||has('algoritmo')||has('automatiz')) return 'ciberseguridad';
  return 'otros';
}

function patchItem(item){
  const tag = guessTag(item);
  const isGeneric = (s)=> !s || /^sin efecto directo/i.test(s);
  if (OVERRIDES[tag] && (isGeneric(item.impact)||isGeneric(item.impact_adult)||isGeneric(item.impact_teen))){
    const o = OVERRIDES[tag];
    item.tag = tag;
    item.impact       = o.impact;
    item.impact_adult = o.impact_adult;
    item.impact_teen  = o.impact_teen;
    item.action       = item.action && item.action !== 'FYI' ? item.action : o.action;
    item.horizon      = item.horizon && item.horizon !== 'sin plazo' ? item.horizon : o.defaultH;
    item.severity     = Math.max(item.severity||0, o.minSeverity);
  }
  return item;
}

function patchAll(latest){
  ['cataluna','espana','rioja','background','deportes'].forEach(key=>{
    if (Array.isArray(latest[key])) latest[key] = latest[key].map(patchItem);
  });
  return latest;
}

function renderFooter(latest){
  const footer = document.getElementById('app-footer');
  const when = fmtDate(latest.updated_at || Date.now());
  const dataVersion = latest.version || 'v-unknown';
  footer.innerHTML = `<span>App ${APP_VERSION}</span> • <span>Datos ${dataVersion}</span> • <span class="right">${when}</span>`;
}

function severityBadge(n){
  const s = Number(n)||0;
  const label = ['baja','media','alta','crítica'][Math.min(s,3)] || 'baja';
  return `<span class="badge sev-${Math.min(s,3)}">sev ${s} · ${label}</span>`;
}

function card(item){
  const pub = item.published_at ? fmtDate(item.published_at) : '—';
  const chip = item.tag ? `<span class="chip">#${item.tag}</span>` : '';
  const act = item.action && item.action!=='FYI' ? ` • acción: ${item.action}` : '';
  const hor = item.horizon && item.horizon!=='sin plazo' ? ` • horizonte: ${item.horizon}` : '';
  return `
  <article class="card">
    <h3><a href="${item.url}" target="_blank" rel="noopener">${item.title}</a></h3>
    <div class="meta">
      <span>${pub}</span>
      ${chip}
      ${severityBadge(item.severity)}
      <span>${act}${hor}</span>
    </div>
    <p>${item.summary||''}</p>
    <div class="impacts">
      <p><strong>Impacto (general):</strong> ${item.impact||'—'}</p>
      <p><strong>Adultos:</strong> ${item.impact_adult||'—'}</p>
      <p><strong>Teen:</strong> ${item.impact_teen||'—'}</p>
    </div>
  </article>`;
}

function render(latest){
  const feed = document.getElementById('feed');
  const sections = ['cataluna','espana','rioja','background'];
  let html = '';
  sections.forEach(key=>{
    const list = latest[key];
    if (Array.isArray(list) && list.length){
      html += `<h2 style="margin:10px 2px 4px;font-size:14px;color:#9aa7b2;text-transform:uppercase">${key}</h2>`;
      list.forEach(item=> html += card(item));
    }
  });
  feed.innerHTML = html || '<p>No hay items.</p>';
}

async function boot(){
  try{
    const res = await fetch(LATEST_URL, {cache:'no-store'});
    const latest = await res.json();
    patchAll(latest);
    renderFooter(latest);
    render(latest);
  }catch(e){
    console.error(e);
    document.getElementById('feed').innerHTML = '<p>Error cargando latest.json</p>';
    document.getElementById('app-footer').textContent = `App ${APP_VERSION} • Datos — • ${fmtDate(Date.now())}`;
  }
}

boot();
