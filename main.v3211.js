// main.v3211.js
const $ = s => document.querySelector(s);

let mode = (localStorage.getItem('mode') === 'teen') ? 'teen' : 'adult';
let appVersion = localStorage.getItem('appVersion') || '';

function fmtDate(iso){
  if(!iso) return '';
  try { return new Date(iso).toLocaleString(undefined,{hour12:false}); } catch { return ''; }
}
function el(tag, cls){
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  return n;
}

function renderCard(item){
  const wrap = el('article','news-card');
  const a = el('a','news-title');
  a.target = '_blank'; a.rel = 'noopener noreferrer';
  a.textContent = item.title || 'Sin título';
  a.href = item.url || item.link || '#';
  wrap.appendChild(a);
  const meta = el('p','meta');
  meta.textContent = item.published_at ? fmtDate(item.published_at) : '';
  if (meta.textContent) wrap.appendChild(meta);
  const impactTxt = (mode === 'teen') ? (item.impact_teen||'') : (item.impact_adult||item.impact||'');
  if (impactTxt){
    const impact = el('div','block'); impact.innerHTML = `<p>${impactTxt}</p>`;
    wrap.appendChild(impact);
  }
  return wrap;
}

function renderSection(sel, items){
  const container = $(sel);
  if (!container) return;
  container.innerHTML = '';
  const arr = Array.isArray(items) ? items : [];
  if (!arr.length){ container.innerHTML = '<p class="empty">Sin contenidos</p>'; return; }
  arr.forEach(n => container.appendChild(renderCard(n)));
}

async function fetchJSON(url){
  const r = await fetch(url + (url.includes('?') ? '&':'?') + 't=' + Date.now(), { cache:'no-store'});
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return r.json();
}

async function loadAll(){
  try {
    const data = await fetchJSON('/data/latest.json');
    renderSection('#cataluna', data.cataluna||[]);
    renderSection('#espana', data.espana||[]);
    renderSection('#rioja', data.rioja||[]);
    renderSection('#global', data.background||[]);
    renderSection('#local', (data.blocksOut?.MolinsDeRei)||[]);
    const $upd = $('#updatedAt'); if ($upd) $upd.textContent = data.updated_at ? 'Actualizado: '+fmtDate(data.updated_at):'';
    const $ver = $('#versionBadge'); if ($ver) $ver.textContent = data.version||'';
  } catch(e){
    console.error(e);
  }
}

async function loadWeather(){
  try{
    const r = await fetch('https://wttr.in/Molins+de+Rei?format=j1');
    const j = await r.json();
    const current = j.current_condition?.[0];
    if (current){
      const temp = current.temp_C + '°C';
      const desc = current.weatherDesc?.[0]?.value || '';
      const icon = current.weatherIconUrl?.[0]?.value || '';
      $('#weatherWidget').innerHTML = `<img src="${icon}" alt="" class="wicon"> <span>${temp} ${desc}</span>`;
    }
  }catch(e){ console.warn('Weather fail', e); }
}

function applyMode(newMode){
  mode = (newMode==='teen') ? 'teen':'adult';
  localStorage.setItem('mode', mode);
  loadAll();
  const $teen = document.getElementById('tabTeen');
  if ($teen) $teen.classList.toggle('active', mode==='teen');
}

function bindUI(){
  $('#refreshBtn')?.addEventListener('click', ()=>{ location.reload(true); });
  $('#tabTeen')?.addEventListener('click', ()=> applyMode(mode==='teen'?'adult':'teen'));
}

window.addEventListener('DOMContentLoaded', ()=>{
  bindUI();
  loadWeather();
  loadAll();
});