
const KEYS={BUST:'bust_v3209',TEEN:'teen_v3209'};
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
function clamp(s,max=200){ if(!s) return ''; const t=s.trim(); return t.length>max? t.slice(0,max-1)+'…' : t; }
function cleanImpact(s=''){ return s.replace(/^\s*(Impacto:|En claro:)\s*/i,'').replace(/Seguimiento recomendado.*$/i,'').trim(); }

function impactAdult(title='', summary='', impact=''){
  const text = (title+' '+summary).toLowerCase();
  const base = cleanImpact(impact);
  const choose = (arr)=>arr[Math.floor(Math.random()*arr.length)];
  if(base && base.length>15) return clamp(base);

  if(/eur[ií]bor|bce|tipos de inter[eé]s/.test(text)){
    return clamp(choose([
      'Si tu hipoteca es variable, tu cuota puede moverse en próximas revisiones.',
      'Hipoteca variable: revisa la cuota; puede subir o bajar según el euríbor.',
      'Atento a la revisión de hipoteca si es variable: podría cambiar la mensualidad.'
    ]));
  }
  if(/gasolina|di[eé]sel|petr[oó]leo|carburante|combustible/.test(text)){
    return clamp(choose([
      'Repostar puede salir algo más caro; planifica trayectos o compara gasolineras.',
      'Posible subida en el depósito: valora alternativas de transporte estos días.',
      'Si conduces a diario, vigila precios de surtidor; pueden moverse.'
    ]));
  }
  if(/huelga|par[oó]|paralizaci[oó]n/.test(text) && /tren|metro|bus|rodalies|renfe|aeropuerto|vuelo/.test(text)){
    return clamp(choose([
      'Chequea horarios y alternativas: podrían aparecer retrasos o servicios mínimos.',
      'Si viajas, confirma horarios antes de salir; puede haber esperas.',
      'Planifica márgenes: transporte con posibles incidencias.'
    ]));
  }
  if(/alquiler|vivienda|hipoteca|vpo|smi/.test(text)){
    return clamp(choose([
      'Impacto en bolsillo: alquiler/hipoteca o nómina podrían cambiar en próximas semanas.',
      'Si estás buscando piso o renovando contrato, atento a condiciones y ayudas.',
      'Posibles cambios en costes de vivienda o en ingresos según la medida.'
    ]));
  }
  if(/inteligencia artificial|ai act|algoritmo|modelo|ia\b/.test(text)){
    return clamp(choose([
      'Apps y servicios podrían cambiar reglas y permisos; más avisos y controles.',
      'Es probable que veas más avisos y límites en apps con IA.',
      'Las empresas tendrán nuevas normas con IA: impacto en productos que usas.'
    ]));
  }
  if(/impuesto|iva|tas(a|as)|subsidio|bono/.test(text)){
    return clamp(choose([
      'Puede cambiar lo que pagas o recibes: revisa facturas y fechas.',
      'Atento a recibos y compras: podrían variar importes o requisitos.',
      'Revisa si te afecta en la declaración o en bonificaciones.'
    ]));
  }
  if(/gaza|israel|ucrania|rusia|otan|ir[aá]n|yemen|mar rojo/.test(text)){
    return clamp(choose([
      'Si viajas, revisa alertas y vuelos; podría influir en energía y precios.',
      'Tensión internacional: posible efecto en combustibles y logística.',
      'Viajes y costes de energía pueden notar movimientos si escala.'
    ]));
  }
  return clamp(choose([
    'Puede tocar precios o servicios si la situación avanza; mantente al tanto.',
    'Pendiente de evolución: podría notarse en facturas o movilidad.',
    'Según evolucione, puede repercutir en tu día a día (compras, trámites o desplazamientos).'
  ]));
}

function impactTeen(title='', summary='', impact=''){
  const t = (title||'').toLowerCase();
  const choose = (arr)=>arr[Math.floor(Math.random()*arr.length)];
  if(/eur[ií]bor|hipoteca|bce|tipos/.test(t)){
    return clamp(choose([
      'Si en casa hay hipoteca variable, la letra puede cambiar. 💶',
      'Tus padres con hipoteca variable: ojo, la cuota puede moverse. ⚠️'
    ]));
  }
  if(/gasolina|di[eé]sel|petr[oó]leo|carburante|combustible/.test(t)){
    return clamp(choose([
      'Echar gasolina sale más caro → finde y viajes, un pelín más caros. ⛽',
      'Si vais en coche, preparaos: el depósito puede doler más. 💸'
    ]));
  }
  if(/huelga|paro/.test(t) && /tren|metro|bus|rodalies|renfe|aeropuerto|vuelo/.test(t)){
    return clamp(choose([
      'Ojito con metro/tren: retrasos y tocar madrugar. 🚌',
      'Plan de escape para clase/entreno: puede haber esperas. ⏱️'
    ]));
  }
  if(/impuesto|iva|tas(a|as)/.test(t)){
    return clamp(choose([
      'Cosas un poco más caras o cambios en ayudas; pregunta en casa. 🧾',
      'Puede subir lo que pagáis en compras o facturas. 💶'
    ]));
  }
  if(/inteligencia artificial|ia|algoritmo/.test(t)){
    return clamp(choose([
      'Apps con más normas y avisos; alguna función puede cambiar. 📱',
      'Más filtros y controles en apps con IA. ✅'
    ]));
  }
  if(/gaza|israel|ucrania|rusia|otan|ir[aá]n|yemen|mar rojo/.test(t)){
    return clamp(choose([
      'Si viajas, mira alertas y vuelos; la gasolina puede subir. ✈️',
      'Más lío fuera = viajes y precios moviéndose. 🌍'
    ]));
  }
  return clamp(choose([
    'Puede tocar planes o precios si esto crece. ⚡',
    'Atentos: podría notarse en casa o en el insti según evolucione. 👀'
  ]));
}

function card(n, teen=false){
  const title=n.url?`<a href="${n.url}" target="_blank" rel="noopener">${n.title}</a>`:`<strong>${n.title}</strong>`;
  const meta = `<div class="meta">${n.source||''}${n.published_at?' • '+fmtDate(n.published_at):''}</div>`;
  const impactTxt = teen? impactTeen(n.title, n.summary, n.impact) : impactAdult(n.title, n.summary, n.impact);
  const impact = impactTxt?`<p class="impact">${impactTxt}</p>`:'';
  return `<li class="news-item">${title}${meta}${impact}</li>`;
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
    render(list.local,[],teen); geoNote.textContent='';
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
    document.getElementById('adultBtn').setAttribute('aria-selected', teen?'false':'true');
    document.getElementById('teenToggle').setAttribute('aria-selected', teen?'true':'false');
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

refreshBtn.addEventListener('click', async ()=>{
  try{
    localStorage.clear();
    if (window.caches?.keys) {
      const keys = await caches.keys();
      await Promise.all(keys.map(k=>caches.delete(k)));
    }
  }finally{
    const b=Date.now();
    location.replace(location.pathname + '?b=' + b);
  }
});
teenBtn.addEventListener('click', ()=>{ localStorage.setItem(KEYS.TEEN,'1'); load(false); });
adultBtn.addEventListener('click', ()=>{ localStorage.setItem(KEYS.TEEN,'0'); load(false); });
document.getElementById('forceCacheClear').addEventListener('click', e=>{e.preventDefault(); localStorage.clear(); location.replace(location.pathname+'?b='+Date.now());});

setTimeout(()=>load(false),120);
setInterval(()=>load(true), 10*60*1000);
