/** Request-body parsers: turn untrusted JSON/form bodies into clean, typed objects. */
const { HttpError } = require('./httpError');
const { fieldLabel } = require('./labels');
const {
  JOB_TYPES, WORK_MODES, LEVELS, JOB_STATUSES, SKILL_LEVELS, DEFAULT_ACCENT,
} = require('./constants');
const {
  cleanString, cleanEmail, cleanPassword, cleanEnum, normalizeSkills,
  cleanTextList, cleanUrl, cleanYear, cleanDeadline,
} = require('./validate');

function assertObject(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new HttpError(400, 'Soʻrov tanasi obyekt boʻlishi kerak');
  }
  return body;
}

function cleanBoolean(value, field) {
  if (value === true || value === 'true' || value === 1 || value === '1') return true;
  if (value === false || value === 'false' || value === 0 || value === '0') return false;
  throw new HttpError(400, `${fieldLabel(field)} “true” yoki “false” boʻlishi kerak`);
}

function cleanAccent(value) {
  if (typeof value !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(value.trim())) {
    throw new HttpError(400, 'Rang #00638E kabi hex formatida boʻlishi kerak');
  }
  return value.trim().toUpperCase();
}

function parseRegisterInput(body) {
  assertObject(body);
  return {
    name: cleanString(body.name, { field: 'name', max: 100, required: true }),
    email: cleanEmail(body.email),
    password: cleanPassword(body.password),
    university: cleanString(body.university, { field: 'university', max: 150 }),
    degreeProgram: cleanString(body.degreeProgram, { field: 'degreeProgram', max: 150 }),
  };
}

function parseLoginInput(body) {
  assertObject(body);
  if (typeof body.email !== 'string' || typeof body.password !== 'string' || !body.email.trim() || !body.password) {
    throw new HttpError(400, 'Email va parol kiritilishi shart');
  }
  return { email: body.email.trim().toLowerCase(), password: body.password };
}

/** Partial profile update: only keys present in the body are returned. */
function parseProfileInput(body) {
  assertObject(body);
  const out = {};
  const has = (k) => body[k] !== undefined;
  if (has('name')) out.name = cleanString(body.name, { field: 'name', max: 100, required: true });
  if (has('university')) out.university = cleanString(body.university, { field: 'university', max: 150 });
  if (has('degreeProgram')) out.degreeProgram = cleanString(body.degreeProgram, { field: 'degreeProgram', max: 150 });
  if (has('graduationYear')) out.graduationYear = cleanYear(body.graduationYear);
  if (has('phone')) out.phone = cleanString(body.phone, { field: 'phone', max: 40 });
  if (has('about')) out.about = cleanString(body.about, { field: 'about', max: 1000 });
  if (has('title')) out.title = cleanString(body.title, { field: 'title', max: 80 });
  if (has('skills')) out.skills = normalizeSkills(body.skills);
  if (has('githubUrl')) out.githubUrl = cleanUrl(body.githubUrl, 'githubUrl');
  if (has('linkedinUrl')) out.linkedinUrl = cleanUrl(body.linkedinUrl, 'linkedinUrl');
  return out;
}

/**
 * Job create/update body. With `partial`, only provided keys are returned and
 * required text fields may be omitted (but not blanked). Without it, defaults are filled in.
 */
function parseJobInput(body, { partial = false } = {}) {
  assertObject(body);
  const out = {};
  const has = (k) => body[k] !== undefined;
  const text = (key, max, required) => {
    if (has(key) || (required && !partial)) {
      out[key] = cleanString(body[key], { field: key, max, required });
    }
  };
  text('title', 120, true);
  text('company', 100, true);
  text('location', 100, true);
  text('description', 5000, true);
  text('stipend', 60, false);
  text('companyAbout', 2000, false);

  const enums = [
    ['type', JOB_TYPES, 'Internship'],
    ['workMode', WORK_MODES, 'On-site'],
    ['level', LEVELS, 'Entry'],
    ['status', JOB_STATUSES, 'open'],
  ];
  for (const [key, allowed, fallback] of enums) {
    if (has(key)) out[key] = cleanEnum(body[key], allowed, key, { required: true });
    else if (!partial) out[key] = fallback;
  }

  if (has('deadline')) out.deadline = cleanDeadline(body.deadline);
  else if (!partial) out.deadline = null;
  if (has('featured')) out.featured = cleanBoolean(body.featured, 'featured');
  else if (!partial) out.featured = false;
  if (has('accent')) out.accent = cleanAccent(body.accent);
  else if (!partial) out.accent = DEFAULT_ACCENT;

  const lists = [
    ['skills', () => normalizeSkills(body.skills)],
    ['requirements', () => cleanTextList(body.requirements, 'requirements')],
    ['benefits', () => cleanTextList(body.benefits, 'benefits')],
  ];
  for (const [key, parse] of lists) {
    if (has(key)) out[key] = parse();
    else if (!partial) out[key] = [];
  }
  return out;
}

/** Multipart text fields of POST /api/applications (the resume file is handled separately). */
function parseApplicationInput(body) {
  assertObject(body);
  return {
    jobId: cleanString(body.jobId, { field: 'jobId', max: 100, required: true }),
    firstName: cleanString(body.firstName, { field: 'firstName', max: 80, required: true }),
    lastName: cleanString(body.lastName, { field: 'lastName', max: 80, required: true }),
    address: cleanString(body.address, { field: 'address', max: 200 }),
    city: cleanString(body.city, { field: 'city', max: 100 }),
    university: cleanString(body.university, { field: 'university', max: 150 }),
    phone: cleanString(body.phone, { field: 'phone', max: 40, required: true }),
    email: cleanEmail(body.email),
    skillLevel: cleanEnum(body.skillLevel, SKILL_LEVELS, 'skillLevel', { required: true }),
    coverNote: cleanString(body.coverNote, { field: 'coverNote', max: 2000 }),
  };
}

module.exports = {
  parseRegisterInput,
  parseLoginInput,
  parseProfileInput,
  parseJobInput,
  parseApplicationInput,
};
