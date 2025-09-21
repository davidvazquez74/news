// main.js — producción (completo)
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
    return d.toLocaleString('es-ES', { hour12:false });
  } catch { return iso || ''; }
}

function setMeta(version, updatedAt){
  const appV = 'App vTeen2.3';
  const dataV = `Datos ${version || '-'}`;
  const upd = updatedAt || '—';

  const top = {
    v: q('#nbAppVersion'),
    dv: q('#nbDataVersion'),
    up: q('#nbDataUpdatedAt'),
  };
  const bot = {
    v: q('#nbAppVersionBottom'),
    dv: q('#nbDataVersionBottom'),
    up: q('#nbDataUpdatedAtBottom'),
  };

  if (top.v) top.v.textContent = appV;
  if (top.dv) top.dv.textContent = dataV;
  if (top.up) top.up.textContent = upd;

  if (bot.v) bot.v.textContent = appV;
  if (bot.dv) bot.dv.textContent = dataV;
  if (bot.up) bot.up.textContent = upd;
}

function buildCard(item, teen){
  const impact = teen ? (item.impact_teen ?? item.impact) : (item.impact ?? '');
  const dateStr = item.published_at ? fmtDate(item.published_at) : '';
  const tags = [];
  if (item.tag) tags.push(`#${item.tag}`);
  if (typeof item.severity === 'number') tags.push(`sev ${item.severity}`);
  const tagsHtml = tags.map(t=>`<span class="nb-tag">${t}</span>`).join('');

  const safeURL = item.url || '#';
  const safeTitle = item.title || '—';

  return `<article class="nb-card">
    <h3 class="nb-title"><a href="${safeURL}" target="_blank" rel="noopener">${safeTitle}</a></h3>
    ${item.summary ? `<div class="nb-summary">${item.summary}</div>` : ''}
    ${impact ? `<div class="nb-summary"><strong>Impacto:</strong> ${impact}</div>` : ''}
    <div class="nb-tags">
      ${dateStr ? `<span class="nb-tag">${dateStr}</span>` : ''}
      ${tagsHtml}
    </div>
  </article>`;
}

function renderCategory(list, containerId){
  const el = q(`#${containerId}`);
  if (!el) return;
  if (!Array.isArray(list) || list.length === 0){
    el.innerHTML = '';
    return;
  }
  el.innerHTML = list.map(it=>buildCard(it, state.teen)).join('');
}

function renderAll(){
  const d = state.data;
  if (!d) return;

  setMeta(d.version, d.updated_at);

  // Render categorías “puras”
  renderCategory(d.cataluna || [], 'cat-cataluna');
  renderCategory(d.espana   || [], 'cat-espana');
  renderCategory(d.rioja    || [], 'cat-rioja');
  renderCategory(d.background || [], 'cat-global');

  // “Para ti”: mezcla sin límite artificial
  const forYou = []
    .concat(d.cataluna || [])
    .concat(d.espana   || [])
    .concat(d.rioja    || [])
    .concat(d.background || []);

  let forYouEl = q('#cat-para-ti');
  if (!forYouEl){
    forYouEl = document.createElement('section');
    forYouEl.id = 'cat-para-ti';
    q('#content').prepend(forYouEl);
  }
  renderCategory(forYou, 'cat-para-ti');

  switchPill(state.activePill);
}

function switchPill(targetId){
  state.activePill = targetId;
  qa('#content > section').forEach(s=> s.style.display = 'none');
  const el = q(`#${targetId}`);
  if (el) el.style.display = '';
  qa('#nbPills .pill').forEach(b=> b.classList.toggle('active', b.dataset.target === targetId));
}

function hydrateFromBlocksOut(data){
  if (!data || !data.blocksOut) return data;

  const map = { cataluna:'Catalunya', espana:'España', rioja:'LaRioja', background:'Global' };
  const out = { ...data };

  Object.entries(map).forEach(([cat, boKey])=>{
    const current = Array.isArray(out[cat]) ? out[cat] : [];
    const boArr = out.blocksOut?.[boKey];
    if (current.length === 0 && Array.isArray(boArr) && boArr.length){
      out[cat] = boArr.map(n => ({
        title: n.title,
        url: n.url,
        source: n.source || '',
        published_at: n.published_at,
        summary: n.summary || '',
        impact: n.impact || 'FYI',
        impact_adult: n.impact_adult ?? n.impact ?? 'FYI',
        impact_teen: n.impact_teen ?? n.impact ?? 'FYI',
        tag: n.tag || 'otros',
        severity: (n.severity !== undefined ? n.severity : 0),
        horizon: n.horizon || 'sin plazo',
        action: n.action || 'FYI'
      }));
    }
  });

  return out;
}

async function fetchJson(url){
  const res = await fetch(`${url}?ts=${Date.now()}`, { cache:'no-store' });
  if (!res.ok) throw new Error(`fetch fail ${url}`);
  return res.json();
}

async function loadData(){
  // 1º intenta data/latest.json, 2º cae a /latest.json
  let data = null;
  try {
    data = await fetchJson('/data/latest.json');
  } catch {
    data = await fetchJson('/latest.json');
  }

  // Fallback desde blocksOut si categorías vacías
  data = hydrateFromBlocksOut(data);

  // Si sigue absolutamente vacío, muestra aviso pero no peta UI
  const totalCount = ['cataluna','espana','rioja','background']
    .reduce((acc,k)=>acc + (Array.isArray(data[k]) ? data[k].length : 0), 0);

  if (totalCount === 0){
    console.warn('latest.json sin noticias en categorías ni blocksOut.');
  }

  state.data = data;
  renderAll();
}

function wireUI(){
  // Switch teen: el texto “Teen” hace de toggle
  const teenInput = q('#teenToggle');
  const teenLabel = q('#teenToggleLabel');
  if (teenInput && teenLabel){
    teenInput.checked = state.teen;
    teenLabel.addEventListener('click', ()=>{
      setTimeout(()=>{
        state.teen = teenInput.checked;
        localStorage.setItem('nb_teen', state.teen ? '1' : '0');
        renderAll();
      }, 0);
    });
  }

  // Pills
  qa('#nbPills .pill').forEach(btn=>{
    btn.addEventListener('click', ()=> switchPill(btn.dataset.target));
  });

  // Footer
  const btnClear = q('#btnClearCache');
  if (btnClear){
    btnClear.addEventListener('click', async ()=>{
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
        console.error(e);
        alert('No se pudo limpiar caché');
      }
    });
  }

  const btnForce = q('#btnForceApp');
  if (btnForce){
    btnForce.addEventListener('click', ()=> location.reload(true));
  }

  // Tiempo (usa tu weather_client.js existente)
  if (window.WeatherClient && typeof window.WeatherClient.init === 'function') {
    try { window.WeatherClient.init('#weather'); }
    catch (e){ console.warn('Weather init fallo:', e); }
  }
}

window.addEventListener('DOMContentLoaded', async ()=>{
  wireUI();
  try {
    await loadData();
  } catch (e){
    console.error(e);
    const content = q('#content');
    if (content){
      content.innerHTML = '<div class="nb-card">Error cargando latest.json</div>';
    }
  }
});
