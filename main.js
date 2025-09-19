// main.js — solución 5: botón Teens único + versión en footer
const $ = s => document.querySelector(s);

let mode = (localStorage.getItem('mode') === 'teen') ? 'teen' : 'adult';
let appVersion = localStorage.getItem('appVersion') || '';

const ICONS = {
  Clear: '☀️', Sunny:'☀️', Clouds:'☁️', Cloudy:'☁️', Rain:'🌧️', Drizzle:'🌦️', Thunderstorm:'⛈️',
  Snow:'❄️', Mist:'🌫️', Haze:'🌫️', Fog:'🌫️'
};

function fmtDate(iso){
  if(!iso) return '';
  try{ return new Date(iso).toLocaleString(undefined,{hour12:false}); }catch{ return ''; }
}
function el(tag, cls){ const n=document.createElement(tag); if(cls) n.className=cls; return n; }

// --------- Render ---------
function renderCard(item){
  const wrap = el('article','news-card');
  const a = el('a','news-title'); a.target='_blank'; a.rel='noopener noreferrer';
  a.textContent = item.title || 'Sin título'; a.href = item.url || item.link || '#'; wrap.appendChild(a);
  const meta = el('p','meta');
  meta.textContent = item.published_at ? fmtDate(item.published_at) : (item.published ? fmtDate(item.published) : '');
  if (meta.textContent) wrap.appendChild(meta);
  const impact = (mode==='teen') ? (item.impact_teen || '') : (item.impact_adult || item.impact || '');
  if (impact){ const b = el('div','block'); b.innerHTML = `<p>${impact}</p>`; wrap.appendChild(b); }
  const gl = Array.isArray(item.glossary) ? item.glossary : [];
  if (gl.length){
    const box = el('div','block gloss'); const ul = el('ul','glossary');
    for (const g of gl){ const li = el('li','gloss-item'); li.innerHTML = `<strong>${g.term||''}:</strong> ${g.expl||g.def||''}`; ul.appendChild(li); }
    box.appendChild(ul); wrap.appendChild(box);
  }
  return wrap;
}
function renderList(id, items){
  const c = $(id); if(!c) return; c.innerHTML='';
  const arr = Array.isArray(items) ? items : [];
  if(!arr.length){ c.innerHTML = '<p class="empty">Sin contenidos (todavía)</p>'; return; }
  arr.forEach(n => c.appendChild(renderCard(n)));
}

// --------- Fetch helpers ---------
async function fetchJSON(url){
  const r = await fetch(url + (url.includes('?')?'&':'?') + 't=' + Date.now(), {cache:'no-store'});
  if(!r.ok) throw new Error('HTTP '+r.status); return r.json();
}

// --------- Data loaders ---------
async function loadAll(){
  try{
    const data = await fetchJSON('/data/latest.json');
    renderList('#list-cataluna',  data.cataluna||[]);
    renderList('#list-espana',    data.espana||[]);
    renderList('#list-rioja',     data.rioja||[]);
    renderList('#list-background',data.background||[]);
    // Local: si existe blocksOut.MolinsDeRei úsalo, si no, cataluna
    const localItems = (data.blocksOut && Array.isArray(data.blocksOut.MolinsDeRei)) ? data.blocksOut.MolinsDeRei : (data.cataluna||[]);
    renderList('#list-local', localItems);
    $('#updatedAt').textContent = data.updated_at ? 'Actualizado: ' + fmtDate(data.updated_at) : '';
    // Footer version
    if (data.version) { appVersion = data.version; localStorage.setItem('appVersion', appVersion); }
    const $ver = $('#versionBadge'); if ($ver) $ver.textContent = appVersion || '—';
  }catch(e){
    console.error('loadAll', e);
    ['#list-cataluna','#list-espana','#list-rioja','#list-background','#list-local'].forEach(id=>{
      const el = $(id); if (el) el.innerHTML='<p class="empty">No se pudieron cargar noticias.</p>';
    });
  }
}

// Mini weather: lee /data/weather.json si existe (tempC, summary, icon)
async function loadWeather(){
  try{
    const w = await fetchJSON('/data/weather.json');
    const box = $('#wx'); if(!box) return;
    const t = typeof w.tempC==='number' ? Math.round(w.tempC)+'°C' : (w.temp||'--°C');
    const s = w.summary || w.desc || '';
    const i = ICONS[w.icon] || ICONS[w.summary] || '•';
    $('#wxTemp').textContent = t;
    $('#wxSummary').textContent = s;
    $('#wxIcon').textContent = i;
    box.hidden = false;
  }catch{ /* opcional */ }
}

// --------- Mode toggle (único botón Teens) ---------
function applyMode(newMode){
  mode = (newMode==='teen') ? 'teen' : 'adult';
  localStorage.setItem('mode', mode);
  const $tg = $('#teenToggle');
  if ($tg) $tg.setAttribute('aria-pressed', String(mode==='teen'));
  loadAll();
}
function toggleTeens(){
  applyMode(mode==='teen' ? 'adult' : 'teen');
}

// --------- Version check (meta.json) ---------
async function checkVersion(){
  try{
    const meta = await fetchJSON('/data/meta.json');
    const newV = meta.version || '';
    if(newV && newV !== appVersion){
      localStorage.setItem('appVersion', newV);
      appVersion = newV;
      if (window.caches?.keys) {
        const ks = await caches.keys(); await Promise.all(ks.map(k=>caches.delete(k)));
      }
      location.replace((location.pathname.replace(/\/+/g,'/')) + '?b=' + encodeURIComponent(newV));
    }
  }catch{}
}

// --------- Init ---------
window.addEventListener('DOMContentLoaded', ()=>{
  // initial mode (query overrides)
  const urlMode = new URLSearchParams(location.search).get('mode');
  if (urlMode==='teen') mode='teen';
  localStorage.setItem('mode', mode);
  // bind
  $('#refreshBtn')?.addEventListener('click', ()=>{
    localStorage.removeItem('appVersion');
    location.replace((location.pathname.replace(/\/+/g,'/')) + '?force=' + Date.now());
  });
  $('#teenToggle')?.addEventListener('click', toggleTeens);
  // paint state
  $('#teenToggle')?.setAttribute('aria-pressed', String(mode==='teen'));
  // load
  checkVersion();
  loadWeather();
  loadAll();
  setInterval(checkVersion, 5*60*1000);
});
