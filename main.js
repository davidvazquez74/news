// main.v3209.js
// App de noticias (Apple-friendly) con:
// - Versión dinámica desde /data/meta.json (badge #versionBadge) y bust de caché en iPhone.
// - Carga /data/latest.json con compat (cataluna, espana, rioja, background) y "local" (MolinsDeRei si existe).
// - Modo Adulto / Teens: impact_adult / impact_teen (fallback a impact).
// - Render en listas UL con IDs: #list-cataluna, #list-espana, #list-rioja, #list-local, #list-background.
// - Botones por ID: #refreshBtn, #adultBtn, #teenToggle. Marca aria-selected.

const $ = (s) => document.querySelector(s);

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
function textOr(s, d=''){ return (typeof s === 'string' && s.trim().length) ? s : d; }

async function fetchJSON(url){
  const r = await fetch(url + (url.includes('?') ? '&' : '?') + 't=' + Date.now(), { cache: 'no-store' });
  if (!r.ok) throw new Error('HTTP ' + r.status + ' @ ' + url);
  return r.json();
}

// ---------- Control de versión / badge ----------
async function checkVersion(){
  try {
    const meta = await fetchJSON('/data/meta.json');
    const newV = meta.version || '';
    const badge = $('#versionBadge');
    if (badge) badge.textContent = newV || '—';

    if (newV && newV !== appVersion){
      localStorage.setItem('appVersion', newV);
      appVersion = newV;

      // Limpia caches si existe SW (no falla si no hay)
      try {
        if (window.caches?.keys) {
          const ks = await caches.keys();
          await Promise.all(ks.map(k => caches.delete(k)));
        }
      } catch {}

      // Recarga dura con parámetro bust
      const base = location.pathname.replace(/\/+$/,'') || '/';
      location.replace(base + '?b=' + encodeURIComponent(newV));
      return;
    }
  } catch (e) {
    console.warn('No se pudo comprobar meta.json', e);
  }
}

// ---------- Render ----------
function renderItemLI(item){
  const li = el('li','news-card');

  // Título (link a fuente)
  const a = el('a','news-title');
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.href = item.url || item.link || '#';
  a.textContent = textOr(item.title, 'Sin título');
  li.appendChild(a);

  // Meta: fecha + fuente si viene
  const when = item.published_at || item.published || '';
  const metaP = el('p','meta');
  const sourceTxt = item.source ? ` • ${item.source}` : '';
  metaP.textContent = (when ? fmtDate(when) : '') + sourceTxt;
  if (metaP.textContent.trim()) li.appendChild(metaP);

  // Impacto (debajo del titular, sin prefijos literales)
  const impactAdult = item.impact_adult || item.impact || '';
  const impactTeen  = item.impact_teen  || '';
  const impactTxt   = (mode === 'teen') ? impactTeen : impactAdult;
  if (impactTxt){
    const p = el('p','impact');
    p.textContent = impactTxt;
    li.appendChild(p);
  }

  // Glosario (si viene)
  const gl = Array.isArray(item.glossary) ? item.glossary : [];
  if (gl.length){
    const box = el('div','gloss');
    for (const g of gl){
      const row = el('div','gloss-item');
      const term = textOr(g.term);
      const def  = textOr(g.expl || g.def);
      row.innerHTML = `<strong>${term}:</strong> ${def}`;
      box.appendChild(row);
    }
    li.appendChild(box);
  }

  return li;
}

function renderList(selector, items){
  const ul = $(selector);
  if (!ul) return;
  ul.innerHTML = '';
  const arr = Array.isArray(items) ? items : [];
  if (!arr.length){
    ul.innerHTML = `<li class="empty">Sin contenidos (todavía).</li>`;
    return;
  }
  for (const it of arr) ul.appendChild(renderItemLI(it));
}

// ---------- Carga de datos ----------
async function loadAll(){
  try {
    const data = await fetchJSON('/data/latest.json');

    // Compat backend:
    const cataluna  = data.cataluna   || [];
    const espana    = data.espana     || [];
    const rioja     = data.rioja      || [];
    const global    = data.background || [];

    // Local: usa MolinsDeRei si está, si no fallback a Cataluña
    const localItems = (data.blocksOut && Array.isArray(data.blocksOut.MolinsDeRei))
      ? data.blocksOut.MolinsDeRei
      : cataluna;

    renderList('#list-cataluna',   cataluna);
    renderList('#list-espana',     espana);
    renderList('#list-rioja',      rioja);
    renderList('#list-background', global);
    renderList('#list-local',      localItems);

    // Marca de tiempo
    const updated = data.updated_at || data.generated_at || '';
    const $upd = $('#updatedAt');
    if ($upd) $upd.textContent = updated ? ('Actualizado: ' + fmtDate(updated)) : '—';

    // Badge de versión (fallback si el inline del index aún no ha pintado)
    const v = data.version || '';
    const $ver = $('#versionBadge');
    if ($ver && !$ver.textContent.trim()) $ver.textContent = v || '—';

  } catch (e) {
    console.error('Error cargando latest.json', e);
    ['#list-cataluna','#list-espana','#list-rioja','#list-local','#list-background'].forEach(sel=>{
      const ul = $(sel);
      if (ul) ul.innerHTML = `<li class="empty">No se pudieron cargar noticias.</li>`;
    });
  }
}

// ---------- Modo Adulto/Teens ----------
function applyMode(newMode){
  mode = (newMode === 'teen') ? 'teen' : 'adult';
  localStorage.setItem('mode', mode);

  // Actualiza aria-selected en los botones reales del HTML
  $('#adultBtn')?.setAttribute('aria-selected', String(mode === 'adult'));
  $('#teenToggle')?.setAttribute('aria-selected', String(mode === 'teen'));

  // Re-render (sencillo: vuelve a pintar con el modo actual)
  loadAll();
}

// ---------- Eventos ----------
function bindUI(){
  $('#adultBtn')?.addEventListener('click', ()=> applyMode('adult'));
  $('#teenToggle')?.addEventListener('click', ()=> applyMode('teen'));

  $('#refreshBtn')?.addEventListener('click', async ()=>{
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

  $('#forceCacheClear')?.addEventListener('click', async (e)=>{
    e.preventDefault();
    localStorage.clear();
    try {
      if (window.caches?.keys) {
        const ks = await caches.keys();
        await Promise.all(ks.map(k => caches.delete(k)));
      }
    } catch {}
    alert('Caché limpiada. Recargando…');
    location.replace((location.pathname || '/') + '?clear=' + Date.now());
  });
}

// ---------- Init ----------
window.addEventListener('DOMContentLoaded', () => {
  // Modo por URL (?mode=teen) o guardado
  const urlMode = new URLSearchParams(location.search).get('mode');
  if (urlMode === 'teen') mode = 'teen';
  localStorage.setItem('mode', mode);

  // Marca aria-selected inicial según modo
  $('#adultBtn')?.setAttribute('aria-selected', String(mode === 'adult'));
  $('#teenToggle')?.setAttribute('aria-selected', String(mode === 'teen'));

  bindUI();

  // 1) Chequear versión (puede recargar si cambia)
  checkVersion();
  // 2) Cargar noticias
  loadAll();
  // 3) Re-chequear versión cada 5 min
  setInterval(checkVersion, 5 * 60 * 1000);
});
