/**
 * Pure game logic (no DOM). Loaded as a <script> in the browser (exposes `Game`)
 * and via require() in Node tests.
 *
 * Rules: docs/context/game-design.md
 */
(function (root) {
  var Game = {};

  Game.CONFIG = {
    cols: 12,
    rows: 12,
    // XP is equal to the enemy level.
    enemies: [
      { level: 1, count: 8, name: 'コケムシ' },
      { level: 2, count: 6, name: 'ヤミネズミ' },
      { level: 3, count: 5, name: 'ドクグモ' },
      { level: 4, count: 4, name: 'イワオニ' },
      { level: 5, count: 3, name: 'カゲキシ' }
    ],
    boss: { level: 9, name: '深淵の主' },
    potion: { count: 4, heal: 4 }
  };

  /** Creates a new game. Contents are placed on the first reveal. */
  Game.create = function (config, rng) {
    config = config || Game.CONFIG;
    var cells = [];
    for (var i = 0; i < config.cols * config.rows; i++) {
      cells.push({ kind: 'empty', level: 0, number: 0, revealed: false, memo: null });
    }
    return {
      config: config,
      rng: rng || Math.random,
      cols: config.cols,
      rows: config.rows,
      cells: cells,
      placed: false,
      status: 'playing', // 'playing' | 'cleared' | 'gameover'
      startedAt: null,
      endedAt: null
    };
  };

  Game.neighbors = function (state, index) {
    var x = index % state.cols;
    var y = Math.floor(index / state.cols);
    var result = [];
    for (var dy = -1; dy <= 1; dy++) {
      for (var dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        var nx = x + dx;
        var ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= state.cols || ny >= state.rows) continue;
        result.push(ny * state.cols + nx);
      }
    }
    return result;
  };

  /**
   * Places contents from a layout: an array (one entry per cell) of
   * null (empty), 'potion', or an enemy level number. Then computes numbers.
   */
  Game.place = function (state, layout) {
    state.cells.forEach(function (cell, i) {
      var item = layout[i];
      if (typeof item === 'number') {
        cell.kind = 'enemy';
        cell.level = item;
      } else if (item === 'potion') {
        cell.kind = 'potion';
      }
    });
    state.cells.forEach(function (cell, i) {
      cell.number = Game.neighbors(state, i).reduce(function (sum, n) {
        var other = state.cells[n];
        return sum + (other.kind === 'enemy' ? other.level : 0);
      }, 0);
    });
    state.placed = true;
  };

  /** Random layout that keeps `safeIndex` and its neighbors free. */
  Game.randomLayout = function (state, safeIndex) {
    var config = state.config;
    var items = [];
    config.enemies.forEach(function (e) {
      for (var k = 0; k < e.count; k++) items.push(e.level);
    });
    items.push(config.boss.level);
    for (var p = 0; p < config.potion.count; p++) items.push('potion');

    var safe = [safeIndex].concat(Game.neighbors(state, safeIndex));
    var free = [];
    for (var i = 0; i < state.cells.length; i++) {
      if (safe.indexOf(i) < 0) free.push(i);
    }
    for (var j = free.length - 1; j > 0; j--) {
      var r = Math.floor(state.rng() * (j + 1));
      var tmp = free[j];
      free[j] = free[r];
      free[r] = tmp;
    }
    var layout = state.cells.map(function () { return null; });
    items.forEach(function (item, k) { layout[free[k]] = item; });
    return layout;
  };

  // Reveals `start` and flood-fills through cells whose number is 0.
  // Returns the revealed indices.
  function floodReveal(state, start) {
    var revealed = [];
    var queue = [start];
    while (queue.length) {
      var i = queue.shift();
      var cell = state.cells[i];
      if (cell.revealed) continue;
      cell.revealed = true;
      revealed.push(i);
      if (cell.number !== 0) continue;
      Game.neighbors(state, i).forEach(function (n) {
        if (!state.cells[n].revealed && queue.indexOf(n) < 0) queue.push(n);
      });
    }
    return revealed;
  }

  /**
   * Reveals a cell. `now` is a timestamp in ms.
   * Returns a list of events describing what happened.
   */
  Game.reveal = function (state, index, now) {
    var cell = state.cells[index];
    if (state.status !== 'playing' || !cell || cell.revealed) return [];
    if (!state.placed) {
      Game.place(state, Game.randomLayout(state, index));
      state.startedAt = now;
    }
    var events = [];
    if (cell.kind === 'enemy') {
      return events;
    }
    events.push({ type: 'reveal', indices: floodReveal(state, index) });
    return events;
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Game;
  } else {
    root.Game = Game;
  }
})(this);
