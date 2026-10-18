const test = require('node:test');
const assert = require('node:assert/strict');
const { statusNotification } = require('../src/lib/statusCopy');
const files = require('../src/lib/files');
const config = require('../src/lib/config');
const { redactToken } = require('../src/lib/redact');
const { asyncHandler } = require('../src/lib/asyncHandler');
const { buildSeedJobs } = require('../src/db/seedJobs');
const { APPLICATION_STATUSES, ACCENTS, JOB_TYPES, WORK_MODES, LEVELS } = require('../src/lib/constants');
const { parseJobInput } = require('../src/lib/inputs');

test('statusNotification covers every status and appends notes', () => {
  const job = { title: 'Dev', company: 'Acme' };
  for (const status of APPLICATION_STATUSES) {
    const n = statusNotification(status, job);
    assert.ok(n.title && n.body.includes('Acme'), status);
  }
  assert.match(statusNotification('rejected', job, ' Try again ').body, /Jamoa izohi: “Try again”$/);
  assert.throws(() => statusNotification('nope', job));
});

test('files: extension allow-list, safe names, signatures', () => {
  assert.equal(files.allowedExtension('cv.PDF', files.RESUME_EXTENSIONS), '.pdf');
  assert.equal(files.allowedExtension('cv.pdf.exe', files.RESUME_EXTENSIONS), '');
  assert.equal(files.allowedExtension('noext', files.RESUME_EXTENSIONS), '');
  assert.equal(files.safeOriginalName('../../etc/passwd'), 'passwd');
  assert.equal(files.safeOriginalName('C:\\Users\\me\\cv.pdf'), 'cv.pdf');
  assert.equal(files.safeOriginalName('a\u0000b.pdf'), 'ab.pdf');
  assert.equal(files.safeOriginalName(''), 'file');
  assert.ok(files.isGeneratedFilename('3f2b8c1e-1d4a-4b6e-9c3a-0a1b2c3d4e5f.pdf'));
  assert.ok(!files.isGeneratedFilename('../3f2b8c1e-1d4a-4b6e-9c3a-0a1b2c3d4e5f.pdf'));
  assert.ok(!files.isGeneratedFilename('passwd'));
  assert.ok(files.signatureMatches('.pdf', Buffer.from('%PDF-1.7 ...')));
  assert.ok(!files.signatureMatches('.pdf', Buffer.from('MZ\x90\x00')));
  assert.ok(files.signatureMatches('.png', Buffer.from('89504e470d0a1a0a0000', 'hex')));
  assert.ok(files.signatureMatches('.webp', Buffer.from('RIFF....WEBP')));
  assert.ok(!files.signatureMatches('.exe', Buffer.from('MZ')));
});

test('config: JWT secret rules', () => {
  assert.throws(() => config.assertJwtSecret({}), /not set/);
  assert.throws(() => config.assertJwtSecret({ JWT_SECRET: config.JWT_PLACEHOLDER, NODE_ENV: 'production' }), /placeholder/);
  assert.throws(() => config.assertJwtSecret({ JWT_SECRET: 'short', NODE_ENV: 'production' }), /32/);
  assert.equal(config.assertJwtSecret({ JWT_SECRET: config.JWT_PLACEHOLDER }), config.JWT_PLACEHOLDER);
  assert.equal(config.assertJwtSecret({ JWT_SECRET: 'x'.repeat(40), NODE_ENV: 'production' }).length, 40);
});

test('config: CORS origin policy', () => {
  assert.deepEqual(config.parseCorsOrigins(' https://a.io/ , ,https://b.io'), ['https://a.io', 'https://b.io']);
  assert.ok(config.isOriginAllowed(undefined, { origins: ['https://a.io'] }));
  assert.ok(config.isOriginAllowed('http://localhost:5173', {}));
  assert.ok(!config.isOriginAllowed('https://evil.io', {}));
  assert.ok(config.isOriginAllowed('https://a.io', { origins: ['https://a.io'] }));
  assert.ok(!config.isOriginAllowed('http://localhost:5173', { origins: ['https://a.io'] }));
  assert.ok(config.isOriginAllowed('https://anything.io', { origins: ['*'], nodeEnv: 'development' }));
  assert.ok(!config.isOriginAllowed('https://anything.io', { origins: ['*'], nodeEnv: 'production' }));
});

test('redactToken masks the query token', () => {
  assert.equal(redactToken('/api/admin/applications.csv?token=abc.def&x=1'), '/api/admin/applications.csv?token=[redacted]&x=1');
  assert.equal(redactToken('/api/jobs?search=a'), '/api/jobs?search=a');
});

test('asyncHandler forwards rejections to next', async () => {
  const boom = new Error('boom');
  let received;
  await asyncHandler(async () => { throw boom; })({}, {}, (e) => { received = e; });
  await new Promise((r) => setImmediate(r));
  assert.equal(received, boom);
});

test('seed jobs are valid, fictional and varied', () => {
  const now = new Date('2026-10-14T00:00:00Z');
  const jobs = buildSeedJobs(now);
  assert.equal(jobs.length, 10);
  assert.equal(new Set(jobs.map((j) => j.id)).size, 10);
  const real = /rockstar|sony|ubisoft|google|microsoft|meta|amazon|apple|nvidia/i;
  for (const job of jobs) {
    assert.ok(!real.test(job.company), job.company);
    assert.ok(job.skills.length >= 4 && job.skills.length <= 7, job.id);
    assert.ok(ACCENTS.includes(job.accent), job.id);
    assert.ok(new Date(job.deadline) > now);
    assert.ok(job.benefits.length > 0 && job.requirements.length > 0);
    // Every seed must satisfy the same validation as the admin API.
    assert.doesNotThrow(() => parseJobInput(job));
  }
  assert.ok(new Set(jobs.map((j) => j.type)).size >= 3);
  assert.equal(new Set(jobs.map((j) => j.workMode)).size, WORK_MODES.length);
  assert.ok(new Set(jobs.map((j) => j.level)).size >= 2);
  assert.ok(jobs.every((j) => JOB_TYPES.includes(j.type) && LEVELS.includes(j.level)));
});
