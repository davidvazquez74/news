// impactEngine.js
import { TAGS, SEVERITIES, HORIZONS, ACTIONS, pickDefaultByKeywords } from "./impactConstants.js";

const wc = s => s.trim().split(/\s+/).filter(Boolean).length;
const emojiCount = s => Array.from(s).filter(c=>/\p{Emoji}/u.test(c)).length;
const sanitize = s => String(s||"").replace(/\s+/g," ").trim();
const neutral = "Sin efecto directo en tu día a día.";

// Fallback
function fallbackImpact(text){
  const { tag, severity, horizon, action } = pickDefaultByKeywords(text);
  return {
    adult_impact: neutral, teen_impact: neutral,
    tag, severity, horizon, action,
    rationale: "Fallback por keywords", confidence: 0.4
  };
}

// Generador principal (stub sin LLM)
export async function generateImpact(llmCall, news){
  const input = {
    title: sanitize(news.title||""),
    summary: sanitize(news.summary||""),
    source: sanitize(news.source||""),
    published_at: sanitize(news.published_at||""),
    location: sanitize(news.location||"ES"),
    category: sanitize(news.category||"otros")
  };
  try {
    const raw = await llmCall({ system:"", user:JSON.stringify(input) });
    const parsed = JSON.parse(raw);
    let out = {
      adult_impact: sanitize(parsed.adult_impact),
      teen_impact: sanitize(parsed.teen_impact),
      tag: TAGS.includes(parsed.tag)?parsed.tag:"otros",
      severity: [0,1,2,3].includes(parsed.severity)?parsed.severity:0,
      horizon: HORIZONS.includes(parsed.horizon)?parsed.horizon:"sin plazo",
      action: ACTIONS.includes(parsed.action)?parsed.action:"FYI",
      rationale: sanitize(parsed.rationale||""),
      confidence: Number(parsed.confidence)||0.4
    };
    if (!out.adult_impact || wc(out.adult_impact)>22 || emojiCount(out.adult_impact)>0){ out.adult_impact=neutral; }
    if (!out.teen_impact || wc(out.teen_impact)>18 || emojiCount(out.teen_impact)>1){ out.teen_impact=neutral; }
    if (out.confidence<0.5){ out.severity=0; out.action="FYI"; out.adult_impact=neutral; out.teen_impact=neutral; }
    return out;
  } catch(e){
    return fallbackImpact(input.title+" "+input.summary);
  }
}
