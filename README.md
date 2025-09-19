# News – Impact Engine Bundle (JS)
Archivos listos para usar:
- scripts/impactConstants.js
- scripts/impactEngine.js
- scripts/build_latest.js  ← ya integrado con el motor (no deja impactos vacíos)

Cómo usar:
1) Copia la carpeta `scripts/` y `data/` sobre tu repo (respeta rutas).
2) Asegura en tu workflow Node 20 y dependencia `rss-parser`.
3) Ejecuta el workflow (manual o por CRON). Se generarán:
   - data/latest.json  (con impact, impact_adult, impact_teen)
   - data/meta.json    (versión de build)
