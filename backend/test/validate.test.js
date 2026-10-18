const test = require('node:test');
const assert = require('node:assert/strict');
const v = require('../src/lib/validate');
const { HttpError } = require('../src/lib/httpError');

const rejects = (fn, re) => assert.throws(fn, (e) => e instanceof HttpError && e.status === 400 && (!re || re.test(e.message)));

test('email validation', () => {
  assert.ok(v.isEmail('a@b.co'));
  assert.ok(!v.isEmail('a@b'));
  assert.ok(!v.isEmail('a b@c.com'));
  assert.ok(!v.isEmail(null));
  assert.equal(v.cleanEmail('  Foo@Bar.COM '), 'foo@bar.com');
  rejects(() => v.cleanEmail('nope'), /email/i);
  rejects(() => v.cleanEmail(undefined), /kiritilishi shart/);
});

test('password rules', () => {
  assert.equal(v.cleanPassword('12345678'), '12345678');
  rejects(() => v.cleanPassword('short'), /8/);
  rejects(() => v.cleanPassword(12345678));
  rejects(() => v.cleanPassword('x'.repeat(73)), /72/);
});

test('cleanString trims, caps and enforces required', () => {
  assert.equal(v.cleanString('  hi ', { field: 'f' }), 'hi');
  assert.equal(v.cleanString(undefined, { field: 'f' }), '');
  rejects(() => v.cleanString('  ', { field: 'f', required: true }), /f kiritilishi shart/);
  rejects(() => v.cleanString('abcd', { field: 'f', max: 3 }), /3 ta belgidan/);
  rejects(() => v.cleanString({}, { field: 'f' }), /matn/);
});

test('cleanEnum', () => {
  assert.equal(v.cleanEnum('a', ['a', 'b'], 'x'), 'a');
  assert.equal(v.cleanEnum(undefined, ['a'], 'x', { fallback: 'a' }), 'a');
  rejects(() => v.cleanEnum('z', ['a'], 'x'), /quyidagilardan/);
  rejects(() => v.cleanEnum('', ['a'], 'x', { required: true }), /kiritilishi shart/);
});

test('normalizeSkills trims, de-dupes case-insensitively, validates', () => {
  assert.deepEqual(v.normalizeSkills([' Flutter', 'flutter', '', 'Dart ']), ['Flutter', 'Dart']);
  assert.deepEqual(v.normalizeSkills('a, b ,A'), ['a', 'b']);
  assert.deepEqual(v.normalizeSkills(undefined), []);
  rejects(() => v.normalizeSkills({ a: 1 }), /roʻyxat/);
  rejects(() => v.normalizeSkills([1]), /matn/);
  rejects(() => v.normalizeSkills(['x'.repeat(41)]), /40/);
  rejects(() => v.normalizeSkills(Array.from({ length: 31 }, (_, i) => `s${i}`)), /30/);
});

test('cleanTextList, cleanUrl, cleanYear, cleanDeadline', () => {
  assert.deepEqual(v.cleanTextList([' a ', ''], 'benefits'), ['a']);
  rejects(() => v.cleanTextList('a', 'benefits'), /roʻyxat/);
  assert.equal(v.cleanUrl('', 'githubUrl'), '');
  assert.equal(v.cleanUrl('https://github.com/x', 'githubUrl'), 'https://github.com/x');
  rejects(() => v.cleanUrl('javascript:alert(1)', 'githubUrl'), /http/);
  rejects(() => v.cleanUrl('not a url', 'githubUrl'), /yaroqli URL/);
  assert.equal(v.cleanYear('2027'), 2027);
  assert.equal(v.cleanYear(''), null);
  rejects(() => v.cleanYear(1800), /yil/);
  rejects(() => v.cleanYear('abc'), /yil/);
  assert.equal(v.cleanDeadline('2026-12-01'), '2026-12-01T00:00:00.000Z');
  assert.equal(v.cleanDeadline(null), null);
  rejects(() => v.cleanDeadline('soon'), /ISO/);
});
