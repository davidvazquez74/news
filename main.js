
const CACHE_KEYS={UPDATED_AT:'news_updated_at_v3176',BUST:'news_cache_bust_v3176',TEEN:'news_teen_mode_v3176',QUIZ:'news_quiz_score_v3176'};

const updatedAtEl=document.getElementById('updatedAt'); const geoNoteEl=document.getElementById('geoNote'); const teenToggle=document.getElementById('teenToggle');
const listCataluna=document.getElementById('list-cataluna'); const listES=document.getElementById('list-espana'); const listRioja=document.getElementById('list-rioja');
const listLocal=document.getElementById('list-local'); const listBg=document.getElementById('list-background'); const localTitle=document.getElementById('local-title');
const quizSection=document.getElementById('teens-quiz'); const quizContainer=document.getElementById('quiz-container'); const quizReset=document.getElementById('quizReset'); const quizScore=document.getElementById('quizScore');

// Config: remote JSON URL (set in index <meta name="news-remote-json" content="...">)
const META=document.querySelector('meta[name="news-remote-json"]'); const REMOTE_JSON_URL=(META && META.content && META.content.trim())?META.content.trim():'';
const AUTO_REFRESH_MS=10*60*1000; // 10 minutes

function fmtDate(iso){ try{ const d=new Date(iso); return d.toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'});}catch{return iso;} }
function slugify(s){ return (s||'').toString().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,''); }

function teenifySentence(s){ if(!s) return s; let t=s; t=t.replace(/\bvergüenza ajena\b/ig,'cringe'); t=t.replace(/\bexpectación\b/ig,'hype'); t=t.replace(/\bpunto de vista\b/ig,'POV'); if(t.length<160&&Math.random()<0.25) t+=' (POV: tranquis, pero ojo)'; return t; }
function teenifyNews(n){ const copy={...n}; copy.title=teenifySentence(copy.title); const base=copy.summary||''; const imp=copy.impact?` • ${copy.impact}`:''; copy.summary=teenifySentence(base+imp)+' 🎮📱'; return copy; }

function renderList(el,items,teen=false){
  el.innerHTML='';
  if(!items||!items.length){ const li=document.createElement('li'); li.className='news-item'; li.innerHTML='<p class="muted">Sin contenidos (todavía).</p>'; el.appendChild(li); return; }
  items.forEach(n=>{
    const item=teen?teenifyNews(n):n;
    const li=document.createElement('li'); li.className='news-item';
    const link=item.url?`<a href="${item.url}" target="_blank" rel="noopener">${item.title}</a>`:`<strong>${item.title}</strong>`;
    const src=item.source?`<span class="muted"> • ${item.source}</span>`:'';
    const time=item.published_at?`<div class="muted">${fmtDate(item.published_at)}</div>`:'';
    const summary=item.summary?`<p>${item.summary}</p>`:'';
    const impact=(!teen&&item.impact)?`<p class="impact">${item.impact}</p>`:'';
    li.innerHTML=`${link}${src}${time}${summary}${impact}`;
    el.appendChild(li);
  });
}

async function fetchJSON(path,force=false){
  const bust=force?Date.now().toString():(localStorage.getItem(CACHE_KEYS.BUST)||Date.now().toString());
  if(force) localStorage.setItem(CACHE_KEYS.BUST,bust);
  const url=`${path}${path.includes('?')?'&':'?'}bust=${bust}`;
  const res=await fetch(url,{cache:'no-store'});
  if(!res.ok) throw new Error('No se pudo cargar '+path);
  return res.json();
}

async function load(force=false){
  try{
    const teenMode=localStorage.getItem(CACHE_KEYS.TEEN)==='1'; teenToggle.setAttribute('aria-pressed',teenMode?'true':'false');
    // 1) Try remote (if configured)
    let data=null; let usedRemote=false;
    if(REMOTE_JSON_URL){
      try{ data=await fetchJSON(REMOTE_JSON_URL, force); usedRemote=true; }
      catch(_e){ /* will fallback */ }
    }
    // 2) Fallback local
    if(!data){
      data=await fetchJSON('data/latest.json', force);
      usedRemote=false;
    }
    updatedAtEl.textContent=`Actualizado: ${fmtDate(data.updated_at)}${usedRemote?' • remoto':''}`;

    renderList(listCataluna,data.cataluna,teenMode);
    renderList(listES,data.espana,teenMode);
    renderList(listRioja,data.rioja,teenMode);
    renderList(listBg,data.background,teenMode);

    await resolveLocal(teenMode);
    // auto-refresh scheduling
    scheduleAutoRefresh();
    localStorage.setItem(CACHE_KEYS.UPDATED_AT,Date.now().toString());
  }catch(e){ updatedAtEl.textContent='Error al actualizar: '+e.message; }
}

let autoTimer=null;
function scheduleAutoRefresh(){
  if(autoTimer) clearInterval(autoTimer);
  autoTimer=setInterval(()=>load(true), AUTO_REFRESH_MS);
  // Also refresh when tab becomes visible again
  document.addEventListener('visibilitychange', ()=>{ if(document.visibilityState==='visible'){ load(true); } });
}

async function resolveLocal(teenMode){
  localTitle.textContent='Local'; geoNoteEl.textContent='Detectando ubicación…';
  const fallbackChain = async (keys, label) => {
    for (const k of keys){
      try{
        const j=await fetchJSON(`data/local/${k}.json`,false);
        localTitle.textContent=`Local • ${label(k)}`;
        renderList(listLocal,j.items,teenMode);
        geoNoteEl.textContent=`Fuente: ${j.source||'local'}`;
        return true;
      }catch{}
    }
    try{
      const j=await fetchJSON('data/local/generic.json',false);
      localTitle.textContent='Local • Genérico';
      renderList(listLocal,j.items,teenMode);
      geoNoteEl.textContent=`Fuente: ${j.source||'local'}`;
      return true;
    }catch{
      renderList(listLocal,[],teenMode);
      geoNoteEl.textContent='Sin datos locales.';
      return false;
    }
  };
  const label = (k)=> k==='spain'?'España':k.replace('-', ' ').toUpperCase();

  if(!navigator.geolocation){
    return fallbackChain(['barcelona','catalunya','spain'], label);
  }
  return new Promise(resolve=>{
    navigator.geolocation.getCurrentPosition(async pos=>{
      try{
        const {latitude:lat, longitude:lon}=pos.coords;
        const res=await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`);
        if(!res.ok) throw new Error('geo');
        const g=await res.json(); const addr=g.address||{};
        const locality=slugify(addr.city||addr.town||addr.village||addr.hamlet||'');
        const municipality=slugify(addr.municipality||''); const county=slugify(addr.county||''); const state=slugify(addr.state||''); const cc=(addr.country_code||'').toLowerCase();

        // Synonyms (Prague/Praha/Praga)
        const synonyms={praha:['prague','praga'], prague:['praha','praga'], praga:['prague','praha']};

        const keys=[];
        if(locality){ keys.push(locality); if(synonyms[locality]) keys.push(...synonyms[locality]); }
        if(municipality && !keys.includes(municipality)) keys.push(municipality);
        if(county && !keys.includes(county)) keys.push(county);
        if(state && !keys.includes(state)) keys.push(state);
        if(cc==='es') keys.push('spain');
        await fallbackChain(keys, label);
        resolve(true);
      }catch{
        fallbackChain(['barcelona','catalunya','spain'], label).then(()=>resolve(false));
      }
    }, _err=>{
      fallbackChain(['barcelona','catalunya','spain'], label).then(()=>resolve(false));
    }, {timeout:4000});
  });
}

document.getElementById('refreshBtn').addEventListener('click',()=>load(true));
document.getElementById('forceCacheClear').addEventListener('click',e=>{ e.preventDefault(); localStorage.clear(); caches&&caches.keys&&caches.keys().then(keys=>keys.forEach(k=>caches.delete(k))); alert('Caché limpia. Recargando…'); window.location.reload(); });
teenToggle.addEventListener('click',()=>{ const next=teenToggle.getAttribute('aria-pressed')!=='true'; teenToggle.setAttribute('aria-pressed',next?'true':'false'); localStorage.setItem(CACHE_KEYS.TEEN,next?'1':'0'); document.getElementById('teens-quiz').hidden=!next; load(false); });

const last=parseInt(localStorage.getItem(CACHE_KEYS.UPDATED_AT)||'0',10); const threeHours=3*60*60*1000; if(!last||(Date.now()-last)>threeHours){ load(true);} else { load(false); }
