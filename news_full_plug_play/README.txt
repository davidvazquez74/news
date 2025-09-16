# News – Full Plug & Play (UI + GHA)

## Contenido
- Frontend:
  - index.html
  - assets/style.css
  - assets/app.js
  - manifest.webmanifest
  - icons/icon-192.png, icons/icon-512.png
- Backend:
  - scripts/build_latest.js (RSS global/ES + Cataluña, con summary + why_it_matters)
  - data/latest.json (semilla)
  - .github/workflows/fetch_news.yml (cron 3h + manual, Node 20, sin npm)

## Despliegue
1) Copia TODO a la **raíz** de tu repo/site (sobrescribe).
2) Commit + push a `main`.
3) GitHub → Actions → **Fetch latest news** → Run workflow.
4) Netlify redeploya (si está conectado) o usa un build hook (ver YAML).
5) Abre `/data/latest.json?t=NOW` y comprueba que hay `summary` y `why_it_matters`.
