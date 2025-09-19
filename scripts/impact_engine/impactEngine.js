// scripts/impact_engine/impactEngine.js
import { pickDefaultByKeywords, defaultImpactsForTag } from "./impactConstants.js";

export function generateImpactFromKeywords(title="", summary=""){
  const text = `${title} ${summary}`.trim();
  const { tag, severity, horizon, action } = pickDefaultByKeywords(text);
  const phr = defaultImpactsForTag(tag);
  return {
    adult: phr.adult,
    teen:  phr.teen,
    tag, severity, horizon, action,
    confidence: 0.5
  };
}
