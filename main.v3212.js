// main.v3212.js
// Noticias + widget tiempo (Molins de Rei) con icono y máx/mín
const $ = s => document.querySelector(s);

let mode = (localStorage.getItem('mode') === 'teen') ? 'teen' : 'adult';
let appVersion = localStorage.getItem('appVersion') || '';

function fmtDate(iso){
  if(!iso) return '';
  try { return new Date(iso).toLocaleString(undefined,{hour12:false}); } catch { return ''; }
}
function el(t,c){const n=document.createElement(t); if(c) n.className=c; return n;}

// ---- Render cards
function renderCard(item){
  const wrap=el('article','news-card');
  const a=el('a','news-title'); a.target='_blank'; a.rel='noopener noreferrer';
  a.textContent=item.title||'Sin título'; a.href=item.url||item.link||'#'; wrap.appendChild(a);
  const meta=el('p','meta'); meta.textContent=item.published_at?fmtDate(item.published_at):''; if(meta.textContent) wrap.appendChild(meta);
  const txt=(mode==='teen')?(item.impact_teen||''):(item.impact_adult||item.impact||'');
  if(txt){ const b=el('div','block'); b.innerHTML='<p>'+txt+'</p>'; wrap.appendChild(b); }
  return wrap;
}
function renderSection(selector, items){
  const host=$(selector); if(!host) return;
  host.innerHTML='';
  (items||[]).forEach(n=>host.appendChild(renderCard(n)));
}

// ---- Data helpers
async function fetchJSON(url){ const r=await fetch(url+(url.includes('?')?'&':'?')+'t='+Date.now(),{cache:'no-store'}); return r.json(); }

async function loadAll(){
  try{
    const data=await fetchJSON('/data/latest.json');
    renderSection('#cataluna', data.cataluna||[]);
    renderSection('#espana',   data.espana||[]);
    renderSection('#rioja',    data.rioja||[]);
    renderSection('#global',   data.background||[]);
    renderSection('#local',    (data.blocksOut?.MolinsDeRei)||[]);
    $('#updatedAt').textContent = data.updated_at ? ('Actualizado: '+fmtDate(data.updated_at)) : '';
    $('#versionBadge').textContent = data.version || '';
  }catch(e){ console.error('Error cargando latest.json',e); }
}

// ---- Weather (Molins de Rei) current + hi/lo + icon
async function loadWeather(){
  const iconMap = {
    // Map wttr weatherCode -> SF-like emoji fallback
    '113':'☀️','116':'⛅','119':'☁️','122':'☁️','143':'🌫️','176':'🌦️','179':'🌨️','182':'🌧️',
    '185':'🌧️','200':'⛈️','227':'🌨️','230':'❄️','248':'🌫️','260':'🌫️','263':'🌦️','266':'🌦️',
    '281':'🌧️','284':'🌧️','293':'🌦️','296':'🌦️','299':'🌧️','302':'🌧️','305':'🌧️','308':'🌧️',
    '311':'🌧️','314':'🌧️','317':'🌧️','320':'🌨️','323':'🌨️','326':'🌨️','329':'❄️','332':'❄️',
    '335':'❄️','338':'❄️','350':'🌧️','353':'🌦️','356':'🌧️','359':'🌧️','362':'🌧️','365':'🌧️',
    '368':'🌨️','371':'❄️','386':'⛈️','389':'⛈️','392':'⛈️','395':'❄️'
  };
  try{
    const r = await fetch('https://wttr.in/Molins+de+Rei?format=j1&lang=es');
    const w = await r.json();
    const now = w.current_condition?.[0];
    const today = w.weather?.[0];
    if(!now || !today){ throw new Error('no data'); }
    const temp = now.temp_C ? (now.temp_C + '°C') : '—';
    const desc = (now.lang_es?.[0]?.value) || (now.weatherDesc?.[0]?.value) || '';
    const hi = today.maxtempC, lo = today.mintempC;
    const code = String(now.weatherCode||'');
    const iconUrl = now.weatherIconUrl?.[0]?.value || '';
    const emoji = iconMap[code] || '⛅';

    const img = document.getElementById('wIcon');
    if (iconUrl) { img.src = iconUrl; img.style.display='block'; img.setAttribute('aria-hidden','true'); }
    else { img.style.display='none'; }

    document.getElementById('wTemp').textContent = temp;
    document.getElementById('wDesc').textContent = desc;
    document.getElementById('wHiLo').textContent = `Molins de Rei  •  ↑${hi}°  ↓${lo}°`;
    document.getElementById('weatherWidget').dataset.emoji = emoji;
  }catch(e){
    document.getElementById('weatherWidget').innerHTML = '<div class="weather-inner"><div class="w-left"><span>—</span></div><div class="w-right"><small class="muted">No se pudo cargar el tiempo</small></div></div>';
  }
}

// ---- UI
function bindUI(){
  $('#tabAdult')?.addEventListener('click',()=>{ mode='adult'; localStorage.setItem('mode',mode); loadAll(); });
  $('#tabTeen')?.addEventListener('click', ()=>{ mode='teen';  localStorage.setItem('mode',mode); loadAll(); });
  $('#refreshBtn')?.addEventListener('click', ()=>{
    localStorage.removeItem('appVersion');
    const stamp=Date.now();
    location.replace((location.pathname.replace(/\/+$/,'')||'/')+'?force='+stamp);
  });
}

window.addEventListener('DOMContentLoaded', ()=>{
  bindUI();
  loadWeather();
  loadAll();
});
