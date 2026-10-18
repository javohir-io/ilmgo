const { HttpError } = require('./httpError');

/** Hand-rolled input validators. Each throws HttpError(400) with a field-specific message. */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function isEmail(value) {
  return typeof value === 'string' && value.length <= 254 && EMAIL_RE.test(value.trim());
}

const { fieldLabel } = require('./labels');

const bad = (message) => new HttpError(400, message);

/**
 * Trims a string. `undefined`/`null` become '' (or throw when required).
 * @param {*} value
 * @param {{field:string, max?:number, required?:boolean}} opts
 */
function cleanString(value, { field, max = 200, required = false }) {
  if (value === undefined || value === null) {
    if (required) throw bad(`${fieldLabel(field)} kiritilishi shart`);
    return '';
  }
  if (typeof value !== 'string') throw bad(`${fieldLabel(field)} matn boʻlishi kerak`);
  const text = value.trim();
  if (required && !text) throw bad(`${fieldLabel(field)} kiritilishi shart`);
  if (text.length > max) throw bad(`${fieldLabel(field)} ${max} ta belgidan oshmasligi kerak`);
  return text;
}

function cleanEmail(value) {
  const email = cleanString(value, { field: 'email', max: 254, required: true }).toLowerCase();
  if (!isEmail(email)) throw bad('Yaroqli email manzilini kiriting');
  return email;
}

/** Passwords: 8+ chars, at most 72 bytes (bcrypt ignores anything beyond that). */
function cleanPassword(value) {
  if (typeof value !== 'string' || value.length < 8) {
    throw bad('Parol kamida 8 ta belgidan iborat boʻlishi kerak');
  }
  if (Buffer.byteLength(value, 'utf8') > 72) throw bad('Parol 72 baytdan oshmasligi kerak');
  return value;
}

/** Returns `value` if it is one of `allowed`, else throws. Optional unless `required`. */
function cleanEnum(value, allowed, field, { required = false, fallback } = {}) {
  if (value === undefined || value === null || value === '') {
    if (required) throw bad(`${fieldLabel(field)} kiritilishi shart`);
    return fallback;
  }
  if (!allowed.includes(value)) throw bad(`${fieldLabel(field)} quyidagilardan biri boʻlishi kerak: ${allowed.join(', ')}`);
  return value;
}

/** Normalises a skills list: trims, drops empties, de-dupes case-insensitively. */
function normalizeSkills(value, { max = 30, maxLen = 40 } = {}) {
  if (value === undefined || value === null) return [];
  const list = typeof value === 'string' ? value.split(',') : value;
  if (!Array.isArray(list)) throw bad('Koʻnikmalar roʻyxat boʻlishi kerak');
  const seen = new Set();
  const out = [];
  for (const item of list) {
    if (typeof item !== 'string') throw bad('Koʻnikmalar matnlar roʻyxati boʻlishi kerak');
    const skill = item.trim();
    if (!skill) continue;
    if (skill.length > maxLen) throw bad(`Har bir koʻnikma ${maxLen} ta belgidan oshmasligi kerak`);
    const key = skill.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(skill);
  }
  if (out.length > max) throw bad(`Koʻpi bilan ${max} ta koʻnikma kiritish mumkin`);
  return out;
}

/** A list of free-text lines (requirements, benefits): trimmed, empties dropped. */
function cleanTextList(value, field, { max = 20, maxLen = 300 } = {}) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) throw bad(`${fieldLabel(field)} roʻyxat boʻlishi kerak`);
  const out = [];
  for (const item of value) {
    if (typeof item !== 'string') throw bad(`${fieldLabel(field)} matnlar roʻyxati boʻlishi kerak`);
    const line = item.trim();
    if (!line) continue;
    if (line.length > maxLen) throw bad(`${fieldLabel(field)} qatorlari ${maxLen} ta belgidan oshmasligi kerak`);
    out.push(line);
  }
  if (out.length > max) throw bad(`${fieldLabel(field)} uchun koʻpi bilan ${max} ta qator kiritish mumkin`);
  return out;
}

/** '' for empty, otherwise a http(s) URL string. */
function cleanUrl(value, field) {
  const text = cleanString(value, { field, max: 300 });
  if (!text) return '';
  let url;
  try {
    url = new URL(text);
  } catch {
    throw bad(`${fieldLabel(field)} yaroqli URL boʻlishi kerak`);
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw bad(`${fieldLabel(field)} http:// yoki https:// bilan boshlanishi kerak`);
  }
  return text;
}

/** Integer year in [1950, 2100] or null for empty. */
function cleanYear(value, field = 'graduationYear') {
  if (value === undefined || value === null || value === '') return null;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1950 || n > 2100) throw bad(`${fieldLabel(field)} yaroqli yil boʻlishi kerak`);
  return n;
}

/** ISO date/datetime string -> normalised ISO string, or null for empty. */
function cleanDeadline(value, field = 'deadline') {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
    throw bad(`${fieldLabel(field)} ISO formatidagi sana boʻlishi kerak`);
  }
  return new Date(value).toISOString();
}

module.exports = {
  isEmail,
  cleanString,
  cleanEmail,
  cleanPassword,
  cleanEnum,
  normalizeSkills,
  cleanTextList,
  cleanUrl,
  cleanYear,
  cleanDeadline,
};
