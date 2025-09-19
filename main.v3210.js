// main.v3210.js
const $ = (s) => document.querySelector(s);
let mode = (localStorage.getItem('mode') === 'teen') ? 'teen' : 'adult';
let appVersion = localStorage.getItem('appVersion') || '';

function fmtDate(iso){ if(!iso) return ''; try{ return new Date(iso).toLocaleString(undefined,{hour12:false}); }catch{ return ''; } }
function el(tag, cls){ const n=document.createElement(tag); if(cls) n.className=cls; return n; }
function textOr(s,d=''){ return (typeof s==='string' && s.trim())?s:d; }
async function fetchJSON(u){ const r=await fetch(u+(u.includes('?')?'&':'?')+'t='+Date.now(),{cache:'no-store'}); if(!r.ok) throw new Error('HTTP '+r.status+' @ '+u); return r.json(); }

async function checkVersion(){
  try{
    const meta=await fetchJSON('/data/meta.json');
    const newV=meta.version||'';
    if(newV && newV!==appVersion){
      localStorage.setItem('appVersion',newV); appVersion=newV;
      try{ if(window.caches?.keys){ const ks=await caches.keys(); await Promise.all(ks.map(k=>caches.delete(k))); } }catch{}
      const base=location.pathname.replace(/\/+$/,'')||'/'; location.replace(base+'?b='+encodeURIComponent(newV)); return;
    }
  }catch(e){ console.warn('No se pudo comprobar meta.json',e); }
}

function renderItemLI(item){
  const li=el('li','news-card');
  const a=el('a','news-title'); a.target='_blank'; a.rel='noopener noreferrer'; a.href=item.url||item.link||'#'; a.textContent=textOr(item.title,'Sin título'); li.appendChild(a);
  const when=item.published_at||item.published||''; const metaP=el('p','meta'); const src=item.source?` • ${item.source}`:''; metaP.textContent=(when?fmtDate(when):'')+src; if(metaP.textContent.trim()) li.appendChild(metaP);
  const impactAdult=item.impact_adult||item.impact||''; const impactTeen=item.impact_teen||''; const impactTxt=(mode==='teen')?impactTeen:impactAdult;
  if(impactTxt){ const p=el('p','impact'); p.textContent=impactTxt; li.appendChild(p); }
  const gl=Array.isArray(item.glossary)?item.glossary:[]; if(gl.length){ const box=el('div','gloss'); for(const g of gl){ const row=el('div','gloss-item'); const term=textOr(g.term); const def=textOr(g.expl||g.def); row.innerHTML=`<strong>${term}:</strong> ${def}`; box.appendChild(row);} li.appendChild(box); }
  return li;
}
function renderList(sel,items){ const ul=$(sel); if(!ul) return; ul.innerHTML=''; const arr=Array.isArray(items)?items:[]; if(!arr.length){ ul.innerHTML='<li class="empty">Sin contenidos (todavía).</li>'; return; } for(const it of arr) ul.appendChild(renderItemLI(it)); }

async function loadAll(){
  try{
    const data=await fetchJSON('/data/latest.json');
    const cataluna=data.cataluna||[]; const espana=data.espana||[]; const rioja=data.rioja||[]; const global=data.background||[];
    const localItems=(data.blocksOut && Array.isArray(data.blocksOut.MolinsDeRei))?data.blocksOut.MolinsDeRei:cataluna;
    renderList('#list-cataluna',cataluna); renderList('#list-espana',espana); renderList('#list-rioja',rioja); renderList('#list-background',global); renderList('#list-local',localItems);
    const updated=data.updated_at||data.generated_at||''; const $upd=$('#updatedAt'); if($upd) $upd.textContent=updated?('Actualizado: '+fmtDate(updated)):'—';
  }catch(e){ console.error('Error cargando latest.json',e); for(const sel of ['#list-cataluna','#list-espana','#list-rioja','#list-local','#list-background']){ const ul=$(sel); if(ul) ul.innerHTML='<li class="empty">No se pudieron cargar noticias.</li>'; } }
}

function applyMode(newMode){
  mode=(newMode==='teen')?'teen':'adult'; localStorage.setItem('mode',mode);
  const btn=$('#teenToggle'); if(btn){ const on=(mode==='teen'); btn.setAttribute('aria-selected',String(on)); btn.textContent=on?'Teens (ON)':'Teens'; }
  loadAll();
}

function bindUI(){
  $('#teenToggle')?.addEventListener('click',()=>applyMode(mode==='teen'?'adult':'teen'));
  $('#refreshBtn')?.addEventListener('click',async()=>{ localStorage.removeItem('appVersion'); try{ if(window.caches?.keys){ const ks=await caches.keys(); await Promise.all(ks.map(k=>caches.delete(k))); } }catch{} const stamp=Date.now(); const base=location.pathname.replace(/\/+$/,'')||'/'; location.replace(base+'?force='+stamp); });
  $('#forceCacheClear')?.addEventListener('click',async(e)=>{ e.preventDefault(); localStorage.clear(); try{ if(window.caches?.keys){ const ks=await caches.keys(); await Promise.all(ks.map(k=>caches.delete(k))); } }catch{} alert('Caché limpiada. Recargando…'); location.replace((location.pathname||'/')+'?clear='+Date.now()); });
}

window.addEventListener('DOMContentLoaded',()=>{
  const urlMode=new URLSearchParams(location.search).get('mode'); if(urlMode==='teen') mode='teen'; localStorage.setItem('mode',mode);
  bindUI(); applyMode(mode); checkVersion(); setInterval(checkVersion,5*60*1000);
});
