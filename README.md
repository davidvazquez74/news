# Impact Engine vTeen 2.0 (plug-and-play)

Este paquete actualiza el motor de impactos (adulto + teen) sin LLM, con reglas ampliadas
y estilo teen más natural (emojis y slang ligero). También respeta tu `sources.json`,
genera `latest.json`/`meta.json`, y no deja impactos vacíos.

## Cómo instalar (tu repo)
1) Copia **scripts/build_latest.js** (y *opcionalmente* scripts/fetch_weather.js) a tu repo en `scripts/`.
2) No toques nada más. El **workflow** existente (`.github/workflows/update-news.yml`) ya lo invoca.
3) Haz commit y deja que el workflow lo ejecute (manual o cada hora).

## Notas
- No requiere TS ni API externa. Solo **rss-parser**.
- Si una noticia no encaja en ninguna regla, devuelve impactos neutros: 
  - Adult: `Sin efecto directo en tu día a día.` 
  - Teen:  `A ti no te cambia nada, bro. 🙂`
- El teen usa expresiones tipo: *bro, chill, full, cringe*, con moderación.
- Claves de normalización: `impact_adult`, `impact_teen` y `impact` (adult) siempre presentes (nunca vacíos).
- Mantiene tu consenso por fuentes, dedupe por título/URL y fallback a último `latest.json` si un bloque queda vacío.

## Quick test local (opcional)
node scripts/build_latest.js

