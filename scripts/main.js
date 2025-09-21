
// Minimal JS focused on correctness and no-cache fetching

const el = (sel, root=document) => root.querySelector(sel);
const els = (sel, root=document) => [...root.querySelectorAll(sel)];

const metaTop = {
  app: el('#nbAppVersion'),
  data: el('#nbDataVersion'),
  updated: el('#nbDataUpdatedAt'),
};
const metaBot = {
  app: el('#nbAppVersionBottom'),
  data: el('#nbDataVersionBottom'),
  updated: el('#nbDataUpdatedAtBottom'),
};

function setMeta(appVersion, dataVersion, updatedAt) {
  const fmt = (d) => d ? new Date(d).toISOString() : '—';
  [metaTop, metaBot].forEach(m => {
    if(!m) return;
    if(m.app) m.app.textContent = `App vTeen2.3`;
    if(m.data) m.data.textContent = `Datos v-{dataVersion}`.replace('{dataVersion}', dataVersion || '—');
    if(m.updated) m.updated.textContent = updatedAt ? new Date(updatedAt).toLocaleString() : '—';
  });
}

async function fetchLatest() {
  // Always from root, never /data; add cache-buster
  const url = `/latest.json?ts=${Date.now()}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res.json();
}

function sectionTitle(name) {
  const h = document.createElement('h2');
  h.className = 'nb-section-title';
  h.textContent = name.toUpperCase();
  return h;
}

function newsCard(item) {
  const card = document.createElement('article');
  card.className = 'nb-card';
  card.innerHTML = `
    <a class="nb-title" href="${item.url}" target="_blank" rel="noopener">${item.title}</a>
    <p class="nb-summary">${item.summary || ''}</p>
    <div class="nb-meta-row">
      <span>${new Date(item.published_at).toLocaleString()}</span>
      <span class="nb-chip">#${item.tag || 'otros'}</span>
      <span class="nb-chip">sev ${item.severity || 0}</span>
    </div>`;
  return card;
}

function renderSection(rootId, title, list) {
  const root = el('#'+rootId);
  if (!root) return;
  root.innerHTML = '';
  if (list?.length) {
    root.appendChild(sectionTitle(title));
    list.forEach(n => root.appendChild(newsCard(n)));
  }
}

function hookPills() {
  const pills = el('#nbPills');
  if(!pills) return;
  pills.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-target]');
    if(!b) return;
    els('.nb-pills .pill').forEach(p=>p.classList.remove('active'));
    b.classList.add('active');
    const id = b.dataset.target;
    const sec = el('#'+id);
    if(sec) sec.scrollIntoView({behavior:'smooth', block:'start'});
  });
}

function hookFooter() {
  el('#btnClearCache')?.addEventListener('click', async () => {
    try {
      const regs = await navigator.serviceWorker?.getRegistrations?.() || [];
      for (const r of regs) await r.unregister();
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
    } catch (e) { }
    localStorage.clear();
    location.reload(true);
  });
  el('#btnForceApp')?.addEventListener('click', () => location.reload(true));
}

function hookTeen() {
  const t = el('#teenToggle');
  if(!t) return;
  // Persist switch
  const saved = localStorage.getItem('NB_TEEN') === '1';
  t.checked = saved;
  t.addEventListener('change', () => {
    localStorage.setItem('NB_TEEN', t.checked ? '1' : '0');
    location.reload();
  });
}

async function start() {
  try {
    hookPills(); hookFooter(); hookTeen();
    const latest = await fetchLatest();
    setMeta(latest.version, latest.version, latest.updated_at);
    // Map keys expected -> origin data keys
    renderSection('cat-cataluna', 'Cataluña', latest.cataluna || latest.cataluña || []);
    renderSection('cat-espana', 'España', latest.espana || latest.españa || []);
    renderSection('cat-rioja', 'Rioja', latest.rioja || []);
    renderSection('cat-global', 'Mundo', latest.background || latest.global || []);
  } catch (e) {
    console.error('Error cargando noticias', e);
    const c = el('#content');
    c.innerHTML = '<div class="nb-card">Error cargando noticias. Revisa la ruta /latest.json</div>';
  }
}

document.addEventListener('DOMContentLoaded', start);
