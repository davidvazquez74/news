// impactEngine.test.js
import { generateImpact } from "./impactEngine.js";

const fakeLLM = async ({system,user})=>{
  const input = JSON.parse(user);
  if (input.title.toLowerCase().includes("euríbor")){
    return JSON.stringify({adult_impact:"Hipoteca variable puede subir.",teen_impact:"Ojo hipoteca 💸",tag:"finanzas",severity:2,horizon:"este mes",action:"vigilar",rationale:"Tipos",confidence:0.9});
  }
  return JSON.stringify({adult_impact:"Sin efecto directo en tu día a día.",teen_impact:"Sin efecto directo en tu día a día.",tag:"otros",severity:0,horizon:"sin plazo",action:"FYI",rationale:"Default",confidence:0.4});
};

(async()=>{
  const out = await generateImpact(fakeLLM,{title:"Sube 2 puntos el euríbor"});
  console.log("Test euríbor:", out);
})();
