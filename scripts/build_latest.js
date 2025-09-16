// scripts/build_latest.js — Node 20, sin dependencias
import fs from "fs";

/* Feeds SOLO en español */
const FEEDS = {
  global: [
    { name: "BBC Mundo", url: "https://feeds.bbci.co.uk/mundo/rss.xml" },
    { name: "El País (Portada)", url: "https://elpais.com/rss/elpais/portada.xml" }
  ],
  espana: [
    { name: "El País (Portada)", url: "https://elpais.com/rss/elpais/portada.xml" },
    { name: "Europa Press España", url: "https://www.europapress.es/rss/rss.aspx?ch=00066" }
  ],
  local: [
    { name: "La Vanguardia – Cataluña", url: "https://www.lavanguardia.com/rss/local/catalunya.xml" },
    { name: "El Periódico – Cataluña",  url: "https://www.elperiodico.com/es/rss/catalunya/rss.xml" },
    { name: "324.cat",                  url: "https://www.ccma.cat/324/rss/324.xml" }
  ]
};

const UA = { headers: { "user-agent": "gh-actions-news-bot" } };
const clean = s => (s||"").replace(/<!\[CDATA\[(.*?)\]\]>/gs,"$1").replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim();

/* ———— Descarga & parse RSS ———— */
async function fetchXML(url){ try{ const r=await fetch(url,UA); if(!r.ok) throw new Error(r.status); return await r.text(); } catch{ return ""; } }
function pick(block, tag){ const m=block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`,"i")); return m?clean(m[1]):""; }
function pickLink(block){ const a=block.match(/<link[^>]*>([\s\S]*?)<\/link>/i); if(a) return clean(a[1]); const b=block.match(/<link[^>]*?href="([^"]+)"/i); return b?b[1]:""; }

/* ———— Detección de tema con racional (causa → efecto práctico) ———— */
const THEMES = [
  { id:"war",
    kw:["guerra","conflicto","bombardeo","ataque","militar","ofensiva","invasión","misil","frente"],
    impact:"Posible subida de energía y transporte; vigila gasolina, costes logísticos y precios de alimentos." },
  { id:"tariffs",
    kw:["arancel","aranceles","aduana","tarifa","exportación","importación","proteccionismo"],
    impact:"Exportar/importar puede salir más caro y lento; revisa precios, márgenes y plazos con clientes/proveedores." },
  { id:"rates",
    kw:["tipos de interés","euríbor","bce","fed","subida de tipos","bajada de tipos"],
    impact:"Créditos e hipotecas cambian de coste; si es variable, tu cuota puede moverse. Revisa financiación." },
  { id:"inflation",
    kw:["inflación","ipc","subida de precios","carestía"],
    impact:"La compra habitual se encarece; ajusta presupuesto y compara precios." },
  { id:"tax",
    kw:["impuesto","iva","irpf","tasas","fiscal"],
    impact:"Podrías pagar más/menos impuestos; revisa recibos y planifica compras o deducciones." },
  { id:"energy",
    kw:["energía","electricidad","gas","petróleo","opep","opec","gasolina","luz"],
    impact:"Facturas de energía y transporte pueden subir/bajar; ajusta consumos y evalúa alternativas." },
  { id:"cyber",
    kw:["ciberataque","ransomware","brecha","hackeo","phishing"],
    impact:"Refuerza seguridad digital: 2FA, contraseñas y cuidado con correos sospechosos." },
  { id:"climate",
    kw:["sequía","ola de calor","incendio","inundación","clima","temporal","DANA"],
    impact:"Puede afectar suministro de agua y alimentos; podrían subir precios o haber restricciones puntuales." },
  { id:"publichealth",
    kw:["brote","virus","covid","gripe","sanidad","alerta sanitaria"],
    impact:"Medidas sanitarias o demoras en servicios; revisa viajes y eventos." },
  { id:"labor",
    kw:["huelga","paro","despidos","empleo","convenio"],
    impact:"Servicios pueden verse interrumpidos; planifica desplazamientos y posibles retrasos." },
  { id:"obituary",
    kw:["muere","fallece","obituario","ha muerto","defunción","pierde la vida"],
    impact:"Sin impacto económico directo; es un hecho cultural/emocional. No requiere decisiones prácticas." },
  { id:"politics",
    kw:["elecciones","gobierno","congreso","parlamento","decreto","ley"],
    impact:"Cambios normativos a la vista; atento a nuevas reglas que afecten a tu actividad." }
];

function detectTheme(text){
  const t = text.toLowerCase();
  let best = { id:"none", score:0 };
  for(const th of THEMES){
    const score = th.kw.reduce((s,k)=> s + (t.includes(k)?1:0), 0);
    if(score > best.score) best = { id: th.id, score, impact: th.impact };
  }
  return best;
}
function makeImpact(title, summary){
  const all = (title+" "+summary).toLowerCase();
  const th = detectTheme(all);
  if (th.score > 0) return th.impact;
  // Fallback sensato (no inventa impacto económico)
  return "Impacto directo bajo para la mayoría; mantente informado por si deriva en cambios de precios o normas.";
}

/* ———— Glosario mínimo ———— */
const GLOSS = {
  "arancel":"Impuesto a productos que entran/salen de un país.",
  "euríbor":"Tipo de interés de referencia de muchas hipotecas.",
  "bce":"Banco Central Europeo, decide los tipos en la eurozona.",
  "inflación":"Subida general de precios con el tiempo.",
  "opep":"Países que coordinan la oferta de petróleo."
};
function makeGlossary(text){
  const t = text.toLowerCase();
  const out = [];
  for(const [term,def] of Object.entries(GLOSS)){
    if (t.includes(term)) out.push({term, def});
  }
  return out.slice(0,3);
}

/* ———— Español + parseo + 4 por bloque ———— */
function isSpanish(title, desc){
  const sample = (" "+title+" "+desc+" ").toLowerCase();
  const hits = [" el "," la "," los "," las "," de "," y "," en "," por "," para "," con "," que "," una "]
    .filter(w=> sample.includes(w)).length;
  return hits >= 3;
}

function parseRSS(xml, source){
  if(!xml) return [];
  const out = [];
  const items = xml.match(/<item[\s\S]*?<\/item>/gi) || [];
  for(const it of items){
    const title = pick(it,"title") || "Sin título";
    const link  = pickLink(it);
    const desc  = pick(it,"description") || pick(it,"summary");
    const pub   = pick(it,"pubDate") || pick(it,"updated") || "";
    const published = Number.isFinite(Date.parse(pub)) ? new Date(pub).toISOString() : null;

    if (!isSpanish(title, desc)) continue;

    const summary = desc ? (desc.length>260? desc.slice(0,257)+"…" : desc) : "";
    const impact  = makeImpact(title, summary);
    const glossary = makeGlossary(title+" "+summary);

    out.push({ title, link, published, summary, impact, glossary, source });
  }
  return out.slice(0,50);
}

function dedupe(arr){
  const seen=new Set();
  return arr.filter(x=>{ const k=(x.title||"").toLowerCase(); if(seen.has(k)) return false; seen.add(k); return true; });
}

async function buildSection(list){
  const xmls  = await Promise.all(list.map(f=>fetchXML(f.url)));
  const items = xmls.flatMap((x,i)=>parseRSS(x, list[i].name));
  const uniq  = dedupe(items);
  return uniq.slice(0,4); // 4 por bloque, como pides
}

/* ———— Ejecutar ———— */
const out = {
  generated_at: new Date().toISOString(),
  global: await buildSection(FEEDS.global),
  espana: await buildSection(FEEDS.espana),
  local:  await buildSection(FEEDS.local)
};

if(!fs.existsSync("data")) fs.mkdirSync("data");
fs.writeFileSync("data/latest.json", JSON.stringify(out,null,2));
console.log("✅ data/latest.json generado");
