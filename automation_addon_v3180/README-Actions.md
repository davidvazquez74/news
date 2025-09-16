
# Automatización de noticias (v3.18.0-lite)

## ¿Qué hace?
- Cada 3 horas (o cuando ejecutes manualmente), descarga titulares desde RSS configurados en `data/sources.json`.
- Genera `data/latest.json` con los últimos 2 días y lo commitea a `main`.
- Netlify detecta el cambio y redeploya solo.

## Archivos que debes copiar a tu repo
- `.github/workflows/update-news.yml`
- `package.json`
- `scripts/build_latest.js`
- `data/sources.json` (edítalo a tu gusto; son solo ejemplos)

## Cómo activarlo
1) Copia estos archivos a la **raíz** de tu repo (mantén las rutas).
2) En GitHub → pestaña **Actions** → habilita los workflows si te lo pide.
3) Pulsa **"Run workflow"** para probar. En 1-2 min se actualizará `data/latest.json`.

## Cambiar fuentes
Edita `data/sources.json` y pon tus RSS preferidos por sección.
