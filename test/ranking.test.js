const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const R = {};
vm.createContext(R);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/server/Ranking.js'), 'utf8'), R);

const NOW = Date.UTC(2026, 8, 22, 10, 0, 0);
const valid = { name: 'ランタン', score: 1234, result: 'clear', level: 5, seconds: 321 };

test('normalizeEntry keeps a valid entry and stamps the time', () => {
  // Compare via JSON: objects from the vm context have a different prototype.
  assert.equal(JSON.stringify(R.normalizeEntry(valid, NOW)), JSON.stringify({
    name: 'ランタン', score: 1234, result: 'clear', level: 5, seconds: 321, at: '2026-09-22T10:00:00.000Z'
  }));
});

test('names are trimmed, stripped of control characters and cut to 12 characters', () => {
  assert.equal(R.normalizeEntry({ ...valid, name: '  a\u0000b\nc  ' }, NOW).name, 'abc');
  assert.equal(R.normalizeEntry({ ...valid, name: 'あいうえおかきくけこさしすせそ' }, NOW).name, 'あいうえおかきくけこさし');
  assert.equal(R.normalizeEntry({ ...valid, name: '🐉🐉🐉🐉🐉🐉🐉🐉🐉🐉🐉🐉🐉' }, NOW).name.length, 24, '12 emoji (surrogate pairs)');
});

test('empty names are rejected', () => {
  assert.throws(() => R.normalizeEntry({ ...valid, name: '   ' }, NOW), /ニックネーム/);
  assert.throws(() => R.normalizeEntry({ ...valid, name: undefined }, NOW), /ニックネーム/);
});

test('invalid numbers and results are rejected', () => {
  assert.throws(() => R.normalizeEntry({ ...valid, score: -1 }, NOW));
  assert.throws(() => R.normalizeEntry({ ...valid, score: 1.5 }, NOW));
  assert.throws(() => R.normalizeEntry({ ...valid, score: '1e9' }, NOW));
  assert.throws(() => R.normalizeEntry({ ...valid, level: 0 }, NOW));
  assert.throws(() => R.normalizeEntry({ ...valid, seconds: 'abc' }, NOW));
  assert.throws(() => R.normalizeEntry({ ...valid, result: 'win' }, NOW));
  assert.throws(() => R.normalizeEntry(null, NOW));
});

test('ranking orders by score, then time, then earlier submission', () => {
  const e = (name, score, seconds, at) => ({ name, score, seconds, at, result: 'clear', level: 5 });
  const entries = [
    e('slow', 500, 300, '2026-01-01T00:00:00Z'),
    e('top', 900, 100, '2026-01-01T00:00:00Z'),
    e('fast', 500, 200, '2026-01-02T00:00:00Z'),
    e('later', 500, 200, '2026-01-03T00:00:00Z')
  ];
  const result = R.rankEntries(entries, entries[3], 3);
  assert.deepEqual(result.top.map((x) => x.name), ['top', 'fast', 'later']);
  assert.equal(result.rank, 3);
  assert.equal(R.rankEntries(entries, null).rank, null);
  assert.equal(R.rankEntries(entries, entries[0]).rank, 4);
});

test('the default limit is 10', () => {
  const entries = Array.from({ length: 15 }, (_, i) => ({ name: 'p' + i, score: i, seconds: 0, at: 'x' }));
  assert.equal(R.rankEntries(entries).top.length, 10);
  assert.equal(R.rankEntries(entries).top[0].name, 'p14');
});
