// scripts/sources.js (CommonJS)
// Edita libremente: añade/quita feeds.
const SOURCES = {
  cataluna: [
    "https://www.lavanguardia.com/rss/politica.xml",
    "https://www.lavanguardia.com/rss/vida.xml",
    "https://www.lavanguardia.com/mvc/feed/rss/home.xml",
    "https://www.elperiodico.com/es/rss/catalunya/rss.xml"
  ],
  espana: [
    "https://www.elperiodico.com/es/rss/",
    "https://www.elperiodico.com/es/rss/economia/",
    "https://www.elperiodico.com/es/rss/internacional/"
  ],
  rioja: [
    "https://www.larioja.com/rss/2.0/portada",
    "https://actualidad.larioja.org/noticia?formato=rss2"
  ],
  background: [
    "https://www.rtve.es/api/temas/ultimas-noticias.rss",
    "https://feeds.bbci.co.uk/mundo/rss.xml"
  ],
  deportes: [
    "https://www.sport.es/es/rss/",
    "https://www.sport.es/es/rss/barca.xml"
  ],
  radios: []
};

module.exports = { SOURCES };