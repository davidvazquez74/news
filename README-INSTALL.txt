# NotiBuddy - Paquete de Producción (mínimo)

Contenido:
- `scripts/build_latest.js`: normaliza `data/latest.json` y lo copia a la raíz como `latest.json`.
- `.github/workflows/update-news.yml`: ejecuta el build cada hora y en dispatch manual.
- `main.js`: cliente de producción que:
  - lee `/data/latest.json` y si no existe, `/latest.json`
  - no limita a 3 noticias
  - usa `blocksOut` como fallback
  - soporta pills y toggle Teen
  - inicializa el tiempo vía `WeatherClient.init('#weather')` (si existe)

Integración rápida:
1. **Copia** `scripts/build_latest.js` dentro de tu repo (mismo path).
2. **Copia** `.github/workflows/update-news.yml` (ajusta nombre si ya tienes uno).
3. **Sustituye** tu `main.js` por el incluido (o integra sólo lo necesario).
4. Haz commit y push. El workflow rellenará `data/latest.json` (si falta), lo normalizará y publicará también `latest.json` en raíz.
