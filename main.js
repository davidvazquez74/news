async function loadNews() {
  try {
    const bust = localStorage.getItem("__nb_force_bust") || Date.now();
    const res = await fetch(`latest.json?b=${bust}`);
    const data = await res.json();

    renderNews(data);
    renderFooter(data);
  } catch (err) {
    document.getElementById("news").innerHTML = "<p>Error cargando latest.json</p>";
  }
}

function renderNews(data) {
  const newsContainer = document.getElementById("news");
  newsContainer.innerHTML = "";

  const blocks = ["cataluna", "espana", "rioja", "background", "deportes", "radios"];
  const mode = localStorage.getItem("audience") || "adult";

  blocks.forEach(block => {
    if (!data[block] || data[block].length === 0) return;
    const section = document.createElement("section");
    section.innerHTML = `<h2>${block.toUpperCase()}</h2>`;

    data[block].forEach(item => {
      const card = document.createElement("article");
      card.className = "news-card";
      card.innerHTML = `
        <h3><a href="${item.url}" target="_blank">${item.title}</a></h3>
        <p>${item.summary}</p>
        <p><strong>Impacto:</strong> ${mode === "teen" ? item.impact_teen : item.impact_adult}</p>
      `;
      section.appendChild(card);
    });

    newsContainer.appendChild(section);
  });
}

function renderFooter(data) {
  document.getElementById("version").textContent = 
    `App vTeen2.3 • Datos ${data.version} • ${data.updated_at}`;
}

document.getElementById("toggle-teen").onclick = () => {
  const current = localStorage.getItem("audience") || "adult";
  localStorage.setItem("audience", current === "adult" ? "teen" : "adult");
  loadNews();
};

document.getElementById("clear-cache").onclick = async () => {
  localStorage.clear();
  if (caches) {
    const keys = await caches.keys();
    for (let key of keys) await caches.delete(key);
  }
  location.reload();
};

document.getElementById("force-app").onclick = () => {
  localStorage.setItem("__nb_force_bust", Date.now());
  location.reload();
};

window.addEventListener("DOMContentLoaded", () => {
  if (window.WeatherClient) {
    try { WeatherClient.init({ rootId: "weather-widget" }); } catch(e) {}
  }
  loadNews();
});