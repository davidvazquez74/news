// scripts/utils/fetchWithCharset.js
// Descarga respetando charset declarado (UTF-8 / ISO-8859-1 / etc.).
import fetch from 'node-fetch';
import iconv from 'iconv-lite';

/**
 * Fetch de texto con detección de charset.
 * @param {string} url
 * @returns {Promise<string>}
 */
export async function fetchTextWithCharset(url) {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} fetching ${url}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  const ct = res.headers.get('content-type') || '';
  const m = /charset=([^;]+)/i.exec(ct);
  const charset = (m ? m[1] : 'utf-8').trim().toLowerCase();
  const norm = charset === 'iso-8859-1' ? 'latin1' : charset;
  // iconv-lite tolera charsets mal declarados (ej.: windows-1252)
  return iconv.decode(buf, norm);
}
