// scripts/impactEngine.js
// Motor de impacto ampliado: nunca vacío, más categorías, variación de frases y ajuste por señales. ESM.
import { TAGS, SEVERITIES, HORIZONS, ACTIONS, KEYWORD_TAG_MAP, SIGNALS, LOCAL_PLACES } from "./impactConstants.js";

const neutral = "Sin efecto directo en tu día a día.";
const clean = (s)=>String(s||"").replace(/\s+/g," ").trim();
const lc = (s)=>clean(s).toLowerCase();

function hashStr(s){ let h=0; for(let i=0;i<s.length;i++) h=(h*31+s.charCodeAt(i))>>>0; return h; }
function pickVariant(arr, seed){ if(!arr?.length) return ""; return arr[hashStr(seed)%arr.length]; }

function classify(text){
  for (const m of KEYWORD_TAG_MAP){ if (m.re.test(text)) return { tag:m.tag, severity:m.severity, horizon:m.horizon, action:m.action }; }
  return { tag:"otros", severity:SEVERITIES.NONE, horizon:"sin plazo", action:"FYI" };
}
function tuneBySignals(base, text){
  let { tag, severity, horizon, action } = base;
  if (SIGNALS.URGENCY.test(text)){ horizon=/mañana/i.test(text)?"mañana":"hoy"; if(severity<SEVERITIES.MEDIUM) severity=SEVERITIES.MEDIUM; if(action==="FYI") action="planificar"; }
  if (SIGNALS.STRONG.test(text)){ if(severity<SEVERITIES.MEDIUM) severity=SEVERITIES.MEDIUM; action=(severity>=SEVERITIES.MEDIUM)?"actuar":"planificar"; if(horizon==="sin plazo") horizon="esta semana"; }
  if (SIGNALS.RISK.test(text)){ if(severity<SEVERITIES.MEDIUM) severity=SEVERITIES.MEDIUM; action="planificar"; horizon="hoy"; }
  if (SIGNALS.SERVICE_DOWN.test(text)){ if(severity<SEVERITIES.MEDIUM) severity=SEVERITIES.MEDIUM; action="actuar"; horizon="hoy"; }
  if (LOCAL_PLACES.some(p=>text.includes(p))){ if(severity===SEVERITIES.LOW) severity=SEVERITIES.MEDIUM; if(horizon==="sin plazo") horizon="hoy"; if(action==="FYI") action="planificar"; }
  return { tag, severity, horizon, action };
}

const TEMPLATES = {
  finanzas:{ adult:["Si tu hipoteca es variable, revisa próximas cuotas.","Comprueba condiciones de tu préstamo: la cuota puede moverse.","Ajusta presupuesto: intereses y letras pueden variar."],
             teen:["En casa puede cambiar la letra de la hipoteca. 💶","Pueden subir/bajar cuotas; ojo a gastos en casa. 🙂","Revisad la hipoteca en casa; puede moverse."] },
  economia:{ adult:["Señal macro: útil para decisiones de ahorro y consumo.","Contexto económico para planificar compras y ahorro.","Tenlo en cuenta al ajustar gastos del mes."],
             teen:["Sirve para entender si toca apretar gastos. 🙂","Pista económica para planear compras.","Info para no pasarse con el gasto."] },
  empleo:{ adult:["Puede afectar nóminas o convenios; revisa condiciones.","Atento a ofertas y cambios de convenio.","Útil si buscas empleo o te revisan salario."],
           teen:["Curros y sueldos pueden moverse; pregunta en casa.","Si trabajas, ojo a cambios de horas/sueldo.","Puede cambiar horarios o sueldos; atento."] },
  vivienda:{ adult:["Cambios en alquiler/hipoteca: revisa plazos y condiciones.","Si alquilas o vas a comprar, puede variar el coste.","Comprueba cláusulas y plazos de tu contrato."],
             teen:["Pisos más caros o normas nuevas; ojo si buscáis. 🏠","Si os vais a independizar, puede salir más caro.","Buscar piso puede ser más difícil/caro."] },
  impuestos:{ adult:["Podría variar lo que pagas o recibes; revisa facturas y fechas.","Mira deducciones/bonos: pueden cambiar requisitos.","Revisa trámites en la web oficial por si hay cambios."],
              teen:["Impuestos/ayudas pueden cambiar; pregunta en casa. 🧾","Puede afectar pagos o ayudas familiares.","Revisad si cambian ayudas/descuentos."] },
  energía:{ adult:["Atento a la factura eléctrica: puede moverse estos días.","Comprueba tu tarifa; podrías ahorrar ajustando horarios.","Vigila tu consumo; puede variar el coste."],
            teen:["La factura de luz puede subir/bajar un poco. 🙂","Ojo con dejar todo encendido: puede costar más.","Mejor no despilfarrar: puede subir."] },
  combustibles:{ adult:["Vigila precios en surtidor; planifica repostajes.","Si haces viajes, calcula coste: puede variar.","Usa apps para buscar mejor precio."],
                 teen:["Echar gasolina puede salir más caro. ⛽","Si vais en coche, gastará más.","Los viajes pueden costar más."] },
  utilidades:{ adult:["Puede haber cambios de tarifas o calidad del servicio.","Revisa tu contrato/operador por si hay ajustes.","Comprueba coberturas y permanencias."],
               teen:["Internet/móvil pueden ir raros o más caros.","Si la red va mal, es por esto.","Podrían cambiar tarifas del móvil."] },
  movilidad:{ adult:["Planifica desplazamientos: posibles retrasos o servicios mínimos.","Consulta horarios y alternativas antes de salir.","Evita horas punta: habrá esperas."],
              teen:["Metro/tren pueden fallar; sal con margen. 🚌","Retrasos: toca madrugar un pelín.","Quedaos antes: puede haber lío."] },
  transporte:{ adult:["Más tráfico/controles: calcula tiempos extra.","Si viajas, revisa estado del vuelo y carreteras.","Atento a peajes/ITV si te aplica."],
               teen:["Atascos y retrasos; sal antes.","Si vas al aeropuerto, ve con tiempo.","Puede tocar esperar más."] },
  educacion:{ adult:["Fechas y trámites pueden moverse; consulta el centro.","Becas y matrículas: revisa plazos.","Calendario escolar con posibles cambios."],
              teen:["Fechas de clase/exámenes pueden cambiar. 📅","Ojo a becas y plazos.","Calendario se mueve; atento."] },
  salud:{ adult:["Puede afectar citas o servicios; consulta tu centro.","Revisa calendarios de vacunación/consultas.","Planifica trámites sanitarios si te aplica."],
          teen:["Citas/horarios del centro pueden cambiar. 🙂","Si te toca vacuna, mira fechas.","Puede haber más espera."] },
  seguridad:{ adult:["Evita la zona y sigue indicaciones oficiales.","Atento a avisos municipales.","No te acerques: seguridad ante todo."],
              teen:["No te acerques; espera avisos.","Mejor no pasar por allí.","Evita esa zona."] },
  justicia:{ adult:["Contexto legal; consulta si impacta tus trámites.","Cambios que pueden afectar procesos judiciales.","Útil si tienes gestiones legales."],
             teen:["Tema de juzgados; para la mayoría, sin cambios.","Es legal; no afecta a clases/planes.","Sin efecto directo para ti."] },
  europeo:{ adult:["Decisión en la UE que puede reflejarse aquí más adelante.","Reglas europeas que podrían trasladarse a España.","Útil para anticipar cambios normativos."],
            teen:["Normas de la UE que quizá lleguen aquí. 🙂","Europa decide; luego puede aplicarse.","De momento, info útil."] },
  internacional:{ adult:["Relevante fuera; aquí el efecto es indirecto.","Útil para contexto global; sin cambios inmediatos.","Observa por si deriva en normas o precios."],
                  teen:["Es de fuera; aquí no cambia nada hoy.","Sirve para enterarse; sin efecto directo.","Contexto mundial, sin líos aquí."] },
  geopolitica:{ adult:["Atento a posibles efectos en energía/precios si escala.","Contexto global para precios y suministros.","Seguimiento prudente por si impacta mercados."],
                teen:["Si sube el lío, puede encarecer cosas.","Es política internacional; no te afecta hoy.","Info global, sin cambios en tu día."] },
  tecnología:{ adult:["Cambios en servicios/actualizaciones pueden afectar tu uso.","Revisa ajustes y permisos si usas estas apps.","Atento a nuevas normas de plataformas."],
               teen:["Apps pueden cambiar cosas; revisa ajustes. 📱","Alguna función puede ir distinta.","Mira permisos si te falla algo."] },
  ia:{ adult:["Servicios con IA pueden ajustar avisos y controles.","Cambia la forma de usar algunas funciones.","Útil si trabajas/estudias con IA."],
       teen:["Apps con IA pueden ir diferente. 🙂","Puede cambiar cómo usas ciertas funciones.","Fíjate si algo va raro."] },
  ciberseguridad:{ adult:["Cambia contraseñas y activa doble factor si te afecta.","Evita links sospechosos; actualiza dispositivos.","Revisa si tus datos están expuestos."],
                   teen:["Cambia clave y activa 2FA ya. 🔐","No pinches links raros.","Actualiza el móvil."] },
  privacidad:{ adult:["Revisa permisos y configuración de datos.","Ajusta tu consentimiento de cookies/seguimiento.","Comprueba qué compartes."],
               teen:["Mira permisos: quizá compartes de más.","Ajusta privacidad en la app.","Revisa lo que publicas."] },
  redes_sociales:{ adult:["Cambios en normas pueden afectar publicaciones y cuentas.","Revisa políticas si creas contenido.","Atento a limitaciones/reglas nuevas."],
                   teen:["La app puede cambiar reglas; ojo con lo que subes. 🎧","Puede afectar a tus posts.","Revisa si hay normas nuevas."] },
  apps:{ adult:["Revisa suscripción y ajustes; puede cambiar el servicio.","Comprueba si hay nuevas limitaciones.","Actualiza a la última versión."],
         teen:["La app puede cambiar; mira ajustes. 🙂","Puede pedir actualizar.","Ojo si te falla algo."] },
  dispositivos:{ adult:["Comprueba compatibilidad y soporte antes de actualizar.","Planifica compra si necesitas renovar.","Guarda copias de seguridad."],
                 teen:["Si actualizas, mira que tu móvil aguante.","Haz copia por si acaso.","No borres cosas importantes."] },
  suscripciones:{ adult:["Si sube la cuota, valora alternativas o bajar plan.","Revisa renovaciones automáticas.","Controla gastos mensuales."],
                  teen:["La suscripción puede subir; ojo. 💳","Mirad si compensa pagar eso.","Quizá toque bajar plan."] },
  cultura:{ adult:["Si te interesa, compra entradas con antelación.","Más afluencia en la zona del evento.","Planifica horarios y transporte."],
            teen:["Si vas, pilla entrada pronto. 🎟️","Habrá mucha gente.","Ve con tiempo."] },
  eventos:{ adult:["Tráfico y transporte afectados cerca del evento.","Revisa cortes de calles y accesos.","Llega con antelación."],
            teen:["Habrá atasco; sal pronto.","Calle cortada; ojo rutas.","Quedada, pero antes."] },
  deporte:{ adult:["Más afluencia y tráfico en la zona del estadio.","Planifica desplazamientos el día del partido.","Si vas, revisa accesos y horarios."],
            teen:["Día de partido: llega pronto. ⚽","Más gente por la zona.","No vayas justo de tiempo."] },
  clima:{ adult:["Ajusta planes y traslados; consulta alertas locales.","Evita desplazamientos si hay aviso fuerte.","Revisa previsión y equipamiento."],
          teen:["Tiempo chungo: haz plan B. 🌧️","Llévate chubasquero.","Mejor bajo techo."] },
  medioambiente:{ adult:["Sigue recomendaciones municipales.","Evita zonas afectadas y reduce exposición.","Atento a restricciones puntuales."],
                  teen:["Si huele raro o hay humo, no te quedes.","Mejor evita esa zona.","No hagas deporte al aire libre."] },
  incendios:{ adult:["Evita la zona; sigue avisos oficiales.","Planifica rutas alternativas.","Mantén ventanas cerradas si hay humo."],
              teen:["No te acerques; es peligroso.","Busca otra ruta.","Cierra ventanas si huele a humo."] },
  turismo:{ adult:["Si viajas, comprueba vuelos y requisitos.","Puede subir alojamiento/transporte.","Planifica con margen."],
            teen:["Viajes: mira vuelos antes.","Hoteles pueden ser caros.","Plan con tiempo."] },
  comercio:{ adult:["Se puede notar en la cesta de la compra.","Compara precios y ofertas.","Planifica compras grandes."],
             teen:["Cosas un poco más caras.","Busca chollos antes.","No te pases comprando."] },
  otros:{ adult:[neutral,"Información útil, sin efecto directo en tu rutina.","Contexto general; no cambia tu día a día."],
         teen:[neutral,"Es info general; tu día sigue igual.","Nada que te cambie planes."] }
};

export function impactFromText(title="", summary=""){
  const raw = clean(`${title} ${summary}`);
  const text = lc(raw);
  const tuned = tuneBySignals(classify(text), text);
  const family = TEMPLATES[tuned.tag] || TEMPLATES.otros;
  const seed = title || summary || tuned.tag;

  const clip = (s, max)=> {
    const parts = clean(s).split(/\s+/);
    return (parts.length<=max) ? s : parts.slice(0,max).join(" ") + "…";
  };

  let adult = clip(pickVariant(family.adult, seed) || neutral, 22);
  let teen  = clip(pickVariant(family.teen,  seed) || neutral, 18);
  if (!adult) adult = neutral; if (!teen) teen = neutral;

  return { adult_impact: adult, teen_impact: teen, tag: tuned.tag, severity: tuned.severity, horizon: tuned.horizon, action: tuned.action };
}
