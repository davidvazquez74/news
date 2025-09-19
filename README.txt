NEWS APP (integrado) — 2025-09-19T22:11:49.954180+00:00
1) Copia todo al repo (mantén estructura de carpetas).
2) Ejecuta el workflow “Update latest.json (news)” desde GitHub Actions.
3) El front leerá /data/meta.json para bust de versión y /data/latest.json para noticias.
4) Impacts: nunca vacíos (hay neutral por defecto); reglas ampliadas en scripts/build_latest.js.
5) Weather: lee /data/weather.json si existe (opcional).