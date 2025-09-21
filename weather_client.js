(() => {
  const el = document.getElementById('weather');
  if (!el) return;

  function renderLoading(){
    el.innerHTML = `<div class="nb-weather-card"><div class="nb-weather-loading">Cargando el tiempo…</div></div>`;
  }
  function render(weather){
    el.innerHTML = `
      <div class="nb-weather-card">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div>
            <div style="font-size:32px;font-weight:700;">${Math.round(weather.temp)}°C</div>
            <div style="opacity:.85;">${weather.summary}</div>
          </div>
          <div style="font-size:14px;opacity:.8;text-align:right;">
            <div>Tu ubicación</div>
            <div>↑${Math.round(weather.hi)}° ↓${Math.round(weather.lo)}°</div>
          </div>
        </div>
        <div style="margin-top:6px;font-size:12px;opacity:.65;">Actualizado: ${new Date().toISOString().split('T')[0]} ${new Date().toTimeString().slice(0,5)}</div>
      </div>`;
  }

  renderLoading();
  setTimeout(() => {
    render({ temp: 22, summary:"Soleado", hi:26, lo:20 });
  }, 1000);
})();