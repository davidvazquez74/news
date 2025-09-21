
/**
 * main.js (producción, sin mo
  // Fallback: if primary categories are empty, hydrate from blocksOut
  const mapBlocks = { cataluna: 'Catalunya', espana: 'España', rioja: 'LaRioja', background: 'Global' };
  if (latestData && latestData.blocksOut) {
    for (const [cat, boKey] of Object.entries(mapBlocks)) {
      const arr = Array.isArray(latestData[cat]) ? latestData[cat] : [];
      if (!arr.length && Array.isArray(latestData.blocksOut[boKey])) {
        latestData[cat] = latestData.blocksOut[boKey].map(n => ({
          title: n.title,
          url: n.url,
          source: n.source || '',
          published_at: n.published_at,
          summary: n.summary || '',
          impact: n.impact || 'FYI',
          impact_adult: n.impact_adult || n.impact || 'FYI',
          impact_teen: n.impact_teen || n.impact || 'FYI',
          tag: n.tag || 'otros',
          severity: (n.severity !== undefined ? n.severity : 0),
          horizon: n.horizon || 'sin plazo',
          action: n.action || 'FYI'
        }));
      }
    }
  }
cks)
 * - Carga /latest.json (raíz del sitio)
 * - Renderiza TODAS las noticias (sin límite de 3)
 * - Filtros por pills
 * - Toggle Teen guardado en localStorage
 * - Inicializa tiempo usando weather_client.js ya existente (función global WeatherClient.init)
 */
const q = (sel, el=document)=>el.querySelector(sel);
const qa = (sel, el=document)=>Array.from(el.querySelectorAll(sel));

const state = {
  teen: localStorage.getItem('nb_teen') === '1',
  data: null,
  activePill: 'cat-para-ti'
};

function fmtDate(iso){
  try { 
    const d = new Date(iso);
    return d.toLocaleString('es-ES', {hour12:false});
  } catch(e){ return iso; }
}

function setMeta(version, updatedAt){
  const appV = 'App vTeen2.3';
  const dataV = `Datos ${version||'-'}`;
  const upd = updatedAt || '—';

  q('#nbAppVersion').textContent = appV;
  q('#nbDataVersion').textContent = dataV;
  q('#nbDataUpdatedAt').textContent = upd;

  q('#nbAppVersionBottom').textContent = appV;
  q('#nbDataVersionBottom').textContent = dataV;
  q('#nbDataUpdatedAtBottom').textContent = upd;
}

function buildCard(item, teen){
  const impact = teen ? (item.impact_teen || item.impact) : (item.impact || '');
  const dateStr = item.published_at ? fmtDate(item.published_at) : '';
  const tags = [];
  if(item.tag) tags.push(`#${item.tag}`);
  if(typeof item.severity==='number') tags.push(`sev ${item.severity}`);
  const tagsHtml = tags.map(t=>`<span class="nb-tag">${t}</span>`).join('');

  return `<article class="nb-card">
    <h3 class="nb-title"><a href="${item.url}" target="_blank" rel="noopener">${item.title}</a></h3>
    ${item.summary?`<div class="nb-summary">${item.summary}</div>`:''}
    ${impact?`<div class="nb-summary"><strong>Impacto:</strong> ${impact}</div>`:''}
    <div class="nb-tags">
      ${dateStr?`<span class="nb-tag">${dateStr}</span>`:''}
      ${tagsHtml}
    </div>
  </article>`;
}

function renderCategory(list, containerId){
  const el = q(`#${containerId}`);
  if(!el) return;
  el.innerHTML = list.map(it=>buildCard(it, state.teen)).join('');
}

function renderAll(){
  const d = state.data;
  if(!d) return;

  // Set meta
  setMeta(d.version, d.updated_at);

  // Render categories
  renderCategory(d.cataluna || [], 'cat-cataluna');
  renderCategory(d.espana || [], 'cat-espana');
  renderCategory(d.rioja || [], 'cat-rioja');
  renderCategory(d.background || [], 'cat-global');

  // Mount "Para ti": pick top from each
  const forYou = []
    .concat(d.cataluna||[])
    .concat(d.espana||[])
    .concat(d.rioja||[])
    .concat(d.background||[]);
  let forYouEl = q('#cat-para-ti');
  if(!forYouEl){
    forYouEl = document.createElement('section');
    forYouEl.id = 'cat-para-ti';
    q('#content').prepend(forYouEl);
  }
  renderCategory(forYou, 'cat-para-ti');

  // Show only active section
  switchPill(state.activePill);
}

function switchPill(targetId){
  state.activePill = targetId;
  // Hide all, show target
  qa('#content > section').forEach(s=> s.style.display = 'none');
  const el = q(`#${targetId}`);
  if(el) el.style.display = '';
  qa('#nbPills .pill').forEach(b=> b.classList.toggle('active', b.dataset.target===targetId));
}

async function loadData(){
  const url = `/latest.json?ts=${Date.now()}`; // no cache
  const res = await fetch(url, {cache:'no-store'});
  if(!res.ok) throw new Error('No se pudo cargar latest.json');
  const data = await res.json();
  state.data = data;
  renderAll();
}

function wireUI(){
  // Teen toggle clickable label (text acts as switch)
  const teenInput = q('#teenToggle');
  teenInput.checked = state.teen;
  const label = q('#teenToggleLabel');
  label.addEventListener('click', (e)=>{
    setTimeout(()=>{
      state.teen = teenInput.checked;
      localStorage.setItem('nb_teen', state.teen ? '1':'0');
      renderAll();
    },0);
  });

  // Pills
  qa('#nbPills .pill').forEach(btn=>{
    btn.addEventListener('click', ()=> switchPill(btn.dataset.target));
  });

  // Footer actions
  q('#btnClearCache').addEventListener('click', async ()=>{
    try {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
      localStorage.clear();
      sessionStorage.clear();
      alert('Caché limpiada');
      location.reload();
    } catch(e){
      console.error(e); alert('No se pudo limpiar caché');
    }
  });
  q('#btnForceApp').addEventListener('click', ()=> location.reload(true));

  // Weather: use production client already in repo
  if (window.WeatherClient && typeof window.WeatherClient.init === 'function') {
    try{ window.WeatherClient.init('#weather'); }catch(e){ console.warn('Weather init fallo:', e); }
  }
}

window.addEventListener('DOMContentLoaded', async ()=>{
  wireUI();
  try{
    await loadData();
  }catch(e){
    console.error(e);
    q('#content').innerHTML = '<div class="nb-card">Error cargando latest.json</div>';
  }
});
