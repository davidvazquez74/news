# News Impact Patch — vFinal (plug & play)

Este paquete añade **3 arreglos críticos** sin tocar tu front:
1) **Charset & emojis** (no más `Ã±` ni textos truncados).
2) **Impactos garantizados (adult + teen)** — sin “Sin efecto directo…”.
3) **Secciones nunca vacías** (fallback seguro) + guard de UI recomendado.

## Cómo usar (2 pasos)

**Paso A — Copiar carpeta `scripts/` (y opcional workflow)**
1. Copia **`scripts/`** completa a la raíz de tu repo (mantén rutas).
2. Si quieres automatizar en GitHub Actions, copia **`.github/workflows/update-news.yml.sample`** a
   `.github/workflows/update-news.yml` (si ya tienes un workflow, solo añade el paso `Enhance impacts`).

**Paso B — Ejecutar postbuild (local o en CI)**
Después de generar `data/latest.json`:
```bash
node scripts/run_fix.js
```
En GitHub Actions, añade:
```yaml
- name: Enhance impacts (no neutrals)
  run: node scripts/run_fix.js
```

> **Garantía:** si un ítem viene sin impacto o con el neutro, se rellena con reglas maduras (adult + teen) y se conservan acentos/emojis. Además, si una sección (p.ej. `espana`) queda vacía, se rellena con fallback para no romper la UI.

---

## Qué incluye

- `scripts/utils/fetchWithCharset.js` — descarga RSS/XML respetando charset (`UTF-8`, `latin1`, etc.).
- `scripts/utils/text.js` — `cleanText()` sin romper acentos ni emojis.
- `scripts/rules/impactRulesPatch.js` — reglas ampliadas (defensa/OTAN, realeza/protocolo, agenda política, cultura genérica, etc.) + tono teen con slang y emojis (controlado).
- `scripts/run_fix.js` — post-procesa `data/latest.json`: aplica reglas, conserva emojis, añade fallbacks de sección y escribe en UTF-8.

Opcional:
- `.github/workflows/update-news.yml.sample` — workflow completo con paso de “Enhance impacts”.

---

## Guard recomendado en el front (por si acaso)
Asegura que nunca veas pantalla en blanco si no llega nada por red:

```jsx
const buckets = ['cataluna','espana','rioja','background','deportes','radios'];
const hasAny = buckets.some(k => Array.isArray(data?.[k]) && data[k].length > 0);
if (!hasAny) return <EmptyState msg="Sin datos por el momento. Reintenta en unos minutos." />;
```

---

## Notas técnicas
- Todos los `writeFileSync` usan `'utf8'` y los textos pasan por `cleanText()` (NFC).
- **NO** se eliminan caracteres no-ASCII: los emojis y acentos se preservan.
- El tono teen usa un set acotado (bro, cringe, literal, full, cero vibes…) y **máx 2 emojis** por ítem.
