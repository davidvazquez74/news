console.log('[news] boot');

async function loadNews() {
  let container = document.getElementById('news-container');
  container.innerHTML = '<p>Cargando noticias...</p>';
  try {
    let res = await fetch('data/latest.json');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    let data = await res.json();
    renderNews(data);
  } catch (err) {
    console.warn('[news] fallback demo', err);
    renderNews({ demo: true, items: [
      { title: "Demo noticia 1", summary: "Esto es solo de prueba.", impact_adult: "Impacto adultos", impact_teen: "Impacto teen" },
      { title: "Demo noticia 2", summary: "Cargando motor real en breve.", impact_adult: "Impacto adultos", impact_teen: "Impacto teen" }
    ]});
  }
}

function renderNews(data) {
  let container = document.getElementById('news-container');
  container.innerHTML = '';
  let items = data.items || [];
  items.forEach(n => {
    let card = document.createElement('div');
    card.className = 'news-card';
    card.innerHTML = `<h3>${n.title}</h3><p>${n.summary}</p>
      <p><b>Adult:</b> ${n.impact_adult || ''}</p>
      <p><b>Teen:</b> ${n.impact_teen || ''}</p>`;
    container.appendChild(card);
  });
}

document.getElementById('btn-adult').addEventListener('click', () => loadNews());
document.getElementById('btn-teen').addEventListener('click', () => loadNews());

loadNews();
console.log('[news] ready');