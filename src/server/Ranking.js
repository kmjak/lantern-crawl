/**
 * Ranking rules shared by the GAS server, the local preview and Node tests.
 * No GAS APIs here.
 */
var RANKING_LIMIT = 10;
var NAME_MAX_LENGTH = 12;

function toInt_(value, min, max, label) {
  var n = Number(value);
  if (!Number.isInteger(n) || n < min || n > max) {
    throw new Error('不正な値です: ' + label);
  }
  return n;
}

/** Validates and cleans a submitted entry. Throws on invalid input. */
function normalizeEntry(input, now) {
  input = input || {};
  var name = Array.from(String(input.name == null ? '' : input.name)
    .replace(/[\u0000-\u001f\u007f-\u009f]/g, '')
    .trim()).slice(0, NAME_MAX_LENGTH).join('').trim();
  if (!name) throw new Error('ニックネームを入力してください');
  if (input.result !== 'clear' && input.result !== 'gameover') {
    throw new Error('不正な値です: result');
  }
  return {
    name: name,
    score: toInt_(input.score, 0, 100000, 'score'),
    result: input.result,
    level: toInt_(input.level, 1, 99, 'level'),
    seconds: toInt_(input.seconds, 0, 86400, 'seconds'),
    at: new Date(now).toISOString()
  };
}

function compareEntries(a, b) {
  return (b.score - a.score) || (a.seconds - b.seconds) || (a.at < b.at ? -1 : a.at > b.at ? 1 : 0);
}

/**
 * Sorts entries and returns the top `limit` entries, plus the 1-based rank of
 * `entry` (null when not given).
 */
function rankEntries(entries, entry, limit) {
  var sorted = entries.slice().sort(compareEntries);
  return {
    rank: entry ? sorted.indexOf(entry) + 1 : null,
    top: sorted.slice(0, limit || RANKING_LIMIT)
  };
}
