const { test } = require('node:test');
const assert = require('node:assert/strict');
const Game = require('../src/client/game.js');
const { seeded, smallConfig } = require('./helpers.js');

function count(state, pred) {
  return state.cells.filter(pred).length;
}

test('neighbors handles corners, edges and the middle', () => {
  const state = Game.create(smallConfig(4, 3));
  assert.deepEqual(Game.neighbors(state, 0).sort((a, b) => a - b), [1, 4, 5]);
  assert.equal(Game.neighbors(state, 1).length, 5);
  assert.equal(Game.neighbors(state, 5).length, 8);
  assert.equal(Game.neighbors(state, 11).length, 3);
});

test('numbers are the sum of adjacent enemy levels', () => {
  const state = Game.create(smallConfig(3, 3));
  Game.place(state, [2, null, 9, null, null, null, 'potion', null, 3]);
  assert.equal(state.cells[4].number, 14);
  assert.equal(state.cells[1].number, 11);
  assert.equal(state.cells[3].number, 2);
  assert.equal(state.cells[7].number, 3);
  assert.equal(state.cells[6].kind, 'potion');
});

test('the first reveal places contents and keeps its 3x3 area free', () => {
  for (let seed = 1; seed <= 30; seed++) {
    const state = Game.create(undefined, seeded(seed));
    const first = (seed * 7) % state.cells.length;
    Game.reveal(state, first, 1000);
    assert.equal(state.placed, true);
    assert.equal(state.startedAt, 1000);
    [first].concat(Game.neighbors(state, first)).forEach((i) => {
      assert.equal(state.cells[i].kind, 'empty', `seed ${seed}, cell ${i}`);
    });
    assert.equal(state.cells[first].number, 0);
  }
});

test('random layout has the configured number of each item', () => {
  const state = Game.create(undefined, seeded(42));
  Game.reveal(state, 0, 0);
  const c = Game.CONFIG;
  c.enemies.forEach((e) => {
    assert.equal(count(state, (cell) => cell.kind === 'enemy' && cell.level === e.level), e.count);
  });
  assert.equal(count(state, (cell) => cell.kind === 'enemy' && cell.level === c.boss.level), 1);
  assert.equal(count(state, (cell) => cell.kind === 'potion'), c.potion.count);
});

test('same seed gives the same board', () => {
  const a = Game.create(undefined, seeded(7));
  const b = Game.create(undefined, seeded(7));
  Game.reveal(a, 50, 0);
  Game.reveal(b, 50, 0);
  assert.deepEqual(a.cells, b.cells);
});

test('revealing a zero cell flood-fills up to numbered cells', () => {
  // 4x3, one enemy at the right edge of the middle row.
  //  . . . .
  //  . . . E
  //  . . . .
  const state = Game.create(smallConfig(4, 3));
  Game.place(state, [null, null, null, null, null, null, null, 1, null, null, null, null]);
  const events = Game.reveal(state, 0, 0);
  assert.equal(events[0].type, 'reveal');
  assert.deepEqual(events[0].indices.sort((a, b) => a - b), [0, 1, 2, 4, 5, 6, 8, 9, 10]);
  assert.equal(state.cells[7].revealed, false);
  assert.equal(state.cells[3].revealed, false, 'only numbered cells border it');
});

test('revealing a numbered cell reveals only that cell', () => {
  const state = Game.create(smallConfig(4, 3));
  Game.place(state, [null, null, null, null, null, null, null, 1, null, null, null, null]);
  const events = Game.reveal(state, 2, 0);
  assert.deepEqual(events[0].indices, [2]);
});

test('revealing an already revealed cell does nothing', () => {
  const state = Game.create(smallConfig(4, 3));
  Game.place(state, [null, null, null, null, null, null, null, 1, null, null, null, null]);
  Game.reveal(state, 2, 0);
  assert.deepEqual(Game.reveal(state, 2, 0), []);
});
