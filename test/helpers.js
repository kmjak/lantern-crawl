// Deterministic PRNG (mulberry32) for reproducible boards.
exports.seeded = function (seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

// Small board config for hand-written layouts.
exports.smallConfig = function (cols, rows) {
  return {
    cols: cols,
    rows: rows,
    enemies: [{ level: 1, count: 0, name: 'L1' }],
    boss: { level: 9, name: 'Boss' },
    potion: { count: 0, heal: 4 }
  };
};
