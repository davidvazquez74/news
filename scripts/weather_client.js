
const $ = (s)=>document.querySelector(s);
const card = $('#weather');

async function loadWeather() {
  try {
    // Very small demo using geolocation + open-meteo (no key). If blocked, fallback.
    const pos = await new Promise((res, rej)=>navigator.geolocation?
      navigator.geolocation.getCurrentPosition(res, ()=>rej('geolocation denied'), {timeout:5000}):rej('no geo'));
    const lat = pos.coords.latitude.toFixed(3);
    const lon = pos.coords.longitude.toFixed(3);
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,is_day,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=auto`;
    const r = await fetch(url, {cache:'no-store'});
    const j = await r.json();
    const t = Math.round(j.current.temperature_2m);
    const hi = Math.round(j.daily.temperature_2m_max[0]);
    const lo = Math.round(j.daily.temperature_2m_min[0]);
    card.innerHTML = `<div class="nb-card">
      <div style="display:flex;justify-content:space-between;align-items:baseline;gap:12px;">
        <div style="font-size:44px;font-weight:700;">${t}°C</div>
        <div style="text-align:right;color:#9aa2ad">Tu ubicación<br>↑${hi}° ↓${lo}°</div>
      </div>
      <div style="color:#9aa2ad;font-size:12px;margin-top:6px;">Actualizado: ${new Date().toISOString().slice(0,16).replace('T',' ')}</div>
    </div>`;
  } catch (e) {
    // Compact fallback
    card.innerHTML = `<div class="nb-card"><div style="color:#9aa2ad">Tiempo no disponible</div></div>`;
  }
}

document.addEventListener('DOMContentLoaded', loadWeather);
