// main.js
// Frontend News App – coherente con latest.json generado por build_latest.js
// - Lee /data/meta.json para detectar versión nueva y forzar recarga (iPhone-friendly).
// - Carga /data/latest.json (cataluna, espana, rioja, background) y blocksOut.MolinsDeRei para "local" si existe.
// - Modo Adulto/Teen: usa impact_adult / impact_teen (fallback a impact).
// - Titular clicable (link a fuente), impacto debajo, glosario breve.
// Requiere en el HTML los elementos con IDs: #cataluna, #espana, #rioja, #global, #local,
// #tabAdult, #tabTeen, #refreshBtn, #generatedAt, #versionBadge.

const $ = s => document.querySelector(s);

// ---------- Estado ----------
let mode = (localStorage.getItem('mode') === 'teen') ? 'teen' : 'adult';
let appVersion = localStorage.getItem('appVersion') || '';

// ---------- Utils ----------
function fmtDate(iso){
  if(!iso) return '';
  try { return new Date(iso).toLocaleString(undefined,{hour12:false}); } catch { return ''; }
}
function el(tag, cls){
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  return n;
}

// ---------- Render ----------
function renderCard(item){
  const wrap = el('article','news-card');

  // Titular (link a fuente)
  const a = el('a','news-title');
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.textContent = item.title || 'Sin título';
  a.href = item.url || item.link || '#';
  wrap.appendChild(a);

  // Fecha
  const meta = el('p','meta');
  meta.textContent = item.published_at ? fmtDate(item.published_at) : (item.published ? fmtDate(item.published) : '');
  if (meta.textContent) wrap.appendChild(meta);

  // Impacto (debajo del titular, sin prefijos literales)
  const impactAdult = item.impact_adult || item.impact || '';
  const impactTeen  = item.impact_teen  || '';
  const impactTxt   = (mode === 'teen') ? impactTeen : impactAdult;
  if (impactTxt) {
    const impact = el('div','block');
    impact.innerHTML = `<p>${impactTxt}</p>`;
    wrap.appendChild(impact);
  }

  // Glosario (si viene)
  const gl = item.glossary || [];
  if (Array.isArray(gl) && gl.length){
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

  return wrap;
}

function renderSection(sel, items){
  const container = $(sel);
  if (!container) return;
  container.innerHTML = '';
  const arr = Array.isArray(items) ? items : [];
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

    // Estructura del backend:
    // - cataluna, espana, rioja, background
    // - blocksOut.MolinsDeRei (si existe) para "local"
    const cataluna  = data.cataluna   || [];
    const espana    = data.espana     || [];
    const rioja     = data.rioja      || [];
    const global    = data.background || [];

    // "Local": prioriza MolinsDeRei si backend lo expone en blocksOut; si no, usa cataluna como fallback.
    const localItems = (data.blocksOut && Array.isArray(data.blocksOut.MolinsDeRei)) ? data.blocksOut.MolinsDeRei : cataluna;

    // Render en contenedores del HTML
    renderSection('#cataluna', cataluna);
    renderSection('#espana',   espana);
    renderSection('#rioja',    rioja);
    renderSection('#global',   global);
    renderSection('#local',    localItems);

    // Marcas de tiempo y versión
    const updated = data.updated_at || data.generated_at || '';
    const v = data.version || '';
    const $upd = $('#generatedAt');
    if ($upd) $upd.textContent = updated ? ('Actualizado: ' + fmtDate(updated)) : '';
    const $ver = $('#versionBadge');
    if ($ver) $ver.textContent = v ? v : '';
  } catch (e) {
    console.error('Error cargando latest.json', e);
    const ids = ['#cataluna','#espana','#rioja','#global','#local'];
    ids.forEach(id => {
      const el = $(id);
      if (el) el.innerHTML = '<p class="empty">No se pudieron cargar noticias.</p>';
    });
  }
}

// ---------- Control de versión / bust iOS ----------
async function checkVersion(){
  try {
    const meta = await fetchJSON('/data/meta.json');
    const newV = meta.version || '';
    if (newV && newV !== appVersion){
      // Guarda y fuerza recarga para bustear caché en iOS
      localStorage.setItem('appVersion', newV);
      appVersion = newV;

      // Intenta limpiar caches si hay SW (no rompe si no existe)
      if (window.caches?.keys) {
        const ks = await caches.keys();
        await Promise.all(ks.map(k => caches.delete(k)));
      }
      // Recarga dura con bust en URL
      const base = location.pathname.replace(/\/+$/,'') || '/';
      location.replace(base + '?b=' + encodeURIComponent(newV));
      return;
    }
  } catch (e) {
    console.warn('No se pudo comprobar meta.json', e);
  }
}

// ---------- Modo Adulto/Teen ----------
function applyMode(newMode){
  mode = (newMode === 'teen') ? 'teen' : 'adult';
  localStorage.setItem('mode', mode);

  // Re-render con el modo actual (sin re-descargar JSON)
  loadAll();

  // Estado visual de tabs (si existen)
  const $adult = document.getElementById('tabAdult');
  const $teen  = document.getElementById('tabTeen');
  if ($adult) $adult.classList.toggle('active', mode==='adult');
  if ($teen)  $teen.classList.toggle('active',  mode==='teen');
}

// ---------- Eventos ----------
function bindUI(){
  const $btnRefresh = document.getElementById('refreshBtn');
  if ($btnRefresh){
    $btnRefresh.addEventListener('click', async ()=>{
      // Forzar versión "nueva" para bustear en iOS
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
  }

  const $adult = document.getElementById('tabAdult');
  const $teen  = document.getElementById('tabTeen');
  if ($adult) $adult.addEventListener('click', ()=> applyMode('adult'));
  if ($teen)  $teen.addEventListener('click',  ()=> applyMode('teen'));
}

// ---------- Init ----------
window.addEventListener('DOMContentLoaded', () => {
  // Recupera modo guardado o ?mode=teen
  const urlMode = new URLSearchParams(location.search).get('mode');
  if (urlMode === 'teen') mode = 'teen';
  localStorage.setItem('mode', mode);

  bindUI();
  // 1) Chequear versión (puede recargar si cambia).
  checkVersion();
  // 2) Cargar noticias (usa bust ?t=).
  loadAll();
  // 3) Re-chequear versión cada 5 min
  setInterval(checkVersion, 5 * 60 * 1000);
});
