// weather_client.js — Hotfix robusto (DOM nuevo y antiguo, sin claves, con fallbacks)
(function () {
  const WEATHER_EL = document.getElementById('weather');
  if (!WEATHER_EL) return; // no hay contenedor, salimos

  // Tiempo de espera para geolocalización
  const GEO_TIMEOUT_MS = 5000;

  // Barcelona por defecto (fallback)
  const DEFAULT_COORDS = { lat: 41.3874, lon: 2.1686, label: 'Barcelona' };

  // Util: formateo de fecha corta (YYYY-MM-DD)
  const todayISO = () => new Date().toISOString().split('T')[0];

  // Persistencia en localStorage
  const getSavedCoords = () => {
    try {
      const raw = localStorage.getItem('nb.weather.coords');
      if (!raw) return null;
      const obj = JSON.parse(raw);
      if (typeof obj?.lat === 'number' && typeof obj?.lon === 'number') return obj;
      return null;
    } catch {
      return null;
    }
  };
  const setSavedCoords = (coords) => {
    try { localStorage.setItem('nb.weather.coords', JSON.stringify(coords)); } catch {}
  };

  // Geolocalización (promesa con timeout)
  const getGeoPosition = () =>
    new Promise((resolve) => {
      if (!('geolocation' in navigator)) return resolve(null);
      let settled = false;
      const timer = setTimeout(() => {
        if (!settled) { settled = true; resolve(null); }
      }, GEO_TIMEOUT_MS);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (settled) return;
          clearTimeout(timer);
          settled = true;
          const { latitude, longitude } = pos.coords || {};
          if (typeof latitude === 'number' && typeof longitude === 'number') {
            resolve({ lat: latitude, lon: longitude, label: 'Tu ubicación' });
          } else {
            resolve(null);
          }
        },
        () => {
          if (settled) return;
          clearTimeout(timer);
          settled = true;
          resolve(null);
        },
        { enableHighAccuracy: false, timeout: GEO_TIMEOUT_MS, maximumAge: 10 * 60 * 1000 }
      );
    });

  // Fetch a Open-Meteo (CORS OK, sin API key)
  async function fetchWeather({ lat, lon }) {
    const params = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lon),
      current: 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code',
      daily: 'temperature_2m_max,temperature_2m_min',
      timezone: 'auto',
      start_date: todayISO(),
      end_date: todayISO()
    });
    const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  // Mapas simples para código de tiempo -> texto
  const WMO_TEXT = {
    0: 'Despejado', 1: 'Principalmente despejado', 2: 'Parcialmente nublado', 3: 'Nublado',
    45: 'Niebla', 48: 'Niebla escarchada',
    51: 'Llovizna ligera', 53: 'Llovizna', 55: 'Llovizna intensa',
    61: 'Lluvia débil', 63: 'Lluvia', 65: 'Lluvia fuerte',
    71: 'Nieve débil', 73: 'Nieve', 75: 'Nieve intensa',
    80: 'Chubascos débiles', 81: 'Chubascos', 82: 'Chubascos fuertes',
    95: 'Tormenta', 96: 'Tormenta con granizo', 99: 'Tormenta fuerte con granizo'
  };

  // Render — Soporta DOM nuevo (#weather) y antiguo (#w-temp, etc.)
  function renderWeather(data, label) {
    const cur = data?.current;
    const daily = data?.daily;
    const t = Math.round(cur?.temperature_2m ?? NaN);
    const hi = Math.round(daily?.temperature_2m_max?.[0] ?? NaN);
    const lo = Math.round(daily?.temperature_2m_min?.[0] ?? NaN);
    const code = cur?.weather_code;
    const desc = WMO_TEXT[code] || '—';
    const updated = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // 1) Layout antiguo (si existe)
    const wTemp = document.getElementById('w-temp');
    const wSummary = document.getElementById('w-summary');
    const wLoc = document.getElementById('w-location');
    const wHi = document.getElementById('w-hi');
    const wLo = document.getElementById('w-lo');
    const wUpd = document.getElementById('w-updated');

    if (wTemp || wSummary || wLoc || wHi || wLo || wUpd) {
      if (wTemp) wTemp.textContent = isFinite(t) ? `${t}°C` : '—°C';
      if (wSummary) wSummary.textContent = desc;
      if (wLoc) wLoc.textContent = label || '';
      if (wHi) wHi.textContent = isFinite(hi) ? `↑${hi}°` : '↑—°';
      if (wLo) wLo.textContent = isFinite(lo) ? `↓${lo}°` : '↓—°';
      if (wUpd) wUpd.textContent = `Actualizado: ${updated}`;
      return;
    }

    // 2) Layout nuevo — sustituimos el contenido del #weather (limpio y compacto)
    WEATHER_EL.innerHTML = `
      <div class="nb-weather-compact">
        <div class="nb-weather-row">
          <div class="nb-weather-main">
            <div class="nb-weather-temp">${isFinite(t) ? `${t}°C` : '—°C'}</div>
            <div class="nb-weather-desc">${desc}</div>
          </div>
          <div class="nb-weather-side">
            <div class="nb-weather-hi">↑ ${isFinite(hi) ? `${hi}°` : '—°'}</div>
            <div class="nb-weather-lo">↓ ${isFinite(lo) ? `${lo}°` : '—°'}</div>
          </div>
        </div>
        <div class="nb-weather-meta">
          <span>${label || ''}</span>
          <span>·</span>
          <span>Actualizado ${updated}</span>
        </div>
      </div>
    `;
  }

  function renderLoading(text) {
    if (!WEATHER_EL) return;
    WEATHER_EL.innerHTML = `<div class="nb-weather-loading">${text || 'Cargando el tiempo…'}</div>`;
  }

  function renderError() {
    renderLoading('No se pudo cargar el tiempo');
  }

  // Flujo principal
  (async function init() {
    try {
      renderLoading('Cargando el tiempo…');
      // 1) Intentar coords guardadas
      let coords = getSavedCoords();
      let label = coords?.label;

      // 2) Intentar geolocalizar si no había guardadas
      if (!coords) {
        const geo = await getGeoPosition();
        if (geo) { coords = geo; label = geo.label; setSavedCoords(geo); }
      }

      // 3) Fallback a defecto si seguimos sin coords
      if (!coords) { coords = DEFAULT_COORDS; label = DEFAULT_COORDS.label; }

      const data = await fetchWeather({ lat: coords.lat, lon: coords.lon });
      renderWeather(data, label);
    } catch (e) {
      console.error('[weather] error:', e);
      renderError();
    }
  })();
})();
