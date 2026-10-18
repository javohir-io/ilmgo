const test = require('node:test');
const assert = require('node:assert/strict');
const { escapeCell, toCsv } = require('../src/lib/csv');

test('plain values pass through; nullish become empty', () => {
  assert.equal(escapeCell('hello'), 'hello');
  assert.equal(escapeCell(42), '42');
  assert.equal(escapeCell(null), '');
  assert.equal(escapeCell(undefined), '');
});

test('quotes, commas and newlines are escaped', () => {
  assert.equal(escapeCell('a,b'), '"a,b"');
  assert.equal(escapeCell('say "hi"'), '"say ""hi"""');
  assert.equal(escapeCell('line1\nline2'), '"line1\nline2"');
});

test('formula injection is neutralised for strings only', () => {
  for (const evil of ['=SUM(A1)', '+1+1', '-2+3', '@cmd', '\tx', '\rx']) {
    assert.ok(escapeCell(evil).replace(/^"/, '').startsWith("'"), evil);
  }
  assert.equal(escapeCell(-5), '-5');
  assert.equal(escapeCell('=HYPERLINK("x","y")'), `"'=HYPERLINK(""x"",""y"")"`);
});

test('toCsv joins with CRLF and a trailing newline', () => {
  assert.equal(toCsv(['a', 'b'], [[1, 'x,y'], [null, '=1']]), `a,b\r\n1,"x,y"\r\n,'=1\r\n`);
  assert.equal(escapeCell(new Date('2026-01-02T03:04:05Z')), '2026-01-02T03:04:05.000Z');
});
