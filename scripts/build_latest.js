
// build_latest.js (patched)
// Genera impactos naturales para Adulto y Teen sin frases repetitivas

import Parser from "rss-parser";
import fs from "fs";

const parser = new Parser();
const feeds = [
  "https://www.lavanguardia.com/mvc/feed/rss/home",
  "https://elpais.com/rss/elpais/portada.xml",
];

function generateImpactAdult(title, description) {
  if (/euribor|hipoteca|bce|tipos/i.test(title)) {
    return "Tus cuotas de hipoteca pueden subir, revisa gastos o alternativas.";
  }
  if (/gasolina|combustible|crudo|petróleo/i.test(title)) {
    return "Podría encarecerse llenar el depósito o viajar.";
  }
  if (/huelga|protesta|paro/i.test(title)) {
    return "Servicios o movilidad podrían verse interrumpidos.";
  }
  if (/cultura|cine|música|concierto/i.test(title)) {
    return "Nuevas opciones de ocio o cambios en eventos culturales.";
  }
  // Por defecto: deja vacío si no hay impacto claro
  return "";
}

function generateImpactTeen(title, description) {
  if (/euribor|hipoteca|bce|tipos/i.test(title)) {
    return "Si tus padres hablan de hipoteca, malas noticias: toca pagar más 💸.";
  }
  if (/gasolina|combustible|crudo|petróleo/i.test(title)) {
    return "Ir en coche o moto puede salir más caro ⛽.";
  }
  if (/huelga|protesta|paro/i.test(title)) {
    return "Clases, trenes o buses pueden fallar 🚉.";
  }
  if (/cultura|cine|música|concierto/i.test(title)) {
    return "Planes de finde con pelis o conciertos pueden cambiar 🎶.";
  }
  return "";
}

async function build() {
  let items = [];
  for (const url of feeds) {
    try {
      const feed = await parser.parseURL(url);
      feed.items.forEach((item) => {
        items.push({
          title: item.title,
          link: item.link,
          pubDate: item.pubDate,
          source: feed.title,
          impactAdult: generateImpactAdult(item.title, item.contentSnippet),
          impactTeen: generateImpactTeen(item.title, item.contentSnippet),
        });
      });
    } catch (e) {
      console.error("Error parsing feed:", url, e);
    }
  }

  fs.writeFileSync("data/latest.json", JSON.stringify(items, null, 2));
}

build();
