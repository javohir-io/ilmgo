const test = require('node:test');
const assert = require('node:assert/strict');
const { profileCompleteness } = require('../src/lib/completeness');

test('empty and null profiles score 0', () => {
  assert.equal(profileCompleteness(null), 0);
  assert.equal(profileCompleteness({ name: '', skills: [] }), 0);
});

test('a full profile scores 100', () => {
  assert.equal(profileCompleteness({
    name: 'A', profilePhotoUrl: '/uploads/images/x.png', university: 'U', degreeProgram: 'D',
    about: 'hi', skills: ['x'], phone: '1', githubUrl: 'https://github.com/a', linkedinUrl: '', graduationYear: 2027,
  }), 100);
});

test('partial profiles are weighted', () => {
  assert.equal(profileCompleteness({ name: 'A', skills: ['x'] }), 30);
  assert.equal(profileCompleteness({ name: 'A', linkedinUrl: 'https://l.in/a' }), 20);
  assert.equal(profileCompleteness({ name: '  ', about: '   ' }), 0);
});
