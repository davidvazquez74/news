// scripts/build_latest.js — Node 20, sin dependencias
import fs from "fs";

// Feeds en español (si algún feed falla, el filtro evitará colar inglés)
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

async function fetchXML(url){
  try{ const r=await fetch(url,UA); if(!r.ok) throw new Error(r.status); return await r.text(); }
  catch(e){ console.error("fetch fail",url,e.message); return ""; }
}

function pick(block, tag){
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`,"i"));
  return m ? clean(m[1]) : "";
}
function pickLink(block){
  const a = block.match(/<link[^>]*>([\s\S]*?)<\/link>/i);
  if (a) return clean(a[1]);
  const b = block.match(/<link[^>]*?href="([^"]+)"/i);
  return b ? b[1] : "";
}

// ————— Impacto (cómo te afecta) —————
function makeImpact(title, summary){
  const t = (title+" "+summary).toLowerCase();

  const rules = [
    {k:["arancel","aranceles","tarifa"], msg:"Te puede costar más vender o comprar fuera: suben los costes de importación/exportación y los márgenes se reducen."},
    {k:["inflación","precios"], msg:"Suben los precios en general: tu compra habitual es más cara y si tienes ahorros sin remunerar, pierden valor real."},
    {k:["tipos de interés","bce","fed","euribor"], msg:"Créditos y hipotecas más caros: si revisas variable, la cuota puede subir; si vas a financiarte, te costará más."},
    {k:["paro","empleo","despidos"], msg:"Más difícil encontrar trabajo o conservarlo: conviene reforzar empleabilidad y tener un colchón de seguridad."},
    {k:["impuesto","iva","irpf","fiscal"], msg:"Podrías pagar más impuestos o tener menos deducciones: revisa gastos deducibles y planifica compras grandes."},
    {k:["energía","electricidad","gas","opec","opep","petróleo"], msg:"Facturas de energía más altas y transporte más caro: compensa con eficiencia y planifica consumos."},
    {k:["ciberataque","ransomware","brecha"], msg:"Mayor riesgo digital: activa doble factor, cambia contraseñas y desconfía de correos sospechosos."},
    {k:["ia","inteligencia artificial","automatización"], msg:"Cambios en el trabajo: algunas tareas se automatizan; conviene formarse en habilidades digitales."},
    {k:["sequía","clima","ola de calor"], msg:"Más presión en agua y alimentos: pueden subir precios y haber restricciones puntuales."}
  ];
  for(const r of rules){
    if (r.k.some(x=>t.includes(x))) return r.msg;
  }
  // Genérico y claro
  return "Afecta a tu bolsillo y decisiones: valora precios, contratos y plazos antes de comprar, vender o invertir.";
}

// ————— Glosario corto —————
const GLOSS = {
  "arancel": "Impuesto a productos que entran/salen de un país.",
  "inflación": "Subida general de precios con el tiempo.",
  "euríbor": "Tipo de interés que referencia muchas hipotecas.",
  "bce": "Banco Central Europeo, mueve tipos de interés en la eurozona.",
  "déficit": "Cuando el Estado gasta más de lo que ingresa.",
  "pib": "Valor de todo lo que produce un país en un año.",
  "ia": "Inteligencia Artificial: software que automatiza tareas."
};
function makeGlossary(text){
  const t = text.toLowerCase();
  const found = [];
  for(const [k,v] of Object.entries(GLOSS)){
    if (t.includes(k)) found.push({term:k, def:v});
  }
  // máximo 3 términos
  return found.slice(0,3);
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

    // Solo español (heurística simple por stopwords)
    const sample = (title+" "+desc).toLowerCase();
    const spanishHits = [" el "," la "," los "," las "," de "," y "," en "," por "," para "," con "," que "," una "]
      .filter(w=> (" "+sample+" ").includes(w)).length;
    if (spanishHits < 3) continue;

    const summary = desc ? (desc.length>260? desc.slice(0,257)+"…" : desc) : "";
    const impact  = makeImpact(title, summary);
    const glossary = makeGlossary(title+" "+summary);

    out.push({
      title, link, published,
      summary,
      impact,            // <— B
      glossary,          // <— C  (array de {term,def})
      source             // referencia del medio
    });
  }
  return out.slice(0,50);
}

function dedupe(arr){
  const seen=new Set();
  return arr.filter(x=>{
    const k=(x.title||"").toLowerCase();
    if(seen.has(k)) return false; seen.add(k); return true;
  });
}

async function buildSection(list){
  const xmls  = await Promise.all(list.map(f=>fetchXML(f.url)));
  const items = xmls.flatMap((x,i)=>parseRSS(x, list[i].name));
  const uniq  = dedupe(items);
  return uniq.slice(0,4); // 4 por bloque
}

const out = {
  generated_at: new Date().toISOString(),
  global: await buildSection(FEEDS.global),
  espana: await buildSection(FEEDS.espana),
  local:  await buildSection(FEEDS.local)
};

if(!fs.existsSync("data")) fs.mkdirSync("data");
fs.writeFileSync("data/latest.json", JSON.stringify(out,null,2));
console.log("✅ data/latest.json generado");
