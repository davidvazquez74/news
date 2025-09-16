// scripts/build_latest.js
// Node 20, sin dependencias externas
import fs from "fs";

const FEEDS = {
  global: [
    { name: "Reuters World", url: "https://feeds.reuters.com/reuters/worldNews" },
    { name: "BBC World",     url: "https://feeds.bbci.co.uk/news/world/rss.xml" }
  ],
  espana: [
    { name: "El País",       url: "https://elpais.com/rss/elpais/portada.xml" },
    { name: "Europa Press",  url: "https://www.europapress.es/rss/rss.aspx?ch=00066" }
  ],
  local: [
    { name: "La Vanguardia – Cataluña", url: "https://www.lavanguardia.com/rss/local/catalunya.xml" },
    { name: "El Periódico – Cataluña",  url: "https://www.elperiodico.com/es/rss/catalunya/rss.xml" },
    { name: "324.cat",                  url: "https://www.ccma.cat/324/rss/324.xml" },
    { name: "Ara.cat",                  url: "https://www.ara.cat/rss/" }
  ]
};

const UA = { headers: { "user-agent": "gh-actions-news-bot" } };
const clean = s => (s||"")
  .replace(/<!\[CDATA\[(.*?)\]\]>/gs,"$1")
  .replace(/<[^>]+>/g," ")
  .replace(/\s+/g," ").trim();

async function fetchXML(url){
  try{ const r=await fetch(url,UA); if(!r.ok) throw new Error(r.status); return await r.text(); }
  catch(e){ console.error("fetch fail",url,e.message); return ""; }
}

function pick(block, tag){
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\/${tag}>`,"i"));
  return m ? clean(m[1]) : "";
}

function pickLink(block){
  const a = block.match(/<link[^>]*>([\s\S]*?)<\/link>/i);
  if (a) return clean(a[1]);
  const b = block.match(/<link[^>]*?href="([^"]+)"/i);
  return b ? b[1] : "";
}

// Genera explicación simplificada
function why(title, summary){
  if (!summary) return `Qué significa: ${title}. Por qué importa: contexto rápido y práctico.`;
  const s = summary.length>180? summary.slice(0,177)+"…" : summary;
  return `En claro: ${s}`;
}

function parseRSS(xml, source){
  if(!xml) return [];
  const out = [];
  const items = xml.match(/<item[\s\S]*?<\/item>/gi) || [];
  for(const it of items.slice(0,15)){
    const title = pick(it,"title") || "Sin título";
    const link  = pickLink(it);
    const desc  = pick(it,"description") || pick(it,"summary");
    const pub   = pick(it,"pubDate") || pick(it,"updated") || "";
    const published = Number.isFinite(Date.parse(pub)) ? new Date(pub).toISOString() : null;

    const summary = desc ? (desc.length>260? desc.slice(0,257)+"…" : desc) : "";
    out.push({
      title, link, published, summary, source,
      why_it_matters: why(title, summary)
    });
  }
  return out;
}

function dedupe(arr){
  const seen=new Set();
  return arr.filter(x=>{
    const k=(x.title||"").toLowerCase();
    if(seen.has(k)) return false; seen.add(k); return true;
  });
}

async function buildSection(key){
  const feeds = FEEDS[key] || [];
  const xmls  = await Promise.all(feeds.map(f=>fetchXML(f.url)));
  const items = xmls.flatMap((x,i)=>parseRSS(x, feeds[i].name));
  const uniq  = dedupe(items).slice(0,12);
  return uniq.length? uniq : [{
    title:"Sin contenidos (todavía).", link:"", published:null, summary:"",
    source:"system", why_it_matters:"Se llenará automáticamente en el siguiente ciclo."
  }];
}

const out = {
  generated_at: new Date().toISOString(),
  global: await buildSection("global"),
  espana: await buildSection("espana"),
  local:  await buildSection("local")
};

if(!fs.existsSync("data")) fs.mkdirSync("data");
fs.writeFileSync("data/latest.json", JSON.stringify(out,null,2));
console.log("✅ data/latest.json generado");
