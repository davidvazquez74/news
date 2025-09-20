
// scripts/audience.js
// Conmutación Adult/Teen sin cambiar estilos.
// Requiere un botón con id="btn-teens" (texto se gestiona aquí).

const KEY = "nb-audience";
export function getAudience() {
  return localStorage.getItem(KEY) || "adult";
}
export function setAudience(a) {
  localStorage.setItem(KEY, a);
  document.dispatchEvent(new CustomEvent("audience:change", { detail: a }));
}
export function mountAudienceToggle() {
  const btn = document.getElementById("btn-teens");
  if (!btn) return; // no rompemos si no existe
  function sync() {
    const a = getAudience();
    // No tocamos clases, solo texto/aria-label
    btn.textContent = a === "teen" ? "Modo Teen ON" : "Modo Teen OFF";
    btn.setAttribute("aria-pressed", a === "teen" ? "true" : "false");
  }
  btn.addEventListener("click", () => {
    const next = getAudience() === "teen" ? "adult" : "teen";
    setAudience(next);
    sync();
  });
  // primer pintado
  sync();
}
export function pickImpact(item) {
  const a = getAudience();
  if (a === "teen" && item.impact_teen) return item.impact_teen;
  if (item.impact_adult) return item.impact_adult;
  return item.impact || "";
}
