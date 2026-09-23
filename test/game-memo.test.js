const { test } = require('node:test');
const assert = require('node:assert/strict');
const Game = require('../src/game.js');
const { smallConfig } = require('./helpers.js');

test('memo cycles through levels, ? and back to none', () => {
  const state = Game.create(smallConfig(3, 1));
  const seen = [];
  for (let i = 0; i < Game.MEMOS.length; i++) seen.push(Game.cycleMemo(state, 1));
  assert.deepEqual(seen, [1, 2, 3, 4, 5, 9, '?', null]);
});

test('memo works before the first reveal and is ignored on revealed cells', () => {
  const state = Game.create(smallConfig(3, 1));
  assert.equal(Game.cycleMemo(state, 2), 1);
  Game.place(state, [null, null, null]);
  Game.reveal(state, 0, 0);
  assert.equal(state.cells[2].revealed, true);
  assert.equal(Game.cycleMemo(state, 2), null);
});

test('a memo does not block revealing the cell', () => {
  const state = Game.create(smallConfig(3, 1));
  Game.place(state, [null, 1, null]);
  Game.cycleMemo(state, 1);
  const events = Game.reveal(state, 1, 0);
  assert.equal(events[0].type, 'combat');
});
