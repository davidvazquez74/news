
const KEYS={BUST:'bust_v3202',TEEN:'teen_v3202'};
const updatedAtEl=document.getElementById('updatedAt');
const teenBtn=document.getElementById('teenToggle');
const adultBtn=document.getElementById('adultBtn');
const refreshBtn=document.getElementById('refreshBtn');
const list={
  cataluna:document.getElementById('list-cataluna'),
  espana:document.getElementById('list-espana'),
  rioja:document.getElementById('list-rioja'),
  local:document.getElementById('list-local'),
  background:document.getElementById('list-background')
};
const localTitle=document.getElementById('local-title'); const geoNote=document.getElementById('geoNote');

function fmtDate(iso){ try{const d=new Date(iso); return d.toLocaleString(undefined,{dateStyle:'short',timeStyle:'short'});}catch{return iso;} }
function slugify(s){ return (s||'').toString().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,''); }

// Strong teen transform
function teenify(text){
  if(!text) return text;
  let t=text;
  const subs=[
    [/hipoteca variable/ig,'hipoteca de tus padres'],
    [/gasolina|combustible/ig,'gasolina (carita)'],
    [/transporte p[uú]blico/ig,'metro/bus'],
    [/precios/ig,'precios por las nubes'],
    [/sube(n)?/ig,'se dispara(n)'],
    [/baja(n)?/ig,'se cae(n)'],
    [/alerta/ig,'alerta (modo lluvias ON)'],
    [/impuesto(s)?/ig,'impuestos (ouch)'],
  ];
  subs.forEach(([a,b])=>t=t.replace(a,b));
  const starters=['Modo TikTok:','Resumen gamer:','Traducción al insti:','Sin postureo:'];
  const fin=['🔥','💥','⚡','😮‍💨','💀','🎮','📱','🤑'];
  return `${starters[Math.floor(Math.random()*starters.length)]} ${t} ${fin[Math.floor(Math.random()*fin.length)]}`;
}

function card(n, teen=false){
  const title=n.url?`<a href="${n.url}" target="_blank" rel="noopener">${n.title}</a>`:`<strong>${n.title}</strong>`;
  const meta = `<div class="meta">${n.source||''}${n.published_at?' • '+fmtDate(n.published_at):''}</div>`;
  const sum = n.summary?`<p>${n.summary}</p>`:'';
  const impactText = teen? teenify(n.impact): n.impact;
  const impact = impactText?`<p class="impact">${impactText}</p>`:'';
  const glossary = (n.glossary&&n.glossary.length)? `<div class="glossary">🔎 ${n.glossary.map(g=>`<strong>${g.term}</strong>: ${g.expl}`).join(' • ')}</div>`:'';
  return `<li class="news-item">${title}${meta}${sum}${impact}${glossary}</li>`;
}

function render(el, arr, teen=false){
  el.innerHTML = (arr&&arr.length)? arr.map(x=>card(x,teen)).join('') : '<li class="news-item"><p class="small">Sin contenidos (todavía).</p></li>';
}

async function fetchJSON(path,force=false){
  const bust=force? Date.now().toString() : (localStorage.getItem(KEYS.BUST)||Date.now().toString());
  if(force) localStorage.setItem(KEYS.BUST,bust);
  const url=`${path}${path.includes('?')?'&':'?'}bust=${bust}`;
  const res=await fetch(url,{cache:'no-store'});
  if(!res.ok) throw new Error('No se pudo cargar '+path);
  return res.json();
}

async function resolveLocal(teen){
  localTitle.textContent='Local'; geoNote.textContent='Detectando ubicación…';
  const fallback = async(keys)=>{
    for(const k of keys){
      try{
        const j=await fetchJSON(`data/local/${k}.json`);
        localTitle.textContent=`Local • ${k==='spain'?'España':k.replace('-', ' ').toUpperCase()}`;
        render(list.local,j.items,teen); geoNote.textContent=j.source||''; return;
      }catch{}
    }
    try{
      const j=await fetchJSON('data/local/generic.json');
      localTitle.textContent='Local • Genérico'; render(list.local,j.items,teen); geoNote.textContent=j.source||'';
    }catch{ list.local.innerHTML='<li class="news-item"><p class="small">Sin datos locales.</p></li>'; }
  };
  if(!navigator.geolocation) return fallback(['barcelona','catalunya','spain']);
  navigator.geolocation.getCurrentPosition(async pos=>{
    try{
      const {latitude:lat,longitude:lon}=pos.coords;
      const r=await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`);
      const g=await r.json(); const a=g.address||{};
      const locality=slugify(a.city||a.town||a.village||''); const municipality=slugify(a.municipality||''); const county=slugify(a.county||''); const state=slugify(a.state||'');
      const keys=[]; [locality,municipality,county,state,'spain'].forEach(k=>k&&keys.push(k));
      await fallback(keys);
    }catch{ fallback(['barcelona','catalunya','spain']); }
  }, _=>fallback(['barcelona','catalunya','spain']), {timeout:4000});
}

async function load(force=false){
  try{
    const teen = localStorage.getItem(KEYS.TEEN)==='1';
    adultBtn.setAttribute('aria-selected', teen?'false':'true');
    teenBtn.setAttribute('aria-selected', teen?'true':'false');
    const data = await fetchJSON('data/latest.json', force);
    updatedAtEl.textContent='Actualizado: '+(data.updated_at? new Date(data.updated_at).toLocaleString(): '—');
    render(list.cataluna, data.cataluna, teen);
    render(list.espana, data.espana, teen);
    render(list.rioja, data.rioja, teen);
    render(list.background, data.background, teen);
    await resolveLocal(teen);
  }catch(e){
    updatedAtEl.textContent='Error: '+e.message;
  }
}

refreshBtn.addEventListener('click', ()=>load(true));
teenBtn.addEventListener('click', ()=>{ localStorage.setItem(KEYS.TEEN,'1'); load(false); });
adultBtn.addEventListener('click', ()=>{ localStorage.setItem(KEYS.TEEN,'0'); load(false); });
document.getElementById('forceCacheClear').addEventListener('click', e=>{e.preventDefault(); localStorage.clear(); caches&&caches.keys&&caches.keys().then(keys=>keys.forEach(k=>caches.delete(k))); location.reload();});

setTimeout(()=>load(false),120);
setInterval(()=>load(true), 10*60*1000);
