const test = require('node:test');
const assert = require('node:assert/strict');
const inputs = require('../src/lib/inputs');
const { HttpError } = require('../src/lib/httpError');

test('parseRegisterInput normalises and validates', () => {
  const out = inputs.parseRegisterInput({ name: ' Ann ', email: 'ANN@x.io', password: 'password1' });
  assert.deepEqual(out, { name: 'Ann', email: 'ann@x.io', password: 'password1', university: '', degreeProgram: '' });
  assert.throws(() => inputs.parseRegisterInput(null), HttpError);
  assert.throws(() => inputs.parseRegisterInput({ name: 'A', email: 'a@b.co', password: 'x' }), /8 ta belgi/);
});

test('parseLoginInput requires string credentials', () => {
  assert.deepEqual(inputs.parseLoginInput({ email: ' A@b.co ', password: 'p' }), { email: 'a@b.co', password: 'p' });
  assert.throws(() => inputs.parseLoginInput({ email: { $ne: 1 }, password: 'p' }), HttpError);
});

test('parseProfileInput only returns provided keys', () => {
  assert.deepEqual(inputs.parseProfileInput({}), {});
  const out = inputs.parseProfileInput({ skills: ['a', 'A'], graduationYear: '2027', githubUrl: '' });
  assert.deepEqual(out, { skills: ['a'], graduationYear: 2027, githubUrl: '' });
  assert.throws(() => inputs.parseProfileInput({ name: '  ' }), /kiritilishi shart/);
});

test('parseJobInput fills defaults on create', () => {
  const job = inputs.parseJobInput({ title: 'T', company: 'C', location: 'L', description: 'D' });
  assert.equal(job.type, 'Internship');
  assert.equal(job.workMode, 'On-site');
  assert.equal(job.status, 'open');
  assert.equal(job.featured, false);
  assert.equal(job.accent, '#00638E');
  assert.deepEqual(job.skills, []);
  assert.equal(job.deadline, null);
});

test('parseJobInput rejects bad input and supports partial updates', () => {
  assert.throws(() => inputs.parseJobInput({ title: 'T' }), /Kompaniya kiritilishi shart/);
  assert.throws(() => inputs.parseJobInput({ title: 'T', company: 'C', location: 'L', description: 'D', type: 'Gig' }), /Turi quyidagilardan/);
  assert.throws(() => inputs.parseJobInput({ accent: 'red' }, { partial: true }), /hex/);
  assert.deepEqual(inputs.parseJobInput({}, { partial: true }), {});
  assert.deepEqual(inputs.parseJobInput({ featured: 'true', status: 'closed', accent: '#bfd8e3' }, { partial: true }),
    { featured: true, status: 'closed', accent: '#BFD8E3' });
  assert.throws(() => inputs.parseJobInput({ title: ' ' }, { partial: true }), /kiritilishi shart/);
});

test('parseApplicationInput', () => {
  const body = { jobId: 'j', firstName: 'A', lastName: 'B', phone: '1', email: 'a@b.co', skillLevel: 'Advanced' };
  assert.equal(inputs.parseApplicationInput(body).coverNote, '');
  assert.throws(() => inputs.parseApplicationInput({ ...body, skillLevel: 'Expert' }), /Koʻnikma darajasi/);
  assert.throws(() => inputs.parseApplicationInput({ ...body, phone: '' }), /Telefon raqami kiritilishi shart/);
});
