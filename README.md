
# News – Impact Engine Lite (JS)

Este paquete añade un motor de impactos **lite** (sin LLM, sin TypeScript) e integra su uso en `scripts/build_latest.js`.

## Estructura
```
/scripts
  impactConstants.js
  impactEngine.js
  build_latest.js   ← usa el motor lite
/data
  sources.json      ← (pon aquí tus fuentes)
package.json        ← "type":"module", depende de rss-parser
```

## Uso local
1) `npm i`
2) `node scripts/build_latest.js`

Se generarán:
- `data/latest.json` (con impact_adult / impact_teen rellenados)
- `data/meta.json` (con versión/commit si los pasas por env)

## Integración con GitHub Actions
No necesitas cambiar tu workflow si ya ejecuta `node scripts/build_latest.js`.
