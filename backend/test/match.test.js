const test = require('node:test');
const assert = require('node:assert/strict');
const { matchScore, matchedSkills } = require('../src/lib/match');

test('matchScore is case-insensitive and proportional', () => {
  assert.equal(matchScore(['flutter', ' DART '], ['Flutter', 'Dart', 'Firebase', 'Git']), 50);
  assert.equal(matchScore(['Flutter', 'Dart', 'Firebase', 'Git'], ['flutter', 'dart']), 100);
  assert.equal(matchScore(['Rust'], ['Flutter', 'Dart']), 0);
});

test('matchScore edge cases', () => {
  assert.equal(matchScore(['Flutter'], []), 50, 'job without skills is neutral');
  assert.equal(matchScore([], ['Flutter']), 0, 'user without skills scores 0');
  assert.equal(matchScore([], []), 50);
  assert.equal(matchScore(undefined, undefined), 50);
  assert.equal(matchScore(['a'], ['A', 'a', 'b']), 50, 'duplicate job skills count once');
  assert.equal(matchScore(['a', 'b', 'c'], ['a', 'b', 'x']), 67);
});

test('matchedSkills keeps job casing and order, de-duplicated', () => {
  assert.deepEqual(matchedSkills(['dart', 'FLUTTER'], ['Flutter', 'Firebase', 'Dart', 'flutter']), ['Flutter', 'Dart']);
  assert.deepEqual(matchedSkills([], ['A']), []);
  assert.deepEqual(matchedSkills(['A'], null), []);
});
