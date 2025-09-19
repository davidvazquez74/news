# Impact Enhancer (Neutral → Útil) — Plug & Play

Este paquete evita que las noticias se queden en **"Sin efecto directo en tu día a día."** o frases rotas,
generando impactos **Adult** y **Teen** siempre útiles.

## Qué incluye
- `scripts/fix_impacts.js` — Reglas y textos (declaraciones, trámite, agenda, defensa/OTAN, fiscal en trámite…).
- `scripts/run_fix.js` — Aplica el parche a `data/latest.json` **después** de tu build.
- `tests/test_fix_impacts.js` — Tests mínimos (Node puro).
- `sample/sample_latest.json` — Ejemplo de entrada.

## Instalación (repo existente)
1. Descomprime el ZIP **en la raíz** del repo (manteniendo la carpeta `scripts/`).
2. Asegúrate de tener `data/latest.json` tras tu build normal.
3. Ejecuta el parche:
   ```bash
   node scripts/run_fix.js
   ```

## Integración en GitHub Actions
Añade **después** de tu paso de “Build latest.json”:
```yaml
- name: Enhance impacts (no neutrals)
  run: node scripts/run_fix.js
```

## Ejecutar tests locales (opcional, sin dependencias)
```bash
node tests/test_fix_impacts.js
```

## Notas anti-pantalla en blanco
- No toca la UI. Solo modifica los campos `impact`, `impact_adult`, `impact_teen`.
- Tiene salvavidas: longitud mínima y saneo de restos “A , .”
- Si alguna regla no aplica, usa fallback seguro:
  - Adult: “Sin cambios prácticos hoy.”
  - Teen: “Todo chill, nada te afecta 😎”