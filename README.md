
# NotiBuddy – Fix técnico (plug & play)

Solo cambios **técnicos**. No se alteran estilos ni el look&feel.

## Instalación
1. Copia la carpeta `scripts/` (y opcionalmente `data/`) en tu repo.
2. En tu HTML principal, antes de `</body>` añade:
```html
<script type="module" src="./scripts/boot.js"></script>
```
3. Asegura estos anclajes en el DOM (o cambia los IDs en código):
```html
<div id="app"></div>
<button id="btn-teens"></button>
<div id="weather-box"></div>
<span id="footer-version"></span>
```
4. Si tu `latest.json` está en otra ruta, usa `?feed=`:
```
https://…/index.html?feed=https://ruta/correcta/latest.json
```

## Arreglos incluidos
- Resolución robusta de `latest.json` (querystring → ./data/latest.json → /latest.json → ./latest.json) con `cache:'no-store'` y **cache-buster**.
- Renderiza **todas** las noticias (sin límites escondidos).
- **Botón Teens** persistente (LocalStorage). Alterna entre `impact`, `impact_adult` y `impact_teen`.
- **Tiempo** con `iframe` y **reintento** automático si falla la primera carga.
- **Footer** muestra `version` + `updated_at` en hora local.
- Los scripts **no tocan clases** ni estilos de tus componentes.

## API mínima
- `initNotiBuddy({ feedUrl })` — opcional. Auto-inicia si existe `#app`.

## Troubleshooting
- Solo ves 3 noticias → revisa que tus filtros/plantillas no limiten el array. Este paquete no corta nada.
- `latest.json` distinto en app vs repo → confirma la **ruta efectiva** con `?feed=URL-raw-de-github` o despliegue CDN.
- `btn-teens` no aparece → añade el botón al HTML. El script no añade estilos ni posición.
