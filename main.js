
(function(){
  const app = document.getElementById('app');
  const versionEl = document.getElementById('version');
  const toggleBtn = document.getElementById('toggleTeen');
  let teenMode = false;

  toggleBtn.addEventListener('click', () => {
    teenMode = !teenMode;
    toggleBtn.setAttribute('aria-pressed', String(teenMode));
    render(currentData);
  });

  /** Render helpers **/
  function card(item){
    const d = new Date(item.published_at || item.date || Date.now());
    const cat = item._section || 'General';
    const impactText = teenMode
      ? (item.impact_teen || item.impact || 'Sin efecto directo en tu día a día.')
      : (item.impact_adult || item.impact || 'Sin efecto directo en tu día a día.');

    return `<article class="card">
      <div class="meta"><span class="badge">${cat}</span> ${d.toLocaleString('es-ES')}</div>
      <h3><a href="${item.url}" target="_blank" rel="noopener">${escapeHtml(item.title)}</a></h3>
      <div class="meta">${escapeHtml(item.source || '')}</div>
      <p>${escapeHtml(item.summary || '')}</p>
      <div class="impact">${escapeHtml(impactText)}</div>
    </article>`;
  }

  function render(data){
    if(!data){ app.innerHTML = `<div class="loading">Sin datos</div>`; return; }
    versionEl.textContent = data.version ? `versión: ${data.version}` : '';
    const buckets = ['cataluna','espana','rioja','background','deportes'];
    const items = [];
    for(const b of buckets){
      (data[b]||[]).forEach(it => items.push({...it,_section:b}));
    }
    if(items.length === 0){
      app.innerHTML = `<div class="loading">No hay noticias (probando datos de demo)…</div>`;
      render(DEMO_DATA);
      return;
    }
    app.innerHTML = items.map(card).join('\n');
  }

  function escapeHtml(s){return String(s||'').replace(/[&<>"']/g,m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]))}

  const DEMO_DATA = {
    updated_at: new Date().toISOString(),
    version: "demo-"+Date.now(),
    cataluna: [{
      title: "Evento local en Molins de Rei",
      url: "https://example.org",
      source: "Demo",
      published_at: new Date().toISOString(),
      summary: "Afectará a movilidad durante la tarde.",
      impact: "Planifica desplazamientos; posibles cortes de tráfico.",
      impact_adult: "Planifica desplazamientos; posibles cortes de tráfico.",
      impact_teen: "Queda antes o después, habrá cortes de tráfico 🚧"
    }],
    espana: [{
      title: "Precio de la luz se mantiene estable",
      url: "https://example.org",
      source: "Demo",
      published_at: new Date().toISOString(),
      summary: "Sin cambios relevantes a corto plazo.",
      impact: "Sin cambios inmediatos; vigila la factura si tienes tarifa variable.",
      impact_adult: "Sin cambios inmediatos; vigila la factura si tienes tarifa variable.",
      impact_teen: "Todo igual por ahora; sin sustos en casa 😉"
    }]
  };

  let currentData = null;

  // Try to fetch real data, fall back to bundled file then to DEMO_DATA
  async function boot(){
    try{
      currentData = await fetchJson('data/latest.json');
    }catch(_){
      try{
        currentData = await fetchJson('latest.demo.json');
      }catch(_2){
        currentData = DEMO_DATA;
      }
    }
    render(currentData);
  }

  async function fetchJson(path){
    const res = await fetch(path, {cache:'no-store'});
    if(!res.ok) throw new Error('http '+res.status);
    return await res.json();
  }

  boot();
})();
