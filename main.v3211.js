// main.v3211.js
// Frontend con widget del tiempo
const $ = s => document.querySelector(s);

let mode = (localStorage.getItem('mode') === 'teen') ? 'teen' : 'adult';
let appVersion = localStorage.getItem('appVersion') || '';

function fmtDate(iso){
  if(!iso) return '';
  try { return new Date(iso).toLocaleString(undefined,{hour12:false}); } catch { return ''; }
}
function el(tag, cls){ const n=document.createElement(tag); if(cls) n.className=cls; return n; }

// --- Render noticias ---
function renderCard(item){
  const wrap = el('article','news-card');
  const a = el('a','news-title'); a.target='_blank'; a.rel='noopener noreferrer';
  a.textContent=item.title||'Sin título'; a.href=item.url||item.link||'#'; wrap.appendChild(a);
  const meta=el('p','meta'); meta.textContent=item.published_at?fmtDate(item.published_at):''; if(meta.textContent) wrap.appendChild(meta);
  const txt=(mode==='teen')?(item.impact_teen||''):(item.impact_adult||item.impact||''); if(txt){ const b=el('div','block'); b.innerHTML='<p>'+txt+'</p>'; wrap.appendChild(b); }
  return wrap;
}
function renderSection(sel, items){ const c=$(sel); if(!c) return; c.innerHTML=''; (items||[]).forEach(n=>c.appendChild(renderCard(n))); }

async function fetchJSON(url){ const r=await fetch(url+'?t='+Date.now(),{cache:'no-store'}); return r.json(); }

async function loadAll(){
  try{
    const data=await fetchJSON('/data/latest.json');
    renderSection('#cataluna',data.cataluna||[]);
    renderSection('#espana',data.espana||[]);
    renderSection('#rioja',data.rioja||[]);
    renderSection('#global',data.background||[]);
    renderSection('#local',(data.blocksOut?.MolinsDeRei)||[]);
    $('#updatedAt').textContent=data.updated_at?('Actualizado: '+fmtDate(data.updated_at)):'';
    $('#versionBadge').textContent=data.version||'';
  }catch(e){ console.error('Error cargando noticias',e); }
}

// --- Tiempo Molins de Rei ---
async function loadWeather(){
  try{
    const url='https://wttr.in/Molins+de+Rei?format=j1';
    const r=await fetch(url); const w=await r.json();
    const now=w.current_condition?.[0];
    if(!now){ $('#weatherWidget').innerHTML='<p>Error al cargar el tiempo.</p>'; return; }
    const temp=now.temp_C+'°C';
    const desc=now.weatherDesc?.[0]?.value||'';
    $('#weatherWidget').innerHTML='<div class="weather-now"><span>'+temp+'</span><small>'+desc+'</small></div>';
  }catch{ $('#weatherWidget').innerHTML='<p>Error al cargar tiempo.</p>'; }
}

// --- Init ---
window.addEventListener('DOMContentLoaded',()=>{
  document.getElementById('tabAdult').addEventListener('click',()=>{mode='adult';localStorage.setItem('mode',mode);loadAll();});
  document.getElementById('tabTeen').addEventListener('click',()=>{mode='teen';localStorage.setItem('mode',mode);loadAll();});
  document.getElementById('refreshBtn').addEventListener('click',()=>loadAll());
  loadWeather();
  loadAll();
});