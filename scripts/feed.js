
// scripts/feed.js
// Carga robusta de latest.json con múltiples rutas y cache-buster.
// No toca estilos ni markup.

export async function loadFeed(explicitUrl) {
  const params = new URLSearchParams(window.location.search);
  const qsFeed = params.get("feed");
  const candidates = [
    explicitUrl,
    qsFeed,
    "./data/latest.json",
    "/latest.json",
    "./latest.json"
  ].filter(Boolean);

  const errors = [];
  for (const url of candidates) {
    try {
      const withBuster = url + (url.includes("?") ? "&" : "?") + "_ts=" + Date.now();
      const res = await fetch(withBuster, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!json || typeof json !== "object") throw new Error("JSON vacío o inválido");
      return json;
    } catch (e) {
      errors.push(`${url}: ${e.message}`);
    }
  }
  const err = new Error("No se pudo cargar latest.json\n" + errors.join("\n"));
  console.error(err);
  throw err;
}
