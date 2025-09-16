// scripts/build_latest.js
import fs from "fs";

const FEEDS = {
  global: [
    { name: "Reuters World", url: "https://feeds.reuters.com/reuters/worldNews" },
    { name: "BBC World", url: "https://feeds.bbci.co.uk/news/world/rss.xml" }
  ],
  espana: [
    { name: "El País", url: "https://elpais.com/rss/elpais/portada.xml" },
    { name: "Europa Press España", url: "https://www.europapress.es/rss/rss.aspx?ch=00066" }
  ],
  local: [
    { name: "La Rioja", url: "https://www.larioja.com/rss/2.0/portada" },
    { name: "EP La Rioja", url: "https://www.europapress.es/rss/rss.aspx?ch=279" }
  ]
};

async function fetchXML(url) {
  const r = await fetch(url, { headers: { "user-agent": "gh-actions-news-bot" } });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return await r.text();
}

// Parseo simple de RSS: title/link/pubDate
function parseItems(xml) {
  const items = [];
  const itemRegex = /<item[\s\S]*?<\/item>/gi;
  const get = (block, tag) => {
    const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\/${tag}>`, "i"));
    return m ? m[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, "$1").trim() : "";
  };
  const link = (block) => {
    const href = block.match(/<link[^>]*>([\s\S]*?)<\/link>/i);
    if (href) return href[1].trim();
    const atom = block.match(/<link[^>]*?href="([^"]+)"/i);
    return atom ? atom[1] : "";
  };
  let m;
  while ((m = itemRegex.exec(xml))) {
    const it = m[0];
    items.push({
      title: get(it, "title") || "Sin título",
      link: link(it),
      pubDate: get(it, "pubDate") || get(it, "updated") || "",
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
  const feeds = FEEDS[key] || [];
  const xmls = await Promise.allSettled(feeds.map(f => fetchXML(f.url)));
  const items = xmls.flatMap(r => r.status === "fulfilled" ? parseItems(r.value) : []);
  return dedupe(items).slice(0, 12);
}

const out = {
  generated_at: new Date().toISOString(),
  global: await buildSection("global"),
  espana: await buildSection("espana"),
  local: await buildSection("local")
};

if (!fs.existsSync("data")) fs.mkdirSync("data");
fs.writeFileSync("data/latest.json", JSON.stringify(out, null, 2));
console.log("✅ data/latest.json generado");
