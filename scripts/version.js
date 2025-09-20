
// scripts/version.js
// Pinta version y updated_at en un span#footer-version si existe.

export function renderVersion(meta) {
  const el = document.getElementById("footer-version");
  if (!el || !meta) return;
  const updated = meta.updated_at ? new Date(meta.updated_at) : null;
  const when = updated ? updated.toLocaleString() : "";
  el.textContent = meta.version ? `${meta.version} — ${when}` : when;
}
