// scripts/build_latest.js
import fs from "fs";
import fetch from "node-fetch";
import { XMLParser } from "fast-xml-parser";

const FEEDS = {
  global: [
    { name: "Reuters World", url: "https://feeds.reuters.com/reuters/worldNews" },
    { name: "BBC World", url: "https://feeds.bbci.co.uk/news/world/rss.xml" }
  ],
  espana: [
    { name: "El País Portada", url: "https://elpais.com/rss/elpais/portada.xml" },
    { name: "Europa Press España", url: "https://www.europapress.es/rss/rss.aspx?ch=00066" }
  ],
  local: [
    // La Rioja (ajusta si quieres geolocalizar en el futuro)
    { name: "La Rioja", url: "https://www.larioja.com/rss/2.0/portada" },
    { name: "Europa Press La Rioja", url: "https://www.europapress.es/rss/rss.aspx?ch=279" }
  ]
};

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "" });

async function getFeedItems(feed) {
  try {
    const res = await fetch(feed.url, { timeout: 20000 });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    const xml = parser.parse(text);
    // Try common RSS structures
    const channel = xml?.rss?.channel || xml?.feed;
    let items = [];
    if (channel?.item) items = channel.item;
    else if (channel?.entry) items = channel.entry;
    if (!Array.isArray(items)) items = [items].filter(Boolean);

    const normalized = items.slice(0, 15).map((it) => ({
      title: it.title?.["#text"] || it.title || "Sin título",
      link: it.link?.href || it.link || it.guid || "",
      pubDate: it.pubDate || it.published || it.updated || "",
      source: feed.name
    }));
    return normalized;
  } catch (e) {
    console.error(`Feed error (${feed.name}):`, e.message);
    return [];
  }
}

function dedupe(items) {
  const seen = new Set();
  return items.filter((x) => {
    const key = (x.title || "").trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function buildSection(sectionKey) {
  const feeds = FEEDS[sectionKey] || [];
  const results = await Promise.all(feeds.map(getFeedItems));
  const merged = results.flat();
  const unique = dedupe(merged);
  return unique.slice(0, 12);
}

async function main() {
  const out = {
    generated_at: new Date().toISOString(),
    global: await buildSection("global"),
    espana: await buildSection("espana"),
    local: await buildSection("local")
  };

  // Fallback content if all empty
  const allEmpty = !out.global.length && !out.espana.length && !out.local.length;
  if (allEmpty) {
    out.global = [{ title: "Sin datos (fallback)", link: "", pubDate: "", source: "system" }];
    out.espana = [{ title: "Sin datos (fallback)", link: "", pubDate: "", source: "system" }];
    out.local = [{ title: "Sin datos (fallback)", link: "", pubDate: "", source: "system" }];
  }

  if (!fs.existsSync("data")) fs.mkdirSync("data");
  fs.writeFileSync("data/latest.json", JSON.stringify(out, null, 2));
  console.log("✅ Generado data/latest.json");
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
