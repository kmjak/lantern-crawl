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
    potion: { count: 4, heal: 4 },
    player: {
      baseHp: 6,
      hpPerLevel: 2,
      // levelXp[L] = total XP needed to reach level L. The last entry is the max level.
      levelXp: [0, 0, 4, 12, 24, 40]
    },
    score: { xp: 10, clear: 1000, hp: 20, timeLimitSeconds: 600 }
  };

  Game.maxHp = function (config, level) {
    return config.player.baseHp + config.player.hpPerLevel * level;
  };

  /**
   * The player (attack = level) strikes first; the enemy has HP and attack equal to its level.
   * Returns the rounds needed to win and the damage the player takes.
   */
  Game.combat = function (playerLevel, enemyLevel) {
    var rounds = Math.ceil(enemyLevel / playerLevel);
    return { rounds: rounds, damage: enemyLevel * (rounds - 1) };
  };

  Game.enemyName = function (config, level) {
    if (level === config.boss.level) return config.boss.name;
    var enemy = config.enemies.filter(function (e) { return e.level === level; })[0];
    return enemy ? enemy.name : '';
  };

  /** Creates a new game. Contents are placed on the first reveal. */
  Game.create = function (config, rng) {
    config = config || Game.CONFIG;
    var cells = [];
    for (var i = 0; i < config.cols * config.rows; i++) {
      // `done` marks a defeated enemy or a consumed potion.
      cells.push({ kind: 'empty', level: 0, number: 0, revealed: false, done: false, memo: null });
    }
    return {
      config: config,
      rng: rng || Math.random,
      cols: config.cols,
      rows: config.rows,
      cells: cells,
      player: { level: 1, xp: 0, hp: Game.maxHp(config, 1), maxHp: Game.maxHp(config, 1) },
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

  function end(state, status, now) {
    state.status = status;
    state.endedAt = now;
  }

  function gainXp(state, xp, events) {
    var player = state.player;
    var levelXp = state.config.player.levelXp;
    player.xp += xp;
    while (player.level < levelXp.length - 1 && player.xp >= levelXp[player.level + 1]) {
      player.level++;
      var maxHp = Game.maxHp(state.config, player.level);
      player.hp += maxHp - player.maxHp;
      player.maxHp = maxHp;
      events.push({ type: 'levelup', level: player.level });
    }
  }

  function consumePotions(state, indices, events) {
    var player = state.player;
    indices.forEach(function (i) {
      var cell = state.cells[i];
      if (cell.kind !== 'potion' || cell.done) return;
      cell.done = true;
      var heal = Math.min(state.config.potion.heal, player.maxHp - player.hp);
      player.hp += heal;
      events.push({ type: 'potion', index: i, heal: heal });
    });
  }

  function fight(state, index, now, events) {
    var cell = state.cells[index];
    var player = state.player;
    var result = Game.combat(player.level, cell.level);
    player.hp = Math.max(0, player.hp - result.damage);
    var won = player.hp > 0;
    events.push({ type: 'combat', index: index, level: cell.level, damage: result.damage, won: won });
    if (!won) {
      cell.revealed = true;
      events.push({ type: 'reveal', indices: [index] });
      end(state, 'gameover', now);
      events.push({ type: 'gameover' });
      return;
    }
    cell.done = true;
    if (cell.level === state.config.boss.level) {
      cell.revealed = true;
      events.push({ type: 'reveal', indices: [index] });
      end(state, 'cleared', now);
      events.push({ type: 'clear' });
      return;
    }
    gainXp(state, cell.level, events);
    var revealed = floodReveal(state, index);
    events.push({ type: 'reveal', indices: revealed });
    consumePotions(state, revealed, events);
  }

  /**
   * Reveals a cell. `now` is a timestamp in ms.
   * Returns a list of events describing what happened:
   *   { type: 'reveal', indices }, { type: 'potion', index, heal },
   *   { type: 'combat', index, level, damage, won }, { type: 'levelup', level },
   *   { type: 'clear' }, { type: 'gameover' }
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
      fight(state, index, now, events);
      return events;
    }
    var revealed = floodReveal(state, index);
    events.push({ type: 'reveal', indices: revealed });
    consumePotions(state, revealed, events);
    return events;
  };

  Game.MEMOS = [null, 1, 2, 3, 4, 5, 9, '?'];

  /** Cycles the memo on a hidden cell. Returns the new memo. */
  Game.cycleMemo = function (state, index) {
    var cell = state.cells[index];
    if (state.status !== 'playing' || !cell || cell.revealed) return null;
    var next = (Game.MEMOS.indexOf(cell.memo) + 1) % Game.MEMOS.length;
    cell.memo = Game.MEMOS[next];
    return cell.memo;
  };

  /** Whole seconds since the first reveal, until the game ended (or `now`). */
  Game.elapsedSeconds = function (state, now) {
    if (state.startedAt === null) return 0;
    var until = state.endedAt !== null ? state.endedAt : now;
    return Math.max(0, Math.floor((until - state.startedAt) / 1000));
  };

  /** Score of a finished game. */
  Game.score = function (state) {
    var s = state.config.score;
    var score = state.player.xp * s.xp;
    if (state.status === 'cleared') {
      var seconds = Game.elapsedSeconds(state, state.endedAt);
      score += s.clear + state.player.hp * s.hp + Math.max(0, s.timeLimitSeconds - seconds);
    }
    return score;
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Game;
  } else {
    root.Game = Game;
  }
})(this);
