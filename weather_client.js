// weather_client.js con fallback
const W_FALLBACK = { name: "Molins de Rei", lat: 41.411, lon: 2.016 };
const W_API = (lat, lon) =>
  `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min&timezone=auto`;

const els = { card: document.querySelector("#weather") };

function setWeatherLoading(msg = "Cargando el tiempo…") {
  els.card.innerHTML = `<div class="nb-weather-card"><div class="nb-weather-loading">${msg}</div></div>`;
}

function renderWeather({ name, current, hi, lo, updated }) {
  els.card.innerHTML = `<div class="nb-weather-card">
      <div class="nb-weather-left"><div class="temp">${Math.round(current)}°C</div><div class="desc">Soleado</div></div>
      <div class="nb-weather-right"><div class="place">${name}</div><div class="hi-lo">↑${Math.round(hi)}° ↓${Math.round(lo)}°</div></div>
      <div class="updated">Actualizado: ${updated}</div></div>`;
}

async function fetchWeather(lat, lon, placeName) {
  const res = await fetch(W_API(lat, lon));
  if (!res.ok) throw new Error("weather fetch failed");
  const data = await res.json();
  const cw = data.current_weather;
  const hi = data?.daily?.temperature_2m_max?.[0];
  const lo = data?.daily?.temperature_2m_min?.[0];
  renderWeather({
    name: placeName || data.timezone,
    current: cw?.temperature ?? NaN,
    hi, lo,
    updated: new Date(cw?.time || Date.now()).toISOString().replace("T"," ").slice(0,16),
  });
}

function geoWithFallback() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(W_FALLBACK);
    const done = (pos) => resolve({ name:"Tu ubicación", lat:pos.coords.latitude, lon:pos.coords.longitude });
    navigator.geolocation.getCurrentPosition(done, () => resolve(W_FALLBACK), { enableHighAccuracy:true, timeout:5000, maximumAge:60000 });
    setTimeout(() => resolve(W_FALLBACK), 6000);
  });
}

(async function initWeather(){
  try{
    setWeatherLoading();
    const spot = await geoWithFallback();
    await fetchWeather(spot.lat, spot.lon, spot.name);
  }catch(e){ setWeatherLoading("Tiempo no disponible"); console.error(e); }
})();