# UTF-8 Hotfix (seguro y reversible)

Este paquete añade un **post-procesado** y un **guardarraíl** para evitar acentos rotos/emojis raros en `data/latest.json` **sin tocar tu `build_latest.js`**.

## Qué incluye
- `scripts/postbuild-sanitize.js`: repara mojibake típico (Â, Ã, â€œ, ï¸, ðŸ…) recorriendo todo el JSON.
- `scripts/check-mojibake.js`: aborta el workflow si aún quedara mojibake tras el saneado.
- `.github/workflows/update-news.yml`: mismo workflow con 2 pasos nuevos (sanitize + guardarraíl).
- `_headers`: fuerza `charset=utf-8` para `/data/*` en Netlify.

## Cómo usar
1. Copia el contenido del ZIP en la raíz del repo (manteniendo rutas).
2. Haz commit y push, o usa el ZIP desde el UI de GitHub.
3. Lanza el workflow **Update latest.json (news)** manualmente (Actions → run workflow).
4. Comprueba `https://TU-SITIO/data/latest.json` y que los acentos/emojis salgan bien.

## Rollback
Elimina los 2 scripts, restaura el workflow anterior y haz revert del commit.
