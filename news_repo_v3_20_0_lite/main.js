
const CACHE_KEYS={UPDATED_AT:'news_updated_at_v3200',BUST:'news_cache_bust_v3200',TEEN:'news_teen_mode_v3200'};
const updatedAtEl=document.getElementById('updatedAt'); const geoNoteEl=document.getElementById('geoNote'); const teenToggle=document.getElementById('teenToggle');
const listCataluna=document.getElementById('list-cataluna'); const listES=document.getElementById('list-espana'); const listRioja=document.getElementById('list-rioja');
const listLocal=document.getElementById('list-local'); const listBg=document.getElementById('list-background'); const localTitle=document.getElementById('local-title');
const META=document.querySelector('meta[name="news-remote-json"]'); const REMOTE_JSON_URL=(META && META.content && META.content.trim())?META.content.trim():'';
const AUTO_REFRESH_MS=10*60*1000;

function fmtDate(iso){ try{ const d=new Date(iso); return d.toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'});}catch{return iso;} }
function slugify(s){ return (s||'').toString().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,''); }

function teenifyImpact(text){
  if(!text) return text;
  let t = text;
  const repl = [
    [/hipoteca variable/ig, "hipoteca de tus padres"],
    [/combustible|gasolina/ig, "echar gasolina (sí, carito)"],
    [/transport(e|es)/ig, "transporte (bus/metro)"],
    [/inflación/ig, "precios por las nubes"],
  ];
  repl.forEach(([a,b])=> t = t.replace(a,b));
  const hooks = ["Resumen gamer:", "Modo TikTok:", "Para clase:", "Sin postureo:"];
  const hook = hooks[Math.floor(Math.random()*hooks.length)];
  const emojis = ["🔥","⚡","💥","🧠","😮‍💨","💀","🎮","📱","🤑"];
  return `${hook} ${t} ${emojis[Math.floor(Math.random()*emojis.length)]}`;
}

function render(el, arr, teen=false){
  el.innerHTML = (arr&&arr.length)? arr.map(n=>{
    const link=n.url?`<a href="${n.url}" target="_blank" rel="noopener">${n.title}</a>`:`<strong>${n.title}</strong>`;
    const src=n.source?`<span class="muted"> • ${n.source}</span>`:'';
    const time=n.published_at?`<div class="muted">${fmtDate(n.published_at)}</div>`:'';
    const summary=n.summary?`<p>${n.summary}</p>`:'';
    const impactText = teen? teenifyImpact(n.impact): n.impact;
    const impact=impactText?`<p class="impact">${impactText}</p>`:'';
    const glossary = (n.glossary&&n.glossary.length)? `<div class="glossary">🔎 ${n.glossary.map(g=>`<strong>${g.term}</strong>: ${g.expl}`).join(' • ')}</div>`:'';
    return `<li class="news-item">${link}${src}${time}${summary}${impact}${glossary}</li>`;
  }).join('') : '<li class="news-item"><p class="muted">Sin contenidos (todavía).</p></li>';
}

async function fetchJSON(path,force=false){
  const bust=force?Date.now().toString():(localStorage.getItem(CACHE_KEYS.BUST)||Date.now().toString());
  if(force) localStorage.setItem(CACHE_KEYS.BUST,bust);
  const url=`${path}${path.includes('?')?'&':'?'}bust=${bust}`;
  const res=await fetch(url,{cache:'no-store'});
  if(!res.ok) throw new Error('No se pudo cargar '+path);
  return res.json();
}

async function resolveLocal(){
  localTitle.textContent='Local'; geoNoteEl.textContent='Detectando ubicación…';
  const fallbackChain = async (keys,label)=>{
    for(const k of keys){
      try{
        const j=await fetchJSON(`data/local/${k}.json`,false);
        localTitle.textContent=`Local • ${label(k)}`;
        render(listLocal, j.items, false); geoNoteEl.textContent=`Fuente: ${j.source||'local'}`; return;
      }catch{}
    }
    try{
      const j=await fetchJSON('data/local/generic.json',false);
      localTitle.textContent='Local • Genérico'; render(listLocal, j.items, false); geoNoteEl.textContent=`Fuente: ${j.source||'local'}`;
    }catch{ listLocal.innerHTML='<li class="news-item"><p class="muted">Sin datos locales.</p></li>'; }
  };
  const label=(k)=>k==='spain'?'España':k.replace('-', ' ').toUpperCase();
  if(!navigator.geolocation){ return fallbackChain(['barcelona','catalunya','spain'],label); }
  navigator.geolocation.getCurrentPosition(async pos=>{
    try{
      const {latitude:lat, longitude:lon}=pos.coords;
      const res=await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`);
      const g=await res.json(); const a=g.address||{};
      const locality=slugify(a.city||a.town||a.village||a.hamlet||''); const municipality=slugify(a.municipality||''); const county=slugify(a.county||''); const state=slugify(a.state||''); const cc=(a.country_code||'').toLowerCase();
      const synonyms={praha:['prague','praga'], prague:['praha','praga'], praga:['prague','praha']};
      const keys=[]; if(locality){ keys.push(locality); if(synonyms[locality]) keys.push(...synonyms[locality]); }
      if(municipality && !keys.includes(municipality)) keys.push(municipality);
      if(county && !keys.includes(county)) keys.push(county);
      if(state && !keys.includes(state)) keys.push(state);
      if(cc==='es') keys.push('spain');
      await fallbackChain(keys,label);
    }catch{ fallbackChain(['barcelona','catalunya','spain'],label); }
  }, _=>fallbackChain(['barcelona','catalunya','spain'],label), {timeout:4000});
}

async function load(force=false){
  try{
    const teenMode=localStorage.getItem(CACHE_KEYS.TEEN)==='1'; teenToggle.setAttribute('aria-pressed',teenMode?'true':'false');
    let data=null; try{ if(REMOTE_JSON_URL) data=await fetchJSON(REMOTE_JSON_URL, force); }catch{}
    if(!data) data=await fetchJSON('data/latest.json', force);
    updatedAtEl.textContent='Actualizado: '+fmtDate(data.updated_at);
    render(listCataluna, data.cataluna, teenMode); render(listES, data.espana, teenMode); render(listRioja, data.rioja, teenMode); render(listBg, data.background, teenMode);
    await resolveLocal();
  }catch(e){ updatedAtEl.textContent='Error al actualizar: '+e.message; }
}

document.getElementById('refreshBtn').addEventListener('click',()=>load(true));
document.getElementById('forceCacheClear').addEventListener('click',e=>{ e.preventDefault(); localStorage.clear(); caches&&caches.keys&&caches.keys().then(keys=>keys.forEach(k=>caches.delete(k))); alert('Caché limpia. Recargando…'); window.location.reload(); });
teenToggle.addEventListener('click',()=>{ const next=teenToggle.getAttribute('aria-pressed')!=='true'; teenToggle.setAttribute('aria-pressed',next?'true':'false'); localStorage.setItem(CACHE_KEYS.TEEN,next?'1':'0'); load(false); });

setTimeout(()=>load(false),120);
setInterval(()=>load(true), AUTO_REFRESH_MS);
