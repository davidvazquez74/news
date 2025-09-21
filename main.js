<script>
// ====== helpers ======
const $ = (s, el=document) => el.querySelector(s);
const $$ = (s, el=document) => Array.from(el.querySelectorAll(s));

const state = {
  teen: localStorage.getItem('nb_teen') === '1',
  data: null,
  activePill: 'cat-para-ti'
};

function fmtDate(iso){
  try {
    const d = new Date(iso);
    return d.toLocaleString('es-ES', { hour12:false });
  } catch(e){ return iso || ''; }
}

function setMeta(version, updatedAt){
  const appV = 'App vTeen2.3';
  const dataV = `Datos ${version || '-'}`;
  const upd = updatedAt || '—';

  $('#nbAppVersion')?.append(document.createTextNode(appV));
  $('#nbDataVersion')?.append(document.createTextNode(dataV));
  $('#nbDataUpdatedAt')?.append(document.createTextNode(upd));

  $('#nbAppVersionBottom')?.append(document.createTextNode(appV));
  $('#nbDataVersionBottom')?.append(document.createTextNode(dataV));
  $('#nbDataUpdatedAtBottom')?.append(document.createTextNode(upd));
}

// --- Normalizador robusto de latest.json ---
function normalizeLatest(raw){
  const d = raw || {};

  // Acepta claves correctas y mojibake
  const bo = d.blocksOut || {};
  const boCatalunya = bo.Catalunya || bo["Cataluña"] || bo["Cataluna"] || [];
  const boEspana    = bo["España"] || bo["Espana"] || bo["Espa\u00f1a"] || bo["EspaÃ±a"] || [];
  const boLaRioja   = bo.LaRioja || bo["La Rioja"] || [];
  const boGlobal    = bo.Global || bo["Mundo"] || [];
  // Algunas builds metían MolinsDeRei
  const boMolins    = bo.MolinsDeRei || [];

  // Arrays base
  const cataluna  = Array.isArray(d.cataluna)  ? d.cataluna  : [];
  const espana    = Array.isArray(d.espana)    ? d.espana    : [];
  const rioja     = Array.isArray(d.rioja)     ? d.rioja     : [];
  const background= Array.isArray(d.background)? d.background: [];

  // Si están vacías, poblar desde blocksOut
  const mapFromBo = arr => (arr || []).map(n => ({
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
    action: n.action || 'FYI',
    img: n.img || ''
  }));

  const out = {
    version: d.version || '-',
    updated_at: d.updated_at || '',
    cataluna:  cataluna.length   ? cataluna   : mapFromBo(boCatalunya),
    espana:    espana.length     ? espana     : mapFromBo(boEspana),
    rioja:     rioja.length      ? rioja      : mapFromBo(boLaRioja),
    background:background.length ? background : mapFromBo(boGlobal),
    deportes:  Array.isArray(d.deportes) ? d.deportes : [],
    radios:    Array.isArray(d.radios)   ? d.radios   : [],
  };

  // “Para ti”: mezcla simple sin límite de 3
  out.forYou = []
    .concat(out.cataluna)
    .concat(out.espana)
    .concat(out.rioja)
    .concat(out.background);

  return out;
}

function buildCard(item, teen){
  const impact = teen ? (item.impact_teen || item.impact) : (item.impact || '');
  const dateStr = item.published_at ? fmtDate(item.published_at) : '';
  const pills = [];
  if (item.tag) pills.push(`#${item.tag}`);
  if (typeof item.severity === 'number') pills.push(`sev ${item.severity}`);
  const tagsHtml = pills.map(t => `<span class="nb-tag">${t}</span>`).join('');

  return `
  <article class="nb-card">
    <h3 class="nb-title"><a href="${item.url}" target="_blank" rel="noopener">${item.title}</a></h3>
    ${item.summary ? `<div class="nb-summary">${item.summary}</div>` : ''}
    ${impact ? `<div class="nb-summary"><strong>Impacto:</strong> ${impact}</div>` : ''}
    <div class="nb-tags">
      ${dateStr ? `<span class="nb-tag">${dateStr}</span>` : ''}
      ${tagsHtml}
    </div>
  </article>`;
}

function renderList(list, containerId){
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = (list || []).map(it => buildCard(it, state.teen)).join('');
}

function renderAll(){
  const d = state.data;
  if (!d) return;

  setMeta(d.version, d.updated_at);

  renderList(d.cataluna,   'cat-cataluna');
  renderList(d.espana,     'cat-espana');
  renderList(d.rioja,      'cat-rioja');
  renderList(d.background, 'cat-global');

  // Para ti
  let fy = document.getElementById('cat-para-ti');
  if (!fy) {
    fy = document.createElement('section');
    fy.id = 'cat-para-ti';
    document.getElementById('content')?.prepend(fy);
  }
  renderList(d.forYou, 'cat-para-ti');

  switchPill(state.activePill);
}

function switchPill(targetId){
  state.activePill = targetId;
  $$('#content > section').forEach(s => s.style.display = 'none');
  const el = document.getElementById(targetId);
  if (el) el.style.display = '';
  $$('#nbPills .pill').forEach(b => b.classList.toggle('active', b.dataset.target === targetId));
}

async function fetchJson(url){
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status} @ ${url}`);
  return res.json();
}

async function loadData(){
  // 1ª preferencia: /data/latest.json  —  2ª: /latest.json
  let raw;
  try {
    raw = await fetchJson(`/data/latest.json?ts=${Date.now()}`);
  } catch (e1) {
    console.warn('No /data/latest.json, probando /latest.json', e1);
    raw = await fetchJson(`/latest.json?ts=${Date.now()}`);
  }
  state.data = normalizeLatest(raw);
  renderAll();
}

function wireUI(){
  // Toggle Teen como etiqueta clickable
  const teenInput = document.getElementById('teenToggle');
  const label = document.getElementById('teenToggleLabel');
  if (teenInput && label) {
    teenInput.checked = state.teen;
    label.addEventListener('click', () => {
      setTimeout(() => {
        state.teen = teenInput.checked;
        localStorage.setItem('nb_teen', state.teen ? '1' : '0');
        renderAll();
      }, 0);
    });
  }

  // Pills
  $$('#nbPills .pill').forEach(btn => {
    btn.addEventListener('click', () => switchPill(btn.dataset.target));
  });

  // Footer
  document.getElementById('btnClearCache')?.addEventListener('click', async () => {
    try {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
      localStorage.clear();
      sessionStorage.clear();
      alert('Caché limpiada');
      location.reload();
    } catch (e) {
      console.error(e);
      alert('No se pudo limpiar caché');
    }
  });
  document.getElementById('btnForceApp')?.addEventListener('click', () => location.reload(true));

  // Tiempo (usa tu WeatherClient existente)
  if (window.WeatherClient?.init) {
    try { window.WeatherClient.init('#weather'); } catch(e) { console.warn('Weather init fallo:', e); }
  }
}

window.addEventListener('DOMContentLoaded', async () => {
  wireUI();
  try {
    await loadData();
  } catch (e) {
    console.error(e);
    document.getElementById('content').innerHTML = '<div class="nb-card">Error cargando latest.json</div>';
  }
});
</script>
