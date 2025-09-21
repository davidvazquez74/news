DROP-IN PATCH PACK — Noticias (GitHub → Netlify)

Cómo usar (3 pasos):
1) Copia todo el contenido de este ZIP en la **raíz** de tu repositorio (acepta reemplazar archivos existentes con el mismo nombre).
2) Haz commit y push. Tu workflow debe ejecutar: `node scripts/build_latest.js` y luego `npm run check:latest`.
3) Netlify cogerá estos archivos y aplicará headers anti-caché para `/data/latest.json` y `/latest.json`.

Incluido:
- _headers  → no-cache para JSON
- package.json (Node >=20 y scripts útiles)
- scripts/sources.js  → fuentes limpias
- scripts/build_latest.js → normaliza y rellena latest.json si viene vacío
- scripts/check_latest.js → validador para CI
- data/latest.json (semilla mínima para que la UI no quede vacía)

Notas:
- Si ya tienes `package.json` con otros scripts, fusiona a mano los campos `engines` y `scripts`.
- Si tu app tiene Service Worker, excluye `/data/latest.json` y `/latest.json` del precache.
- Verifica en producción en la consola de red que `/data/latest.json` responde 200 y no se cachea.