const { test } = require('node:test');
const assert = require('node:assert/strict');
const Game = require('../src/game.js');
const { smallConfig } = require('./helpers.js');

// 5x1 row board from a layout; the player's stats can be overridden.
function board(layout, player) {
  const state = Game.create(smallConfig(layout.length, 1));
  Game.place(state, layout);
  Object.assign(state.player, player || {});
  state.startedAt = 0;
  return state;
}

function types(events) {
  return events.map((e) => e.type);
}

test('combat: enemies at or below the player level cost no HP', () => {
  assert.deepEqual(Game.combat(1, 1), { rounds: 1, damage: 0 });
  assert.deepEqual(Game.combat(3, 2), { rounds: 1, damage: 0 });
  assert.deepEqual(Game.combat(1, 2), { rounds: 2, damage: 2 });
  assert.deepEqual(Game.combat(1, 3), { rounds: 3, damage: 6 });
  assert.deepEqual(Game.combat(2, 5), { rounds: 3, damage: 10 });
  assert.deepEqual(Game.combat(5, 9), { rounds: 2, damage: 9 });
});

test('max HP grows with level', () => {
  assert.equal(Game.maxHp(Game.CONFIG, 1), 8);
  assert.equal(Game.maxHp(Game.CONFIG, 5), 16);
});

test('defeating an enemy gives XP and reveals it', () => {
  const state = board([null, null, 2, null, null], { level: 2 });
  const events = Game.reveal(state, 2, 0);
  assert.deepEqual(types(events), ['combat', 'reveal']);
  assert.equal(events[0].won, true);
  assert.equal(state.player.xp, 2);
  assert.equal(state.cells[2].revealed, true);
  assert.equal(state.cells[2].done, true);
});

test('taking damage from a stronger enemy', () => {
  const state = board([null, null, 2, null, null]);
  Game.reveal(state, 2, 0);
  assert.equal(state.player.hp, 6);
});

test('defeating an enemy whose number is 0 flood-fills around it', () => {
  const state = board([null, null, 1, null, null]);
  const events = Game.reveal(state, 2, 0);
  // cell 2 has number 0 (no enemy neighbors); its neighbors show 1.
  assert.deepEqual(events[1].indices.sort(), [1, 2, 3]);
});

test('level up raises max HP and HP by the same amount', () => {
  const state = board([null, 4, null], { level: 4, xp: 36, maxHp: 14, hp: 5 });
  const events = Game.reveal(state, 1, 0);
  assert.deepEqual(types(events), ['combat', 'levelup', 'reveal']);
  assert.equal(state.player.level, 5);
  assert.equal(state.player.maxHp, 16);
  assert.equal(state.player.hp, 7);
});

test('several levels can be gained at once and the level is capped', () => {
  const state = board([null, 5, null], { level: 5, xp: 38 });
  Game.reveal(state, 1, 0);
  assert.equal(state.player.level, 5);
  const low = board([null, 1, null], { xp: 11 });
  const events = Game.reveal(low, 1, 0);
  assert.deepEqual(types(events), ['combat', 'levelup', 'levelup', 'reveal']);
  assert.equal(low.player.level, 3);
});

test('potions heal up to max HP and are consumed once', () => {
  const state = board(['potion', null, null, null, 1], { hp: 2 });
  let events = Game.reveal(state, 0, 0);
  assert.deepEqual(events.find((e) => e.type === 'potion'), { type: 'potion', index: 0, heal: 4 });
  assert.equal(state.player.hp, 6);
  const full = board(['potion', null, null, null, 1], { hp: 7 });
  events = Game.reveal(full, 0, 0);
  assert.equal(events.find((e) => e.type === 'potion').heal, 1);
  assert.equal(full.player.hp, 8);
});

test('potions revealed by flood fill are consumed automatically', () => {
  const state = board([null, null, 'potion', null, null, 1], { hp: 1 });
  const events = Game.reveal(state, 0, 0);
  assert.ok(events.some((e) => e.type === 'potion' && e.index === 2));
  assert.equal(state.player.hp, 5);
});

test('game over when HP reaches 0; no more reveals', () => {
  const state = board([null, 5, null]);
  const events = Game.reveal(state, 1, 3000);
  assert.deepEqual(types(events), ['combat', 'reveal', 'gameover']);
  assert.equal(state.status, 'gameover');
  assert.equal(state.player.hp, 0);
  assert.equal(state.endedAt, 3000);
  assert.deepEqual(Game.reveal(state, 0, 4000), []);
});

test('defeating the boss clears the game', () => {
  const state = board([null, 9, null], { level: 5, hp: 16, maxHp: 16, xp: 40 });
  const events = Game.reveal(state, 1, 5000);
  assert.deepEqual(types(events), ['combat', 'reveal', 'clear']);
  assert.equal(state.status, 'cleared');
  assert.equal(state.player.hp, 7);
  assert.equal(state.player.xp, 40, 'the boss gives no XP');
});

test('score: XP only on game over; clear adds bonus, HP and time', () => {
  const lost = board([null, 5, null], { xp: 3 });
  Game.reveal(lost, 1, 1000);
  assert.equal(Game.score(lost), 30);

  const won = board([null, 9, null], { level: 5, hp: 16, maxHp: 16, xp: 50 });
  Game.reveal(won, 1, 100 * 1000);
  // 50*10 + 1000 + 7*20 + (600 - 100)
  assert.equal(Game.score(won), 500 + 1000 + 140 + 500);
});

test('elapsed seconds stop when the game ends', () => {
  const state = board([null, 5, null]);
  state.startedAt = 1000;
  assert.equal(Game.elapsedSeconds(state, 3500), 2);
  Game.reveal(state, 1, 11000);
  assert.equal(Game.elapsedSeconds(state, 99000), 10);
});

test('the default config is clearable', () => {
  const c = Game.CONFIG;
  const levelXp = c.player.levelXp;
  const maxLevel = levelXp.length - 1;
  const totalXp = c.enemies.reduce((sum, e) => sum + e.level * e.count, 0);
  assert.ok(totalXp >= levelXp[maxLevel], `total XP ${totalXp} reaches max level`);
  assert.ok(Game.combat(maxLevel, c.boss.level).damage < Game.maxHp(c, maxLevel), 'max level survives the boss');
  assert.equal(Game.enemyName(c, 9), '深淵の主');
  assert.equal(Game.enemyName(c, 3), 'ドクグモ');
});
