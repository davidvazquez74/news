// scripts/impactEngine.js
import { TAGS, SEVERITIES, HORIZONS, ACTIONS, pickDefaultByKeywords } from "./impactConstants.js";

export const IMPACT_SYSTEM_PROMPT = `
Eres el “motor de impacto” de una app de noticias en España. Tu única función es transformar una noticia en un impacto práctico para dos audiencias (adulto y adolescente). No repitas el titular ni inventes datos. Devuelve solo JSON válido.

ENTRADA (JSON):
{ 
  "title": "...", 
  "summary": "...", 
  "source": "...", 
  "published_at": "YYYY-MM-DD", 
  "location": "ES|EU|global|Ciudad", 
  "category": "finanzas|economia|negocios|energía|movilidad|vivienda|empleo|impuestos|clima|salud|educacion|eventos|deporte|cultura|seguridad|justicia|internacional|tecnología|medioambiente|transporte|salud_publica|otros" 
}

SALIDA (JSON con este esquema exacto):
{
  "adult_impact": string,
  "teen_impact": string,
  "tag": string,
  "severity": 0|1|2|3,
  "horizon": "hoy|esta semana|este mes|este año|sin plazo",
  "action": "FYI|vigilar|planificar|actuar",
  "rationale": string,
  "confidence": number
}

REGLAS:
1) Si el impacto es difuso ⇒ severity=0, action="FYI", impacto = “Sin efecto directo en tu día a día.”
2) Contexto por defecto: España.
3) Adulto: frase clara, sin alarmismo. Adolescente: útil, ligero, máximo 1 emoji y jerga SOLO si pega.
4) Eventos locales (huelgas, DANAs, conciertos, deportes): resalta movilidad, tiempo o seguridad.
5) Temas sensibles: tono neutro; en teen evita jerga/emojis si desentonan.
6) Cumple límites de longitud y devuelve exclusivamente el JSON final sin comentarios ni Markdown.
7) Nunca copies frases enteras del titular. No inventes datos, fechas ni cifras.
`;

const wc = (s="") => s.trim().split(/\s+/).filter(Boolean).length;
const emojiCount = (s="") => Array.from(s).filter(c=>/[\p{Extended_Pictographic}\u{1F300}-\u{1FAFF}]/u.test(c)).length;
const sanitize = (s="") => String(s||"").replace(/\s+/g," ").trim();
const NEUTRAL = "Sin efecto directo en tu día a día.";

const BANNED = [
  "seguimiento recomendado",
  "pendiente de evolución",
  "podría notarse en facturas o movilidad",
  "apps y servicios pueden cambiar reglas y permisos",
  "servicios con ia pueden mostrar más avisos y controles",
  "servicios con ia pueden mostrar mas avisos y controles"
];

function stripBanned(s="") {
  let out = s.trim();
  for (const b of BANNED) {
    if (out.toLowerCase().includes(b)) out = NEUTRAL;
  }
  return out;
}

function fallbackImpact(text="") {
  const { tag, severity, horizon, action } = pickDefaultByKeywords(text);
  return {
    adult_impact: NEUTRAL,
    teen_impact: NEUTRAL,
    tag, severity, horizon, action,
    rationale: "Fallback por keywords",
    confidence: 0.4
  };
}

async function defaultLLMCall({system, user}) {
  const apiKey = process.env.OPENAI_API_KEY || process.env.OPENAI_KEY || "";
  if (!apiKey) throw new Error("NO_KEY");
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, temperature: 0.2, messages: [{role:"system",content:system},{role:"user",content:user}] })
  });
  if (!resp.ok) { const t = await resp.text().catch(()=>String(resp.status)); throw new Error("LLM_HTTP_"+resp.status+" "+t.slice(0,200)); }
  const data = await resp.json();
  const content = data?.choices?.[0]?.message?.content ?? "{}";
  return content;
}

export async function generateImpact(llmCall, news={}) {
  const input = {
    title: sanitize(news.title||""),
    summary: sanitize(news.summary||""),
    source: sanitize(news.source||""),
    published_at: sanitize(news.published_at||""),
    location: sanitize(news.location||"ES"),
    category: sanitize(news.category||"otros")
  };

  let out = null;
  try {
    const call = llmCall || defaultLLMCall;
    const raw = await call({ system: IMPACT_SYSTEM_PROMPT, user: JSON.stringify(input) });
    const parsed = JSON.parse(raw);

    out = {
      adult_impact: sanitize(parsed.adult_impact||""),
      teen_impact: sanitize(parsed.teen_impact||""),
      tag: TAGS.includes(parsed.tag) ? parsed.tag : "otros",
      severity: [0,1,2,3].includes(parsed.severity) ? parsed.severity : 0,
      horizon: HORIZONS.includes(parsed.horizon) ? parsed.horizon : "sin plazo",
      action: ACTIONS.includes(parsed.action) ? parsed.action : "FYI",
      rationale: sanitize(parsed.rationale||""),
      confidence: Number(parsed.confidence)||0.4
    };

    if (!out.adult_impact || wc(out.adult_impact)>22 || emojiCount(out.adult_impact)>0) out.adult_impact = NEUTRAL;
    if (!out.teen_impact  || wc(out.teen_impact)>18  || emojiCount(out.teen_impact)>1) out.teen_impact  = NEUTRAL;
    if (out.confidence < 0.5) {
      out.severity = 0; out.action = "FYI";
      out.adult_impact = NEUTRAL; out.teen_impact = NEUTRAL;
    }
    out.adult_impact = stripBanned(out.adult_impact);
    out.teen_impact  = stripBanned(out.teen_impact);
  } catch (e) {}
  if (!out) out = fallbackImpact(input.title + " " + input.summary);
  return out;
}

export async function impactAdultFromLLM(llmCall, title="", summary=""){
  const r = await generateImpact(llmCall, { title, summary });
  return r.adult_impact;
}
export async function impactTeenFromLLM(llmCall, title="", summary=""){
  const r = await generateImpact(llmCall, { title, summary });
  return r.teen_impact;
}