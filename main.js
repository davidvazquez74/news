// NotiBuddy - front minimal compatible
const $ = s => document.querySelector(s);
const appEl = $("#app");
const nowFmt = () => new Date().toISOString();

// Footer/build info
function setBuildInfo(meta){
  const appV = `App vTeen2.3`;
  const dataV = meta?.version ? `Datos ${meta.version}` : "Datos –";
  $("#app-version").textContent = appV;
  $("#app-version-bottom").textContent = appV;
  $("#data-version").textContent = dataV;
  $("#data-version-bottom").textContent = dataV;
  const t = new Date().toISOString();
  $("#now").textContent = t;
  $("#now-bottom").textContent = t;
}

// Fetch JSON helper (always bypass HTTP cache)
async function getJSON(url){
  const u = new URL(url, location.href);
  u.searchParams.set("_", Date.now().toString());
  const res = await fetch(u.toString(), { cache: "no-store" });
  if(!res.ok) throw new Error("HTTP "+res.status);
  return res.json();
}

function hoursAgo(iso){
  try{
    const diff = (Date.now() - new Date(iso).getTime())/36e5;
    if(diff < 1) return "hace unos minutos";
    if(diff < 24) return `hace ${Math.round(diff)} h`;
    return new Date(iso).toLocaleString();
  }catch{ return ""; }
}

function card(news){
  const tags = [];
  if(news.tag) tags.push(`<span class="nb-tag">#${news.tag}</span>`);
  if(typeof news.severity === "number") tags.push(`<span class="nb-tag">sev ${news.severity}</span>`);
  const time = news.published_at ? new Date(news.published_at).toLocaleString() : "";
  return `
    <a class="nb-link" href="${news.url || "#"}" target="_blank" rel="noopener">
      <article class="nb-card nb-card--click">
        <h3>${news.title}</h3>
        ${news.summary ? `<p class="nb-muted">${news.summary}</p>` : ""}
        ${news.impact ? `<p><strong>Impacto:</strong> ${news.impact}</p>` : ""}
        ${time ? `<div class="nb-mutedsm">${time}</div>` : ""}
        ${tags.length ? `<div class="nb-tags">${tags.join("")}</div>` : ""}
      </article>
    </a>`;
}

function section(name, items){
  const id = name.toLowerCase().replace(/\s+/g,"-");
  const title = name.toUpperCase();
  return `
    <section id="${id}">
      <h2 class="nb-section-title">${title}</h2>
      ${items.map(card).join("")}
    </section>`;
}

async function render(){
  try{
    const json = await getJSON("./latest.json");
    setBuildInfo(json);
    appEl.innerHTML = "";
    const groups = [];
    if(json.cataluna?.length) groups.push(section("Cataluña", json.cataluna));
    if(json.espana?.length) groups.push(section("España", json.espana));
    if(json.rioja?.length) groups.push(section("Rioja", json.rioja));
    if(json.background?.length) groups.push(section("Global", json.background));
    if(groups.length === 0){
      appEl.innerHTML = `<div class="nb-card"><h3>Sin noticias</h3><p class="nb-muted">No hay datos en latest.json</p></div>`;
    }else{
      appEl.innerHTML = groups.join("\n");
    }
  }catch(err){
    appEl.innerHTML = `<div class="nb-card"><h3>Error</h3><p class="nb-muted">No se pudo cargar latest.json</p><pre class="nb-mutedsm">${String(err)}</pre></div>`;
  }
}

// Controls
$("#btn-clear").addEventListener("click", async () => {
  if("caches" in window){
    const keys = await caches.keys();
    await Promise.all(keys.map(k => caches.delete(k)));
  }
  sessionStorage.clear(); localStorage.clear();
  location.reload();
});
$("#btn-force").addEventListener("click", () => location.reload(true));
$("#force-refresh").addEventListener("click", () => location.reload(true));

// Toggle teen view (client side, filtro por impact_teen si existe)
let teenMode = false;
function setSegUI(){
  $("#toggle-mode").classList.toggle("active", !teenMode);
  $("#toggle-mode-teen").classList.toggle("active", teenMode);
}
$("#toggle-mode").addEventListener("click", ()=>{ teenMode=false; render(); setSegUI(); });
$("#toggle-mode-teen").addEventListener("click", ()=>{ teenMode=true; renderTeen(); setSegUI(); });
$("#btn-teen").addEventListener("click", ()=>{ teenMode = !teenMode; teenMode ? renderTeen() : render(); setSegUI(); });

async function renderTeen(){
  try{
    const json = await getJSON("./latest.json");
    setBuildInfo(json);
    const mapTeen = (arr=[]) => arr.map(n => ({
      ...n,
      impact: n.impact_teen || n.impact
    }));
    const out = [];
    if(json.cataluna?.length) out.push(section("Cataluña", mapTeen(json.cataluna)));
    if(json.espana?.length)   out.push(section("España",   mapTeen(json.espana)));
    if(json.rioja?.length)    out.push(section("Rioja",    mapTeen(json.rioja)));
    if(json.background?.length) out.push(section("Global", mapTeen(json.background)));
    appEl.innerHTML = out.join("\n") || `<div class="nb-card"><h3>Sin noticias</h3></div>`;
  }catch(e){
    appEl.innerHTML = `<div class="nb-card"><h3>Error</h3><pre class="nb-mutedsm">${String(e)}</pre></div>`;
  }
}

// Weather (uses existing weather_client.js API if present)
(function initWeather(){
  if(typeof window.NotiWeather === "function"){
    window.NotiWeather({
      onUpdate: (w) => {
        const now = w?.now || {};
        const place = w?.place || {};
        const hi = w?.today?.hi;
        const lo = w?.today?.lo;
        document.getElementById("w-temp").textContent = (now.temp ?? "--") + "°C";
        document.getElementById("w-summary").textContent = now.summary || "";
        document.getElementById("w-location").textContent = place.name || "";
        document.getElementById("w-hi").textContent = (hi!=null? "↑"+hi+"°":"");
        document.getElementById("w-lo").textContent = (lo!=null? "↓"+lo+"°":"");
        document.getElementById("w-updated").textContent = "Actualizado: " + (now.time || new Date().toLocaleString());
      }
    });
  }else{
    // fallback label
    document.getElementById("w-summary").textContent = "Tiempo no disponible";
  }
})();

render();
setSegUI();