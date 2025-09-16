// scripts/build_latest.js  — Node 20, sin dependencias
import fs from "fs";

const REGION = (process.env.NEWS_REGION || "rioja").toLowerCase(); // cataluna | rioja | madrid...

const FEEDS = {
  global: [
    { name: "Reuters World", url: "https://feeds.reuters.com/reuters/worldNews" },
    { name: "BBC World",     url: "https://feeds.bbci.co.uk/news/world/rss.xml" }
  ],
  espana: [
    { name: "El País",       url: "https://elpais.com/rss/elpais/portada.xml" },
    { name: "Europa Press",  url: "https://www.europapress.es/rss/rss.aspx?ch=00066" }
  ],
  // Ajusta aquí si quieres otra región. Ahora por defecto Rioja.
  local_by_region: {
    rioja: [
      { name: "La Rioja",      url: "https://www.larioja.com/rss/2.0/portada" },
      { name: "EP La Rioja",   url: "https://www.europapress.es/rss/rss.aspx?ch=279" }
    ],
    cataluna: [
      // Propón las fuentes locales que prefieras y ponlas aquí.
      // Ejemplos típicos: La Vanguardia Cataluña, 324.cat, etc.
      // { name: "La Vanguardia - Cataluña", url: "URL_RSS" },
      // { name: "324.cat", url: "URL_RSS" }
    ]
  }
};

function parseISO(d) {
  const t = Date.parse(d);
  return Number.isFinite(t) ? new Date(t).toISOString() : null;
}

async function fetchXML(url) {
  try {
    const r = await fetch(url, { headers: { "user-agent": "gh-actions-news-bot" } });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.text();
  } catch (e) {
    console.error("❌ Fetch:", url, e.message);
    return "";
  }
}

function clean(text = "") {
  return text
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function mkWhyMatters(title, source, section) {
  // Explicación corta, sin florituras
  const s = section === "global" ? "Mundo" : section === "espana" ? "España" : "Tu zona";
  return `Qué significa: ${title.split(":")[0].trim()}. Por qué importa (${s}): contexto rápido para entender el titular sin jerga. Fuente: ${source}.`;
}

// RSS básico: title / link / pubDate / description
function parseItems(xml, source) {
  if (!xml) return [];
  const items = [];
  const blockRe = /<item[\s\S]*?<\/item>/gi;
  let m;
  while ((m = blockRe.exec(xml))) {
    const it = m[0];
    const title = clean((it.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [,""])[1]) || "Sin título";
    // link o atom:link
    let link = clean((it.match(/<link[^>]*>([\s\S]*?)<\/link>/i) || [,""])[1]);
    if (!link) {
      const atom = it.match(/<link[^>]*?href="([^"]+)"/i);
      link = atom ? atom[1] : "";
    }
    const pub = (it.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i) || it.match(/<updated[^>]*>([\s\S]*?)<\/updated>/i) || [,""])[1];
    const published = parseISO(pub);
    const desc = clean((it.match(/<description[^>]*>([\s\S]*?)<\/description>/i) || [,""])[1]);
    const summary = desc ? (desc.length > 260 ? desc.slice(0, 257) + "…" : desc) : "";

    items.push({
      title, link, published,
      summary,
      source
    });
  }
  return items.slice(0, 15);
}

function dedupe(arr) {
  const seen = new Set();
  return arr.filter(x => {
    const k = (x.title || "").toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k); return true;
  });
}

async function buildSection(key) {
  const feeds = key === "local"
    ? (FEEDS.local_by_region[REGION] || [])
    : (FEEDS[key] || []);
  const xmls = await Promise.allSettled(feeds.map(f => fetchXML(f.url).then(x => ({x, f}))));
  const items = xmls.flatMap(r => r.status === "fulfilled" ? parseItems(r.value.x, r.value.f.name) : []);
  const uniq = dedupe(items).slice(0, 12);
  // Añade why_it_matters
  return uniq.map(i => ({
    ...i,
    why_it_matters: mkWhyMatters(i.title, i.source, key)
  }));
}

async function main() {
  const local = await buildSection("local");
  const out = {
    generated_at: new Date().toISOString(),
    region: REGION,
    global: await buildSection("global"),
    espana: await buildSection("espana"),
    local: local.length ? local : [{ title: "Sin contenidos (todavía).", link: "", published: null, summary: "", source: "system", why_it_matters: "Añade feeds locales en scripts/build_latest.js (FEEDS.local_by_region)." }]
  };

  if (!fs.existsSync("data")) fs.mkdirSync("data");
  fs.writeFileSync("data/latest.json", JSON.stringify(out, null, 2));
  console.log("✅ data/latest.json generado");
}

main().catch(e => { console.error("Fatal:", e); process.exit(1); });
