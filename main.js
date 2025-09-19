// main.js – vTeen2.1 safe bootstrap
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));

// ---------- Estado ----------
let mode = (localStorage.getItem('mode') === 'teen') ? 'teen' : 'adult';
let appVersion = localStorage.getItem('appVersion') || '';

// ---------- Utils ----------
function fmtDate(iso){
  if(!iso) return '';
  try { return new Date(iso).toLocaleString('es-ES',{hour12:false}); } catch { return ''; }
}
function el(tag, cls){
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  return n;
}
function safeArray(x){ return Array.isArray(x) ? x : []; }

// ---------- Chips (opcional) ----------
function chipRow(item){
  const row = el('div','chips');
  const tag = item.tag || item.category || '';
  const sev = Number(item.severity ?? '');
  const hor = item.horizon || '';
  const act = item.action || '';
  if (tag){ const c = el('span','chip'); c.textContent = tag; row.appendChild(c); }
  if (!Number.isNaN(sev)){ const c = el('span','chip ' + (sev>=3?'bad':sev===2?'warn':'')); c.textContent = `sev:${sev}`; row.appendChild(c); }
  if (hor){ const c = el('span','chip'); c.textContent = hor; row.appendChild(c); }
  if (act){ const c = el('span','chip'); c.textContent = act; row.appendChild(c); }
  return row;
}

// ---------- Render ----------
function renderCard(item){
  const wrap = el('article','news-card');

  const a = el('a','news-title');
  a.target = '_blank'; a.rel = 'noopener noreferrer';
  a.textContent = item.title || 'Sin título';
  a.href = item.url || item.link || '#';
  wrap.appendChild(a);

  const meta = el('p','meta');
  meta.textContent = item.published_at ? fmtDate(item.published_at) : (item.published ? fmtDate(item.published) : '');
  if (meta.textContent) wrap.appendChild(meta);

  const impactAdult = item.impact_adult || item.impact || '';
  const impactTeen  = item.impact_teen  || '';
  const impactTxt   = (mode === 'teen') ? (impactTeen || impactAdult || 'Sin efecto directo en tu día a día.') : (impactAdult || 'Sin efecto directo en tu día a día.');
  if (impactTxt) {
    const impact = el('div','block');
    impact.innerHTML = `<p>${impactTxt}</p>`;
    wrap.appendChild(impact);
  }

  const gl = safeArray(item.glossary);
  if (gl.length){
    const box = el('div','block gloss');
    const ul = el('ul','glossary');
    for (const g of gl){
      const li = el('li','gloss-item');
      const term = g.term || '';
      const def  = g.expl || g.def || '';
      li.innerHTML = `<strong>${term}:</strong> ${def}`;
      ul.appendChild(li);
    }
    box.appendChild(ul);
    wrap.appendChild(box);
  }

  // chips opcionales
  const hasMeta = item.tag || (item.severity != null) || item.horizon || item.action;
  if (hasMeta) wrap.appendChild(chipRow(item));

  return wrap;
}

function renderSection(sel, items){
  const container = $(sel);
  if (!container) return;
  container.innerHTML = '';
  const arr = safeArray(items);
  if (!arr.length){
    container.innerHTML = '<p class="empty">Sin contenidos (todavía)</p>';
    return;
  }
  arr.forEach(n => container.appendChild(renderCard(n)));
}

// ---------- Carga de datos ----------
async function fetchJSON(url){
  const r = await fetch(url + (url.includes('?') ? '&' : '?') + 't=' + Date.now(), { cache: 'no-store' });
  if (!r.ok) throw new Error('HTTP ' + r.status + ' @ ' + url);
  return r.json();
}

async function loadAll(){
  try {
    const data = await fetchJSON('/data/latest.json');

    const cataluna  = data.cataluna   || [];
    const espana    = data.espana     || [];
    const rioja     = data.rioja      || [];
    const global    = data.background || [];
    const deportes  = data.deportes   || [];
    const radios    = data.radios     || [];

    const localItems = (data.blocksOut && Array.isArray(data.blocksOut.MolinsDeRei)) ? data.blocksOut.MolinsDeRei : cataluna;

    renderSection('#cataluna', cataluna);
    renderSection('#espana',   espana);
    renderSection('#rioja',    rioja);
    renderSection('#global',   global);
    renderSection('#deportes', deportes);
    renderSection('#radios',   radios.length ? radios : [{title:'Sigue la actualidad en SER, RAC1 o Catalunya Ràdio', url:'#'}]);
    renderSection('#local',    localItems);

    const updated = data.updated_at || data.generated_at || '';
    const v = data.version || '';
    const $upd = $('#generatedAt');
    if ($upd) $upd.textContent = updated ? ('Actualizado: ' + fmtDate(updated)) : '';
    const $ver = $('#versionBadge');
    if ($ver) $ver.textContent = v ? v : '';
  } catch (e) {
    console.error('Error cargando latest.json', e);
    const ids = ['#cataluna','#espana','#rioja','#global','#deportes','#radios','#local'];
    ids.forEach(id => {
      const el = $(id);
      if (el) el.innerHTML = '<p class="empty">No se pudieron cargar noticias.</p>';
    });
  }
}

// ---------- Control de versión ----------
async function checkVersion(){
  try {
    const meta = await fetchJSON('/data/meta.json');
    const newV = meta.version || '';
    if (newV && newV !== appVersion){
      localStorage.setItem('appVersion', newV);
      appVersion = newV;
      if (window.caches?.keys) {
        const ks = await caches.keys();
        await Promise.all(ks.map(k => caches.delete(k)));
      }
      const base = location.pathname.replace(/\/+$/,'') || '/';
      location.replace(base + '?b=' + encodeURIComponent(newV));
      return;
    }
  } catch (e) {
    console.warn('No se pudo comprobar meta.json', e);
  }
}

// ---------- Modo Teens (botón único) ----------
function applyMode(newMode){
  mode = (newMode === 'teen') ? 'teen' : 'adult';
  localStorage.setItem('mode', mode);
  loadAll();
  const $btn = $('#btnTeens');
  if ($btn) $btn.setAttribute('aria-pressed', String(mode==='teen'));
}

// ---------- Tabs ----------
function bindTabs(){
  $$('.tab').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      $$('.tab').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      const target = btn.getAttribute('data-target');
      $$('.pane').forEach(p=>p.classList.remove('active'));
      if (target) { const pane = document.querySelector(target); if (pane) pane.classList.add('active'); }
    });
  });
}

// ---------- Weather ----------
async function loadWeather(){
  try{
    const wx = await fetchJSON('/data/weather.json');
    const t = typeof wx.tempC === 'number' ? Math.round(wx.tempC)+'°' : '--°';
    const text = wx.summary_es || wx.summary || '—';
    $('#wxTemp').textContent = t;
    $('#wxText').textContent = text;
    $('#wxIcon').textContent = iconFor(wx.icon || text);
  }catch(e){
    $('#wxTemp').textContent = '--°';
    $('#wxText').textContent = 'Tiempo no disponible';
  }
}
function iconFor(summary){
  const s = (summary||'').toLowerCase();
  if (s.includes('lluv') || s.includes('rain')) return '☔️';
  if (s.includes('nube') || s.includes('cloud')) return '☁️';
  if (s.includes('torment') || s.includes('storm')) return '⛈️';
  if (s.includes('sol') || s.includes('clear')) return '☀️';
  if (s.includes('nieve') || s.includes('snow')) return '❄️';
  return '•';
}

// ---------- Eventos ----------
function bindUI(){
  document.getElementById('btnTeens')?.addEventListener('click', ()=>{
    applyMode(mode==='teen'?'adult':'teen');
  });
  document.getElementById('refreshBtn')?.addEventListener('click', async ()=>{
    localStorage.removeItem('appVersion');
    try {
      if (window.caches?.keys) {
        const ks = await caches.keys();
        await Promise.all(ks.map(k => caches.delete(k)));
      }
    } catch {}
    const stamp = Date.now();
    const base = location.pathname.replace(/\/+$/,'') || '/';
    location.replace(base + '?force=' + stamp);
  });
  bindTabs();
}

// ---------- Init ----------
window.addEventListener('DOMContentLoaded', () => {
  const urlMode = new URLSearchParams(location.search).get('mode');
  if (urlMode === 'teen') mode = 'teen';
  localStorage.setItem('mode', mode);

  bindUI();
  checkVersion();
  loadAll();
  loadWeather();
  setInterval(checkVersion, 5 * 60 * 1000);
});
