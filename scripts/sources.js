// scripts/sources.js
// Edita libremente: añade/quita feeds. El builder es tolerante a fallos (403/500/timeout).
export const SOURCES = {
  cataluna: [
    // La Vanguardia portada/política/cultura (ejemplos)
    "https://www.lavanguardia.com/rss/politica.xml",
    "https://www.lavanguardia.com/rss/vida.xml",
    "https://www.lavanguardia.com/mvc/feed/rss/home.xml"
  ],
  espana: [
    "https://www.elperiodico.com/es/rss/",
    "https://www.elperiodico.com/es/rss/economia/",
    "https://www.elperiodico.com/es/rss/internacional/"
  ],
  rioja: [
    "https://www.larioja.com/rss/2.0/portada"
  ],
  background: [
    "https://www.rtve.es/api/temas/ultimas-noticias.rss",
    "https://feeds.bbci.co.uk/mundo/rss.xml"
  ],
  deportes: [
    "https://www.sport.es/es/rss/",
    "https://www.sport.es/es/rss/barca.xml"
  ],
  radios: [
    "https://cadenaser.com/rss/",
    "https://www.rac1.cat/feed/rss.xml",
    "https://www.ccma.cat/rtveterra/rss/"
  ]
};
