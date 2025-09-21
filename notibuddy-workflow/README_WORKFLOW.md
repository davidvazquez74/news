# NotiBuddy Workflow

Este workflow (`.github/workflows/update-news.yml`) actualiza automáticamente el archivo `data/latest.json`.

## Funcionalidad
- Corre cada 30 minutos (06:00–22:59 UTC).
- Puede ejecutarse manualmente desde la pestaña **Actions**.
- Instala dependencias solo si existe `package.json`.
- Ejecuta `scripts/build_latest.js`.
- Verifica que `data/latest.json` exista.
- Si cambió, lo commitea y lo pushea al repo.

## Pasos para usarlo
1. Copiar la carpeta `.github/workflows` al repo.
2. Confirmar que `scripts/build_latest.js` genera `data/latest.json`.
3. Ejecutar manualmente desde GitHub Actions o esperar al cron.
