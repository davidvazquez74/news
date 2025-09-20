
/**
 * normalizer.mjs
 * 
 * Drop-in build/ingest helper to sanitize `latest.json` BEFORE serving it.
 * - Removes the boilerplate "Sin efecto directo en tu día a día" impacts
 * - Optionally fills empty impacts from a deterministic map by tag/severity/horizon
 *   (keeps your current content if it's meaningful)
 * - Leaves structure, field names and visual/UI untouched.
 */

const DEFAULT_NEUTRAL_RE = /^s[ií]n efecto directo en tu d[ií]a a d[ií]a\.?$/i;

const DEFAULT_IMPACT_BY_TAG = {
  energia: {
    any: "Vigila precios y consumo estos días."
  },
  deporte: {
    hoy: "Prevé cortes y aglomeraciones en horas de partido."
  },
  salud_publica: {
    any: "Sigue indicaciones oficiales y revisa calendario de vacunas."
  },
  impuestos: {
    any: "Podrían variar pagos o ayudas; revisa plazos y requisitos."
  }
};

/**
 * Normalize impact fields for one item.
 */
export function normalizeImpacts(item) {
  const fields = ["impact", "impact_adult", "impact_teen"];
  // 1) Blank out the boilerplate "Sin efecto..." but DO NOT touch styles/UI
  for (const f of fields) {
    const v = (item[f] ?? "").toString().trim();
    if (v && DEFAULT_NEUTRAL_RE.test(v)) {
      item[f] = ""; // empty means "no badge/message" at render time
    }
  }

  // 2) If impacts remain empty, try to fill with deterministic helper by tag/horizon
  const tag = (item.tag || "").toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
  const horizon = (item.horizon || "").toLowerCase();
  const map = DEFAULT_IMPACT_BY_TAG[tag];
  if (map) {
    const suggestion = map[horizon] || map.any;
    if (suggestion) {
      for (const f of fields) {
        const v = (item[f] ?? "").toString().trim();
        if (!v) item[f] = suggestion;
      }
    }
  }
  return item;
}

/**
 * Normalize the whole latest.json payload (mutates the object).
 * - Only touches the impact* fields (and only when necessary).
 * - Does NOT alter styles, keys, or list ordering.
 */
export function normalizeLatest(payload) {
  const buckets = ["cataluna", "espana", "rioja", "background", "deportes", "radios"];
  for (const b of buckets) {
    const arr = Array.isArray(payload[b]) ? payload[b] : [];
    for (const item of arr) normalizeImpacts(item);
  }
  // blocksOut mirrors the same structure
  if (payload.blocksOut && typeof payload.blocksOut === "object") {
    for (const region of Object.keys(payload.blocksOut)) {
      const lists = payload.blocksOut[region];
      if (!lists) continue;
      for (const key of Object.keys(lists)) {
        const arr = Array.isArray(lists[key]) ? lists[key] : [];
        for (const item of arr) normalizeImpacts(item);
      }
    }
  }
  return payload;
}

/**
 * Optional CLI usage:
 *   node -e "import('./normalizer.mjs').then(m=>m.cli(process.argv))" -- in=latest.json --out=latest.cleaned.json
 */
export async function cli(argv) {
  const args = Object.fromEntries(
    (argv || []).map((a, i) => (a.startsWith("--") ? [a.slice(2), argv[i + 1]] : null)).filter(Boolean)
  );
  const input = args.in;
  const output = args.out || "latest.cleaned.json";
  if (!input) {
    console.error("Usage: --in <latest.json> [--out <file>]");
    process.exit(1);
  }
  const fs = await import('node:fs/promises');
  const raw = await fs.readFile(input, "utf8");
  const data = JSON.parse(raw);
  normalizeLatest(data);
  await fs.writeFile(output, JSON.stringify(data, null, 2), "utf8");
  console.log(`Wrote ${output}`);
}
