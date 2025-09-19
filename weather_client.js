// weather_client.js — geolocalización + Open-Meteo con textos en español
(() => {
  // Map de códigos WMO -> texto ES + clave de icono
  const WMO_ES = {
    0:  { summary: 'Soleado',     iconKey: 'Soleado' },
    1:  { summary: 'Despejado',   iconKey: 'Despejado' },
    2:  { summary: 'Nubes',       iconKey: 'Nubes' },
    3:  { summary: 'Nubes',       iconKey: 'Nubes' },
    45: { summary: 'Niebla',      iconKey: 'Niebla' },
    48: { summary: 'Niebla',      iconKey: 'Niebla' },
    51: { summary: 'Llovizna',    iconKey: 'Llovizna' },
    53: { summary: 'Llovizna',    iconKey: 'Llovizna' },
    55: { summary: 'Llovizna',    iconKey: 'Llovizna' },
    61: { summary: 'Lluvia',      iconKey: 'Lluvia' },
    63: { summary: 'Lluvia',      iconKey: 'Lluvia' },
    65: { summary: 'Lluvia',      iconKey: 'Lluvia' },
    66: { summary: 'Lluvia',      iconKey: 'Lluvia' },
    67: { summary: 'Lluvia',      iconKey: 'Lluvia' },
    71: { summary: 'Nieve',       iconKey: 'Nieve' },
    73: { summary: 'Nieve',       iconKey: 'Nieve' },
    75: { summary: 'Nieve',       iconKey: 'Nieve' },
    77: { summary: 'Nieve',       iconKey: 'Nieve' },
    80: { summary: 'Lluvia',      iconKey: 'Lluvia' },
    81: { summary: 'Lluvia',      iconKey: 'Lluvia' },
    82: { summary: 'Lluvia',      iconKey: 'Lluvia' },
    85: { summary: 'Nieve',       iconKey: 'Nieve' },
    86: { summary: 'Nieve',       iconKey: 'Nieve' },
    95: { summary: 'Tormenta',    iconKey: 'Tormenta' },
    96: { summary: 'Tormenta',    iconKey: 'Tormenta' },
    99: { summary: 'Tormenta',    iconKey: 'Tormenta' }
  };

  // Iconos por clave ES
  const ICONS = {
    'Soleado':    '☀️',
    'Despejado':  '☀️',
    'Nubes':      '☁️',
    'Lluvia':     '🌧️',
    'Llovizna':   '🌦️',
    'Tormenta':   '⛈️',
    'Nieve':      '❄️',
    'Niebla':     '🌫️',
    'Calima':     '🌫️'
  };

  function paint(tempC, summaryES, iconKey){
    const box = document.getElementById('wx'); if (!box) return;
    const t = (typeof tempC === 'number' ? Math.round(tempC) : '--') + '°C';
    const icon = ICONS[iconKey] || '•';
    const tEl = document.getElementById('wxTemp'); if (tEl) tEl.textContent = t;
    const iEl = document.getElementById('wxIcon'); if (iEl) iEl.textContent = icon;
    const sEl = document.getElementById('wxSummary'); if (sEl) sEl.textContent = summaryES || '';
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
    const map   = (code!=null && WMO_ES[code]) ? WMO_ES[code] : { summary:'Despejado', iconKey:'Despejado' };
    paint(tempC, map.summary, map.iconKey);
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
      if (!coords) return;
      await meteo(coords.lat, coords.lon);
    } catch {}
  })();
})();
