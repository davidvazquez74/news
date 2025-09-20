
// scripts/boot.js
// Orquestación mínima: carga feed, monta toggles, renderiza noticias usando tu HTML.

import { loadFeed } from "./feed.js";
import { mountAudienceToggle, pickImpact, getAudience } from "./audience.js";
import { mountWeather } from "./weather.js";
import { renderVersion } from "./version.js";

async function renderApp(data) {
  const root = document.getElementById("app");
  if (!root) return;

  // No cambiamos estilos: generamos markup neutro dentro de #app
  // Mostramos todas las noticias de 'cataluna' y 'rioja' y 'background' (si existen).
  const buckets = ["cataluna", "rioja", "background"];
  const audience = getAudience();

  const frag = document.createDocumentFragment();
  for (const bucket of buckets) {
    const list = Array.isArray(data[bucket]) ? data[bucket] : [];
    if (!list.length) continue;
    const section = document.createElement("section");
    // Mantener estilos ajenos: solo atributos genéricos
    section.setAttribute("data-bucket", bucket);

    list.forEach(item => {
      const card = document.createElement("article");
      card.setAttribute("data-item", bucket);
      const h3 = document.createElement("h3");
      const a = document.createElement("a");
      a.href = item.url || "#";
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = item.title || "(sin título)";
      h3.appendChild(a);

      const meta = document.createElement("div");
      const src = item.source ? ` — ${item.source}` : "";
      const dt = item.published_at ? new Date(item.published_at).toLocaleString() : "";
      meta.textContent = [dt, src].filter(Boolean).join("");

      const p = document.createElement("p");
      p.textContent = item.summary || "";

      const imp = document.createElement("p");
      imp.setAttribute("data-impact", audience);
      imp.textContent = pickImpact(item);

      card.appendChild(h3);
      if (meta.textContent) card.appendChild(meta);
      if (p.textContent) card.appendChild(p);
      if (imp.textContent) card.appendChild(imp);
      section.appendChild(card);
    });

    frag.appendChild(section);
  }

  root.innerHTML = "";
  root.appendChild(frag);
}

export async function initNotiBuddy({ feedUrl } = {}) {
  mountAudienceToggle();
  mountWeather();
  let data;
  try {
    data = await loadFeed(feedUrl);
  } catch (e) {
    // Pintamos un mensaje mínimo sin tocar estilos
    const root = document.getElementById("app");
    if (root) {
      const div = document.createElement("div");
      div.setAttribute("role", "alert");
      div.textContent = "No se pudo cargar las noticias.";
      root.innerHTML = "";
      root.appendChild(div);
    }
    throw e;
  }
  renderVersion(data);
  await renderApp(data);

  // Re-render al cambiar el modo
  document.addEventListener("audience:change", () => renderApp(data), { passive: true });
}

// Auto-init si existe #app
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => initNotiBuddy());
} else {
  initNotiBuddy();
}
