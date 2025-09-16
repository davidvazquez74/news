# News – GitHub Actions updater

Este paquete añade un workflow de GitHub Actions que regenera `data/latest.json` cada 3 horas (y también bajo demanda) y hace push al repo para que Netlify redeploye.

## Estructura
- `.github/workflows/fetch_news.yml` – workflow (cron cada 3h + manual)
- `scripts/build_latest.js` – script Node que lee RSS públicos y genera `data/latest.json`
- `data/latest.json` – archivo de salida (versionado)

## Despliegue (rápido)
1) Sube todo el contenido de este ZIP a la **raíz** de tu repo (sobrescribe si pregunta).
2) Haz commit y push a `main`.
3) En GitHub → pestaña **Actions** → selecciona **Fetch latest news** → **Run workflow** para probar ahora.
4) Verifica en Netlify que se redeploya y que `https://TU-SITIO.netlify.app/data/latest.json` devuelve JSON.

## Editar fuentes
Modifica el array `FEEDS` dentro de `scripts/build_latest.js` para cambiar o añadir fuentes RSS.
