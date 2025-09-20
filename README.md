
# Tech-only patch (sin cambios de estilo/maquetación)

Este paquete incluye **solo cambios técnicos**, sin tocar el formato visual, estilos ni el look&feel.

## Qué corrige

1. **Adiós al texto repetido** “Sin efecto directo en tu día a día”  
   - Se elimina en ingestión o en runtime **sin cambiar el diseño**.
   - Si la tarjeta queda sin mensaje y el `tag` lo permite, se rellena con un texto más útil y consistente (determinista).

2. **Versión más clara _técnicamente_ sin cambiar lo que se ve**  
   - Mantienes el mismo contenido visible en la UI.
   - Añadimos `title` y `aria-label` al elemento de versión con: hora local de `updated_at`, `commit` y `version`.
   - Resultado: mejor accesibilidad/tooltip y depuración, **sin cambios de estilos**.

---

## Uso en **build/ingestión** (recomendado)

1. Copia `normalizer.mjs` a tu repo (por ejemplo en `scripts/`).
2. En tu pipeline de fetch/cron (donde generas `latest.json`), añade:

```js
// scripts/build-latest.mjs (ejemplo)
import fs from 'node:fs/promises';
import { normalizeLatest } from './normalizer.mjs';

const raw = JSON.parse(await fs.readFile('latest.json', 'utf8'));
const cleaned = normalizeLatest(raw);
await fs.writeFile('latest.json', JSON.stringify(cleaned, null, 2), 'utf8');
```

> También puedes ejecutarlo como CLI:
>
> ```bash
> node -e "import('./scripts/normalizer.mjs').then(m=>m.cli(process.argv))" -- --in latest.json --out latest.json
> ```

---

## Uso en **runtime** (si no puedes tocar el build)

1. Copia `frontend-patch.mjs` y `normalizer.mjs` a tu carpeta pública o de módulos.
2. Justo después de hacer el `fetch('latest.json')`, aplica:

```js
import { sanitizeLatestForRender, computeVersionA11y } from './frontend-patch.mjs';

const res = await fetch('latest.json', { cache: 'no-store' });
const data = await res.json();

// 1) Arreglo técnico de impactos (in-memory, sin afectar estilos)
const sane = sanitizeLatestForRender(data);

// 2) Mejorar accesibilidad de la versión SIN cambiar lo que se ve
const versionNode = document.querySelector('#version'); // usa tu selector real
computeVersionA11y(sane, versionNode);

// 3) Renderiza con `sane` como siempre (tu UI no cambia)
renderApp(sane);
```

---

## Política de cambios

- No modifica claves, orden ni estructura del JSON.
- No añade estilos, ni clases nuevas que alteren el CSS.
- No cambia el texto visible de la versión (solo `title`/`aria-label`).

Cualquier duda, dime dónde engancharlo en tu repo (ruta del `fetch` y selector del nodo de versión) y te dejo el diff exacto.
