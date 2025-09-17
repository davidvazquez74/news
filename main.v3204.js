const KEYS={BUST:"bust_v3204",TEEN:"teen_v3204"};
const list={cataluna:document.getElementById("list-cataluna"),espana:document.getElementById("list-espana"),rioja:document.getElementById("list-rioja"),local:document.getElementById("list-local"),background:document.getElementById("list-background")};
function fmtDate(i){try{return new Date(i).toLocaleString()}catch{return i}}
function card(n,teen=false){const t=n.url?`<a href="${n.url}" target="_blank" rel="noopener">${n.title}</a>`:`<strong>${n.title}</strong>`;
const meta=`<div class="small">${n.source||""}${n.published_at?" • "+fmtDate(n.published_at):""}</div>`;
const sum=n.summary?`<p>${n.summary}</p>`:""; const imp=n.impact?`<p class="impact">${teen?("Modo TikTok: "+n.impact+" 🔥"):n.impact}</p>`:"";
return `<li class="news-item">${t}${meta}${sum}${imp}</li>`}
function render(el,arr,teen){el.innerHTML=(arr&&arr.length)?arr.map(x=>card(x,teen)).join(""):'<li class="news-item"><p class="small">Sin contenidos.</p></li>'}
async function fetchJSON(p,f=false){const b=f?Date.now().toString():(localStorage.getItem(KEYS.BUST)||Date.now().toString()); if(f) localStorage.setItem(KEYS.BUST,b);
const u=`${p}${p.includes("?")?"&":"?"}bust=${b}`; const r=await fetch(u,{cache:"no-store"}); if(!r.ok) throw new Error("No se pudo cargar "+p); return r.json()}
async function load(force=false){try{const teen=localStorage.getItem(KEYS.TEEN)==="1";document.getElementById("adultBtn").setAttribute("aria-selected",teen?"false":"true");
document.getElementById("teenToggle").setAttribute("aria-selected",teen?"true":"false"); const d=await fetchJSON("data/latest.json",force);
document.getElementById("updatedAt").textContent="Actualizado: "+(d.updated_at?new Date(d.updated_at).toLocaleString():"—");
render(list.cataluna,d.cataluna,teen); render(list.espana,d.espana,teen); render(list.rioja,d.rioja,teen); render(list.background,d.background,teen);}catch(e){document.getElementById("updatedAt").textContent="Error: "+e.message;}}
document.getElementById("refreshBtn").addEventListener("click",async()=>{try{localStorage.clear(); if (window.caches?.keys){const ks=await caches.keys(); await Promise.all(ks.map(k=>caches.delete(k)));}}finally{location.replace(location.pathname+"?b="+Date.now())}});
document.getElementById("teenToggle").addEventListener("click",()=>{localStorage.setItem(KEYS.TEEN,"1");load(false)});
document.getElementById("adultBtn").addEventListener("click",()=>{localStorage.setItem(KEYS.TEEN,"0");load(false)});
document.getElementById("forceCacheClear")?.addEventListener("click",e=>{e.preventDefault();localStorage.clear();location.replace(location.pathname+"?b="+Date.now())});
setTimeout(()=>load(false),150);