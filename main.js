/**
 * main.js (producción)
 * - Intenta cargar ./data/latest.json (sin caché)
 * - Si falla, hace fallback a ./latest.json (raíz)
 * - Renderiza TODAS las noticias (sin límite artificial)
 * - Pills por categorías + "Para ti"
 * - Toggle Teen guardado en localStorage
 * - Inicializa tiempo con WeatherClient.init('#weather')
 */

const q  = (sel, el = document) => el.querySelector(sel);
const qa = (sel, el = document) => Array.from(el.querySelectorAll(sel));

const state = {
  teen: localStorage.getItem('nb_teen') === '1',
  data: null,
  activePill: 'cat-para-ti',
};

function fmtDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString('es-ES', { hour12: false });
  } catch {
    return iso || '';
  }
}

function setMeta(version, updatedAt) {
  const appV = 'App vTeen2.3';
  const dataV = `Datos ${version || '-'}`;
  const upd = updatedAt || '—';

  const top = {
    app: q('#nbAppVersion'),
    ver: q('#nbDataVersion'),
    upd: q('#nbDataUpdatedAt'),
  };
  const bot = {
    app: q('#nbAppVersionBottom'),
    ver: q('#nbDataVersionBottom'),
    upd: q('#nbDataUpdatedAtBottom'),
  };

  if (top.app) top.app.textContent = appV;
  if (top.ver) top.ver.textContent = dataV;
  if (top.upd) top.upd.textContent = upd;

  if (bot.app) bot.app.textContent = appV;
  if (bot.ver) bot.ver.textContent = dataV;
  if (bot.upd) bot.upd.textContent = upd;
}

function buildCard(item, teen) {
  const impact = teen ? (item.impact_teen || item.impact) : (item.impact || '');
  const dateStr = item.published_at ? fmtDate(item.published_at) : '';
  const tags = [];
  if (item.tag) tags.push(`#${item.tag}`);
  if (typeof item.severity === 'number') tags.push(`sev ${item.severity}`);
  const tagsHtml = tags.map((t) => `<span class="nb-tag">${t}</span>`).join('');

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

function renderCategory(list, containerId) {
  const el = q(`#${containerId}`);
  if (!el) return;
  el.innerHTML = (list || []).map((it) => buildCard(it, state.teen)).join('');
}

function switchPill(targetId) {
  state.activePill = targetId;
  qa('#content > section').forEach((s) => (s.style.display = 'none'));
  const el = q(`#${targetId}`);
  if (el) el.style.display = '';
  qa('#nbPills .pill').forEach((b) => b.classList.toggle('active', b.dataset.target === targetId));
}

function hydrateFromBlocksOut(latestData) {
  // Si categorías principales vienen vacías, hidratar desde blocksOut
  const mapBlocks = {
    cataluna: 'Catalunya',
    espana: 'España',
    rioja: 'LaRioja',
    background: 'Global',
  };
  if (!latestData || !latestData.blocksOut) return latestData;

  for (const [cat, boKey] of Object.entries(mapBlocks)) {
    const arr = Array.isArray(latestData[cat]) ? latestData[cat] : [];
    if (!arr.length && Array.isArray(latestData.blocksOut[boKey])) {
      latestData[cat] = latestData.blocksOut[boKey].map((n) => ({
        title: n.title,
        url: n.url,
        source: n.source || '',
        published_at: n.published_at,
        summary: n.summary || '',
        impact: n.impact || 'FYI',
        impact_adult: n.impact_adult || n.impact || 'FYI',
        impact_teen: n.impact_teen || n.impact || 'FYI',
        tag: n.tag || 'otros',
        severity: n.severity !== undefined ? n.severity : 0,
        horizon: n.horizon || 'sin plazo',
        action: n.action || 'FYI',
      }));
    }
  }
  return latestData;
}

function renderAll() {
  const d = state.data;
  if (!d) return;

  setMeta(d.version, d.updated_at);

  // Render secciones
  renderCategory(d.cataluna || [], 'cat-cataluna');
  renderCategory(d.espana || [], 'cat-espana');
  renderCategory(d.rioja || [], 'cat-rioja');
  renderCategory(d.background || [], 'cat-global');

  // "Para ti": mezcla top-N de cada una
  const forYou = []
    .concat((d.cataluna || []).slice(0, 50))
    .concat((d.espana || []).slice(0, 50))
    .concat((d.rioja || []).slice(0, 50))
    .concat((d.background || []).slice(0, 50));

  let forYouEl = q('#cat-para-ti');
  if (!forYouEl) {
    forYouEl = document.createElement('section');
    forYouEl.id = 'cat-para-ti';
    q('#content')?.prepend(forYouEl);
  }
  renderCategory(forYou, 'cat-para-ti');

  switchPill(state.activePill);
}

async function fetch
