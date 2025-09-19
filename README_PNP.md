
# Plug & Play — Impact Enhancer

**Qué es**  
Este paquete añade un post-procesado que garantiza que *ninguna* noticia quede con:
- `impact: "Sin efecto directo en tu día a día."` por defecto
- Teens vacíos o corrompidos tipo `A     , . 🙂`

**Cómo usar (rápido, local)**  
1) Copia la carpeta `scripts/` de este ZIP en la raíz de tu repo (manteniendo `scripts/`).
2) Ejecuta:
```bash
node scripts/run_fix.js
```
Esto reescribe `data/latest.json` con impactos completos.

**Cómo dejarlo automático (GitHub Actions)**  
- Si puedes subir archivos ocultos, copia `.github/workflows/update-news.yml` que viene aquí y listo.
- Si prefieres editar a mano, añade este paso después de construir `latest.json`:
```yaml
- name: Enhance impacts (no neutrals)
  run: node scripts/run_fix.js
```

**Qué cambia**  
- `scripts/impact_rules_v2.js`: motor de reglas ampliado (transporte, clima, impuestos, educación, salud, redes/tech, deportes, cultura, seguridad, geopolítica, institucional, política lingüística, fallback).  
- `scripts/run_fix.js`: aplica el motor a `data/latest.json` y asegura teen/adult no vacíos + añade campos `tag`, `severity`, `horizon`, `action`.

**Seguro contra pantallas en blanco**  
No toca tu UI ni tu `build_latest.js`. Solo edita el JSON *después* de generarlo.
