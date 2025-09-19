// weather_client.js — geolocalización en cliente + Open-Meteo
(() => {
  const ICONS = { Clear:'☀️', Sunny:'☀️', Clouds:'☁️', Rain:'🌧️', Drizzle:'🌦️', Thunderstorm:'⛈️', Snow:'❄️', Mist:'🌫️', Haze:'🌫️', Fog:'🌫️' };
  const WMO = {0:'Sunny',1:'Clear',2:'Clouds',3:'Clouds',45:'Fog',48:'Fog',51:'Drizzle',53:'Drizzle',55:'Drizzle',61:'Rain',63:'Rain',65:'Rain',66:'Rain',67:'Rain',71:'Snow',73:'Snow',75:'Snow',77:'Snow',80:'Rain',81:'Rain',82:'Rain',85:'Snow',86:'Snow',95:'Thunderstorm',96:'Thunderstorm',99:'Thunderstorm'};

  function paint(tempC, summary){
    const box = document.getElementById('wx'); if (!box) return;
    const icon = ICONS[summary] || '•';
    const t = (typeof tempC === 'number' ? Math.round(tempC) : '--') + '°C';
    const sum = summary || '';
    const tEl = document.getElementById('wxTemp'); if (tEl) tEl.textContent = t;
    const iEl = document.getElementById('wxIcon'); if (iEl) iEl.textContent = icon;
    const sEl = document.getElementById('wxSummary'); if (sEl) sEl.textContent = sum;
    box.hidden = false;
  }

  async function meteo(lat, lon){
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Madrid';
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=${encodeURIComponent(tz)}`;
    const r = await fetch(url, {cache:'no-store'});
    if (!r.ok) throw new Error('Open-Meteo HTTP '+r.status);
    const j = await r.json();
    const curr = j.current || j.current_weather || {};
    const tempC = typeof curr.temperature_2m === 'number' ? curr.temperature_2m :
                  typeof curr.temperature === 'number' ? curr.temperature : null;
    const code  = typeof curr.weather_code === 'number' ? curr.weather_code : null;
    const summary = (code!=null && WMO[code]) ? WMO[code] : 'Clear';
    paint(tempC, summary);
  }

  function geoloc(timeoutMs=10000){
    return new Promise((resolve, reject)=> {
      if (!navigator.geolocation) return reject(new Error('no geolocation'));
      let done = false;
      const to = setTimeout(()=>{ if(!done){ done=true; reject(new Error('timeout')); } }, timeoutMs);
      navigator.geolocation.getCurrentPosition(
        pos => { if(done) return; done=true; clearTimeout(to); resolve({lat:pos.coords.latitude, lon:pos.coords.longitude}); },
        err => { if(done) return; done=true; clearTimeout(to); reject(err); },
        { enableHighAccuracy:false, timeout: timeoutMs, maximumAge: 300000 }
      );
    });
  }

  async function ipFallback(){
    try{
      const r = await fetch('https://ipapi.co/json/', {cache:'no-store'});
      if (!r.ok) throw new Error('ipapi HTTP '+r.status);
      const j = await r.json();
      if (typeof j.latitude === 'number' && typeof j.longitude === 'number'){
        return { lat: j.latitude, lon: j.longitude };
      }
    }catch{}
    return null;
  }

  (async () => {
    try {
      let coords = null;
      try { coords = await geoloc(10000); } catch {}
      if (!coords) coords = await ipFallback();
      if (!coords) return; // usa weather.json del servidor
      await meteo(coords.lat, coords.lon);
    } catch {}
  })();
})();
