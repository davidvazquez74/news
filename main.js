const $ = s => document.querySelector(s);

function toTeen(text=""){
  if(!text) return "";
  return text
    .replace(/\bEn claro:\s*/i, "")
    .replace(/\bPor qué importa:\s*/i, "")
    .replace(/\bQué significa:\s*/i, "")
    .replace(/\bcontexto\b/gi,"idea clave")
    .replace(/\bimpacta\b/gi,"te afecta");
}

function fmtDate(iso){
  if(!iso) return "";
  try{ return new Date(iso).toLocaleString(undefined,{hour12:false}); }catch{ return ""; }
}

function ensureImpact(item){
  const base = item.why_it_matters || item.summary || "";
  if (base) return base.startsWith("En claro:") ? base : "En claro: " + base;
  if (item.title) return "En claro: " + item.title;
  return "En claro: Información clave aún no disponible.";
}

function card(item, mode){
  const art = document.createElement("article");
  art.className = "news-card";
  const title = item.title || "Sin título";
  const href = item.link || "#";
  const published = fmtDate(item.published);
  const summary = item.summary || "";
  const impact = ensureImpact(item);

  const showSummary = mode==="teen" ? (toTeen(summary)) : summary;
  const showImpact  = mode==="teen" ? (toTeen(impact))  : impact;

  art.innerHTML = `
    <a class="news-title" target="_blank" rel="noopener noreferrer"></a>
    <p class="meta">${published ? published : ""}</p>
    <p class="news-summary"></p>
    <p class="news-impact"></p>
  `;
  const a = art.querySelector(".news-title");
  a.textContent = title;
  a.href = href;

  art.querySelector(".news-summary").textContent = showSummary;
  art.querySelector(".news-impact").textContent  = showImpact;
  return art;
}

function renderSection(sel, items, mode){
  const el = $(sel);
  if(!el) return;
  el.innerHTML = "";
  if(!items || !items.length){
    const p = document.createElement("p");
    p.className = "news-impact";
    p.textContent = "En claro: Sin contenidos (todavía).";
    el.appendChild(p);
    return;
  }
  for(const it of items){
    el.appendChild(card(it, mode));
  }
}

async function load(mode){
  try{
    const res = await fetch(`/data/latest.json?t=${Date.now()}`);
    const data = await res.json();
    $("#generatedAt").textContent = data.generated_at
      ? "Actualizado: " + fmtDate(data.generated_at) : "";
    renderSection("#global", data.global, mode);
    renderSection("#espana", data.espana, mode);
    renderSection("#local",  data.local,  mode);
  }catch(e){
    const main = document.querySelector("main");
    const div = document.createElement("div");
    div.className = "news-impact";
    div.textContent = "En claro: No se pudo cargar /data/latest.json";
    main.prepend(div);
  }
}

function currentMode(){
  const sel = $("#modeSelect");
  const urlMode = new URLSearchParams(location.search).get("mode");
  if(urlMode==="teen") sel.value="teen";
  return sel.value;
}

window.addEventListener("DOMContentLoaded", () => {
  const sel = $("#modeSelect");
  $("#refreshBtn").addEventListener("click", () => load(currentMode()));
  sel.addEventListener("change", () => load(currentMode()));
  load(currentMode());
});
