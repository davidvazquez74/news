
// scripts/weather.js
// Monta/reintenta el widget del tiempo sin tocar estilos.
// Espera un contenedor con id="weather-box". Opcionalmente acepta un iframe ya presente.

export function mountWeather({ src, maxRetries = 2, retryDelay = 1200 } = {}) {
  const box = document.getElementById("weather-box");
  if (!box) return;
  const existing = box.querySelector("iframe") || box.querySelector("div[data-weather]");
  if (existing) return; // ya está montado por tu HTML

  let tries = 0;
  function addIframe() {
    tries += 1;
    const iframe = document.createElement("iframe");
    iframe.setAttribute("title", "Tiempo");
    iframe.setAttribute("loading", "lazy");
    iframe.style.width = "100%";
    iframe.style.border = "0";
    iframe.src = src || "https://embed.windy.com/embed2.html?lat=41.39&lon=2.17&zoom=5";
    iframe.addEventListener("error", () => {
      if (tries <= maxRetries) setTimeout(addIframe, retryDelay);
    });
    box.innerHTML = ""; // no tocamos clases, solo contenido
    box.appendChild(iframe);
  }
  addIframe();
}
