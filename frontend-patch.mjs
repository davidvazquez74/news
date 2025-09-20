
/**
 * frontend-patch.mjs
 * 
 * Runtime utilities you can import without touching CSS/HTML layout:
 * - sanitizeLatestForRender(data): applies the same impact fix in-memory.
 * - computeVersionA11y(meta): keeps meta.version AS-IS on screen, but adds
 *   better accessibility/tooltip (no visual change), leveraging updated_at/commit.
 */

import { normalizeLatest } from "./normalizer.mjs";

export function sanitizeLatestForRender(data) {
  // Clone to avoid mutating original if you reuse it elsewhere
  const cloned = JSON.parse(JSON.stringify(data));
  return normalizeLatest(cloned);
}

/**
 * Attach better semantics to your existing version DOM node WITHOUT changing
 * what is visibly rendered.
 * 
 * Usage:
 *   const meta = { updated_at, version, commit };
 *   const node = document.querySelector('#version'); // your existing node
 *   computeVersionA11y(meta, node);
 */
export function computeVersionA11y(meta, node) {
  if (!node || !meta) return;
  // Preserve visible text EXACTLY as your app already sets it.
  // Only improve accessibility + tooltip.
  try {
    const dt = meta.updated_at ? new Date(meta.updated_at) : null;
    const local = dt ? dt.toLocaleString() : "";
    const commit = meta.commit || "";
    const title = [
      local ? `Actualizado (local): ${local}` : null,
      commit ? `Commit: ${commit}` : null,
      meta.version ? `Versión: ${meta.version}` : null
    ].filter(Boolean).join(" • ");
    node.setAttribute("title", title);
    node.setAttribute("aria-label", title);
    // Data attributes for debugging (not visible)
    if (local) node.dataset.updatedLocal = local;
    if (commit) node.dataset.commit = commit;
  } catch {}
}
