const $ = s => document.querySelector(s);

function fmtDate(iso){
  if(!iso) return "";
  try{ return new Date(iso).toLocaleString(undefined,{hour12:false}); }catch{ return ""; }
}

// Teens: MISMA estructura, tono juvenil + emojis, sin cambiar contenido
function toTeen(text=""){
  if(!text) return "";
  let t = text
    .replace(/\busted(es)?\b/gi,"tú")
    .replace(/\bvalor\b/gi,"precio")
    .replace(/\bconsumo\b/gi,"compras")
    .replace(/\bfinanzas\b/gi,"dinero");
  if (t.length < 140) t += " ⚡🙂";
  return t;
}

function renderCard(item, mode){
  const wrap = document.createElement("article");
  wrap.className = "news-card";

  // Noticia (clickable)
  const a = document.createElement("a");
  a.className = "news-title";
  a.target = "_blank"; a.rel = "noopener noreferrer";
  a.textContent = item.title || "Sin título";
  a.href = item.link || "#";
  wrap.appendChild(a);

  const meta = document.createElement("p");
  meta.className = "meta";
  meta.textContent = item.published ? fmtDate(item.published) : "";
  wrap.appendChild(meta);

  // Impacto (cómo te afecta) — SIN prefijo
  const impactText = item.impact || "";
  const impact = document.createElement("div");
  impact.className = "block";
  impact.innerHTML = `<h4>Impacto</h4><p>${ mode==="teen" ? toTeen(impactText) : impactText }</p>`;
  wrap.appendChild(impact);

  // Glosario — SIN prefijo
  const gl = document.createElement("div");
  gl.className = "block gloss";
  gl.innerHTML = `<h4>Glosario</h4>${
    (item.glossary && item.glossary.length)
      ? item.glossary.map(g=>`<div class="gloss-item"><strong>${g.term}:</strong> ${g.def}</div>`).join("")
      : "<div class='gloss-item'>—</div>"
  }`;
  wrap.appendChild(gl);

  return wrap;
}

function renderSection(sel, items, mode){
  const el = $(sel);
  if(!el) return;
  el.innerHTML = "";
  (items||[]).slice(0,4).forEach(it => el.appendChild(renderCard(it, mode)));
}

async function load(mode){
  const res = await fetch(`/data/latest.json?t=${Date.now()}`);
  const data = await res.json();
  $("#generatedAt").textContent = data.generated_at ? "Actualizado: " + fmtDate(data.generated_at) : "";
  renderSection("#global", data.global, mode);
  renderSection("#espana", data.espana, mode);
  renderSection("#local",  data.local,  mode);
}

function setMode(mode){
  document.getElementById("tabAdult").classList.toggle("active", mode==="adult");
  document.getElementById("tabTeen").classList.toggle("active",  mode==="teen");
  load(mode);
}

window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("refreshBtn").addEventListener("click", ()=> load(document.body.dataset.mode||"adult"));
  document.getElementById("tabAdult").addEventListener("click", ()=> { document.body.dataset.mode="adult"; setMode("adult"); });
  document.getElementById("tabTeen").addEventListener("click",  ()=> { document.body.dataset.mode="teen";  setMode("teen");  });
  const urlMode = new URLSearchParams(location.search).get("mode");
  document.body.dataset.mode = (urlMode==="teen") ? "teen" : "adult";
  setMode(document.body.dataset.mode);
});
