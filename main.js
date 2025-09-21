/**
 * main.js (producción)
 * - Carga /latest.json (raíz del sitio)
 * - Renderiza TODAS las noticias (sin límite de 3)
 * - Filtros por pills (Para ti / Cataluña / España / La Rioja / Mundo)
 * - Toggle Teen guardado en localStorage
 * - Inicializa tiempo usando WeatherClient.init (si existe)
 * - Fallback: si las categorías principales vienen vacías, usa blocksOut.{Catalunya,España,LaRioja,Global}
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
    if (isNaN(d.getTime())) return iso || '';
    return d.toLocaleString('es-ES', {hour12:false});
  } catch(e){ return iso || ''; }
}

function setMeta(version, updatedAt){
  const appV = 'App vTeen2.3';
  const dataV = `Datos ${version||'-'}`;
  const upd = updatedAt || '—';

  const topV = q('#nbAppVersion');        if (topV) topV.textContent = appV;
  const topD = q('#nbDataVersion');       if (topD) topD.textContent = dataV;
  const topU = q('#nbDataUpdatedAt');     if (topU) topU.textContent = upd;

  const botV = q('#nbAppVersionBottom');  if (botV) botV.textContent = appV;
  const botD = q('#nbDataVersionBottom'); if (botD) botD.textContent = dataV;
  const botU = q('#nbDataUpdatedAtBottom'); if (botU) botU.textContent = upd;
}

function buildCard(item, teen){
  const impact = teen ? (item.impact_teen || item.impact) : (item.impact || '');
  const dateStr = item.published_at ? fmtDate(item.published_at) : '';
  const tags = [];
  if(item.tag) tags.push(`#${item.tag}`);
  if(typeof item.severity==='number') tags.push(`sev ${item.severity}`);
  const tagsHtml = tags.map(t=>`<span class="nb-tag">${t}</span>`).join('');

  const safeUrl = item.url || '#';
  const safeTitle = item.title || '(Sin título)';
  const safeSummary = item.summary || '';

  return `<article class="nb-card">
    <h3 class="nb-title"><a href="${safeUrl}" target="_blank" rel="noopener">${safeTitle}</a></h3>
    ${safeSummary?`<div class="nb-summary">${safeSummary}</div>`:''}
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

function switchPill(targetId){
  state.activePill = targetId;
  qa('#content > section').forEach(s=> s.style.display = 'none');
  const el = q(`#${targetId}`);
  if(el) el.style.display = '';
  qa('#nbPills .pill').forEach(b=> b.classList.toggle('active', b.dataset.target===targetId));
}

function buildForYou(d){
  const pick = (arr)=>Array.isArray(arr)?arr:[];
  return []
    .concat(pick(d.cataluna).slice(0,50))
    .concat(pick(d.espana).slice(0,50))
    .concat(pick(d.rioja).slice(0,50))
    .concat(pick(d.background).slice(0,50));
}

function normalizeFromBlocksOut(data){
  const mapBlocks = { cataluna: 'Catalunya', espana: 'España', rioja: 'LaRioja', background: 'Global' };
  if (data && data.blocksOut) {
    for (const [cat, boKey] of Object.entries(mapBlocks)) {
      const arr = Array.isArray(data[cat]) ? data[cat] : [];
      if (!arr.length && Array.isArray(data.blocksOut[boKey])) {
        data[cat] = data.blocksOut[boKey].map(n => ({
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
  return data;
}

function ensureSections(){
  const content = q('#content');
  if (!q('#cat-para-ti')) {
    const s = document.createElement('section'); s.id = 'cat-para-ti'; content.prepend(s);
  }
  ['cat-cataluna','cat-espana','cat-rioja','cat-global'].forEach(id=>{
    if (!q('#'+id)) {
      const s = document.createElement('section'); s.id = id; content.appendChild(s);
    }
  });
}

function renderAll(){
  const d = state.data;
  if(!d) return;

  setMeta(d.version, d.updated_at);
  ensureSections();

  renderCategory(d.cataluna || [], 'cat-cataluna');
  renderCategory(d.espana || [], 'cat-espana');
  renderCategory(d.rioja || [], 'cat-rioja');
  renderCategory(d.background || [], 'cat-global');

  const forYou = buildForYou(d);
  renderCategory(forYou, 'cat-para-ti');

  switchPill(state.activePill);
}

async function loadData(){
  // Intentar primero en /data/latest.json y después en /latest.json
  let data = null;
  const urls = [
    `/data/latest.json?ts=${Date.now()}`,
    `/latest.json?ts=${Date.now()}`
  ];
  let lastErr = null;
  for (const url of urls){
    try{
      const res = await fetch(url, {cache:'no-store'});
      if(!res.ok) throw new Error(`HTTP ${res.status}`);
      data = await res.json();
      break;
    }catch(e){ lastErr = e; }
  }
  if(!data) throw lastErr || new Error('No se pudo cargar latest.json');

  // Normalizar con blocksOut si faltan categorías
  state.data = normalizeFromBlocksOut(data);

  renderAll();
}

function wireUI(){
  // Teen toggle usando el literal como switch
  const teenInput = q('#teenToggle');
  if (teenInput) teenInput.checked = state.teen;
  const label = q('#teenToggleLabel');
  if (label) {
    label.addEventListener('click', ()=>{
      // Esperar al cambio del checkbox (si existe), o alternar manual
      if (teenInput) teenInput.checked = !teenInput.checked;
      state.teen = teenInput ? !!teenInput.checked : !state.teen;
      localStorage.setItem('nb_teen', state.teen ? '1':'0');
      renderAll();
    });
  }

  // Pills
  qa('#nbPills .pill').forEach(btn=>{
    btn.addEventListener('click', ()=> switchPill(btn.dataset.target));
  });

  // Footer actions
  const btnClear = q('#btnClearCache');
  if (btnClear) btnClear.addEventListener('click', async ()=>{
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
  const btnForce = q('#btnForceApp');
  if (btnForce) btnForce.addEventListener('click', ()=> location.reload(true));

  // Weather (si existe)
  if (window.WeatherClient && typeof window.WeatherClient.init === 'function') {
    try{ window.WeatherClient.init('#weather'); }catch(e){ console.warn('Weather init fallo:', e); }
  }
}

window.addEventListener('DOMContentLoaded', async ()=>{
  try{
    wireUI();
    await loadData();
  }catch(e){
    console.error(e);
    const content = q('#content');
    if (content) content.innerHTML = '<div class="nb-card">Error cargando latest.json</div>';
  }
});
