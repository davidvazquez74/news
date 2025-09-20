
# Plug & Play fixer (v3)

## Qué hace
- Clasifica cada noticia por `tag` usando palabras clave robustas (transporte, clima, salud_publica, educación, redes_tech, deporte, cultura, impuestos, trabajo, seguridad, institucional, lengua).
- Genera `impact`, `impact_adult` y `impact_teen` **siempre** (sin "Sin efecto directo...").
- Ajusta `severity`, `horizon`, `action` por categoría.
- Arregla textos teen rotos tipo `A     , .` y rellena `source` desde la URL si viene vacío.
- No toca `title`, `url`, `summary`.

## Uso
1. Coloca la carpeta `scripts/` en la raíz de tu repo.
2. Tras construir `data/latest.json`, ejecuta:
   ```bash
   node scripts/run_fix.js
   ```
3. (Opcional) Audita:
   ```bash
   node scripts/audit_latest.js
   ```

## CI (GitHub Actions)
Añade este paso después de generar `latest.json`:
```yaml
- name: Enhance impacts (no neutrals)
  run: node scripts/run_fix.js
- name: Audit (optional)
  run: node scripts/audit_latest.js
```
