// scripts/utils/text.js
// Sanitizador que no rompe acentos ni emojis.
export function cleanText(input = "") {
  return String(input)
    .normalize("NFC")
    .replace(/\s+/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
