/** Upload safety helpers (pure, so they can be unit-tested). */
const path = require('path');

const RESUME_EXTENSIONS = ['.pdf', '.doc', '.docx'];
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

/** Lower-cased extension of a client-supplied name, or '' if it is not in `allowed`. */
function allowedExtension(originalName, allowed) {
  const ext = path.extname(String(originalName || '')).toLowerCase();
  return allowed.includes(ext) ? ext : '';
}

/** Display-safe version of a client filename: basename only, no control chars, capped. */
function safeOriginalName(originalName) {
  const base = String(originalName || '').replace(/\\/g, '/').split('/').pop();
  // eslint-disable-next-line no-control-regex
  const cleaned = base.replace(/[\u0000-\u001f\u007f]/g, '').trim();
  return (cleaned || 'file').slice(0, 200);
}

/** True if `name` is exactly a generated "<uuid><ext>" filename (no separators, no dots tricks). */
function isGeneratedFilename(name) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.[a-z0-9]{2,5}$/.test(name);
}

const SIGNATURES = {
  '.pdf': (b) => b.subarray(0, 5).toString('latin1') === '%PDF-',
  '.doc': (b) => b.subarray(0, 8).toString('hex') === 'd0cf11e0a1b11ae1',
  '.docx': (b) => b.subarray(0, 2).toString('latin1') === 'PK',
  '.png': (b) => b.subarray(0, 8).toString('hex') === '89504e470d0a1a0a',
  '.jpg': (b) => b[0] === 0xff && b[1] === 0xd8,
  '.jpeg': (b) => b[0] === 0xff && b[1] === 0xd8,
  '.gif': (b) => ['GIF87a', 'GIF89a'].includes(b.subarray(0, 6).toString('latin1')),
  '.webp': (b) => b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP',
};

/** Checks the file's magic bytes against its extension (first ~12 bytes are enough). */
function signatureMatches(ext, head) {
  const check = SIGNATURES[ext];
  return Boolean(check && head && check(head));
}

module.exports = {
  RESUME_EXTENSIONS,
  IMAGE_EXTENSIONS,
  allowedExtension,
  safeOriginalName,
  isGeneratedFilename,
  signatureMatches,
};
