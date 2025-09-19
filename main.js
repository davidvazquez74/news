// Frontend News App
const $ = s => document.querySelector(s);
let mode = (localStorage.getItem('mode') === 'teen') ? 'teen' : 'adult';
let appVersion = localStorage.getItem('appVersion') || '';

// --- utils ---
const fmtDate = (iso) => {
  if(!iso) return '';
  try { return new Date(iso).toLocaleString('es-ES',{hour12:false}); } catch { return ''; }
};
const el = (t,c) => { const n=document.createElement(t); if(c) n.className=c; return n; };
async function fetchJSON(u){
  const r = await fetch(u + (u.includes('?')?'&':'?') + 't=' + Date.now(), {cache:'no-store'});
  if(!r.ok) throw new Error('HTTP '+r.status+' @ '+u);
  return r.json();
}

// --- render ---
function renderCard(item){
  const wrap = el('li','news-card');
  const a = el('a','news-title');
  a.target = '_blank'; a.rel='noopener noreferrer';
  a.textContent = item.title || 'Sin título';
  a.href = item.url || item.link || '#';
  wrap.appendChild(a);

  const meta = el('p','meta');
  meta.textContent = item.published_at ? fmtDate(item.published_at) : (item.published?fmtDate(item.published):'');
  if (meta.textContent) wrap.appendChild(meta);

  const impactAdult = item.impact_adult || item.impact || '';
  const impactTeen  = item.impact_teen  || '';
  const impactTxt = mode==='teen' ? (impactTeen||impactAdult) : impactAdult;
  if (impactTxt){
    const div = el('div','block');
    div.innerHTML = `<p>${impactTxt}</p>`;
    wrap.appendChild(div);
  }

  const gl = item.glossary||[];
  if (Array.isArray(gl) && gl.length){
    const g = el('div','block gloss');
    g.innerHTML = gl.map(x=>`<div class="gloss-item"><strong>${x.term}:</strong> ${x.expl||x.def||''}</div>`).join('');
    wrap.appendChild(g);
  }
  return wrap;
}

function renderSection(sel, items){
  const c = $(sel); if(!c) return;
  c.innerHTML='';
  const arr = Array.isArray(items)?items:[];
  if(!arr.length){ c.innerHTML = '<li class="empty">Sin contenidos (todavía)</li>'; return; }
  arr.forEach(n=> c.appendChild(renderCard(n)));
}

// --- load ---
async function loadAll(){
  try{
    const data = await fetchJSON('/data/latest.json');
    renderSection('#list-cataluna', data.cataluna||[]);
    renderSection('#list-espana',   data.espana||[]);
    renderSection('#list-rioja',    data.rioja||[]);
    renderSection('#list-background', data.background||[]);
    const localItems = (data.blocksOut && Array.isArray(data.blocksOut.MolinsDeRei)) ? data.blocksOut.MolinsDeRei : (data.cataluna||[]);
    renderSection('#list-local', localItems);
    $('#updatedAt').textContent = data.updated_at ? ('Actualizado: ' + fmtDate(data.updated_at)) : '';
    if (data.version){ $('#versionBadge').textContent = data.version; }
  }catch(e){
    console.error(e);
    ['#list-cataluna','#list-espana','#list-rioja','#list-background','#list-local'].forEach(id=>{
      const n=$(id); if(n) n.innerHTML='<li class="empty">No se pudieron cargar noticias.</li>';
    });
  }
}

// --- version bust + wx ---
async function checkVersion(){
  try{
    const meta = await fetchJSON('/data/meta.json');
    const newV = meta.version || '';
    if(newV && newV !== appVersion){
      localStorage.setItem('appVersion', newV);
      appVersion = newV;
      if (window.caches?.keys){
        const ks = await caches.keys();
        await Promise.all(ks.map(k=>caches.delete(k)));
      }
      location.replace((location.pathname||'/') + '?b=' + encodeURIComponent(newV));
    }
  }catch(e){ /*noop*/ }
}

async function loadWeather(){
  try{
    const res = await fetchJSON('/data/weather.json');
    const t = Math.round(res.temp_c);
    $('#wx-temp').textContent = t + '°';
    $('#wx-desc').textContent = res.desc_es || res.desc || '';
    $('#wx-icon').textContent = res.icon || '•';
  }catch{ /* optional */ }
}

// --- events ---
function bindUI(){
  const $teen = $('#teenToggle');
  if($teen){
    const pressed = (mode==='teen');
    $teen.setAttribute('aria-pressed', String(pressed));
    $teen.addEventListener('click', ()=>{
      mode = (mode==='teen') ? 'adult' : 'teen';
      localStorage.setItem('mode', mode);
      $teen.setAttribute('aria-pressed', String(mode==='teen'));
      loadAll();
    });
  }
  $('#refreshBtn')?.addEventListener('click', async ()=>{
    localStorage.removeItem('appVersion');
    if (window.caches?.keys){
      const ks = await caches.keys();
      await Promise.all(ks.map(k=>caches.delete(k)));
    }
    location.replace((location.pathname||'/') + '?force=' + Date.now());
  });
  $('#forceCacheClear')?.addEventListener('click', async (e)=>{
    e.preventDefault();
    localStorage.clear();
    if (window.caches?.keys){
      const ks = await caches.keys();
      await Promise.all(ks.map(k=>caches.delete(k)));
    }
    location.reload();
  });
}

// --- init ---
window.addEventListener('DOMContentLoaded', ()=>{
  const urlMode = new URLSearchParams(location.search).get('mode');
  if (urlMode==='teen') mode='teen';
  localStorage.setItem('mode', mode);

  bindUI();
  checkVersion();
  loadWeather();
  loadAll();
  setInterval(checkVersion, 5*60*1000);
});
