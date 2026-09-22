const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Loads the server files with in-memory fakes of the GAS services.
function server() {
  const props = {};
  const spreadsheets = {};
  const lock = { held: 0, waitLock() { this.held++; }, releaseLock() { this.held--; } };
  const ctx = {
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (k) => (k in props ? props[k] : null),
        setProperty: (k, v) => { props[k] = v; }
      })
    },
    LockService: { getScriptLock: () => lock },
    SpreadsheetApp: {
      create(name) {
        const id = 'sheet' + Object.keys(spreadsheets).length;
        const rows = [];
        const sheet = {
          rows,
          appendRow: (row) => rows.push(row.map((v) => (typeof v === 'string' && v[0] === "'" ? v.slice(1) : v))),
          getDataRange: () => ({ getValues: () => rows.map((r) => r.slice()) })
        };
        spreadsheets[id] = { name, sheet, getId: () => id, getSheets: () => [sheet] };
        return spreadsheets[id];
      },
      openById: (id) => spreadsheets[id]
    }
  };
  vm.createContext(ctx);
  for (const file of ['Ranking.js', 'Code.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/server', file), 'utf8'), ctx);
  }
  return { ctx, props, spreadsheets, lock };
}

const entry = (name, score) => ({ name, score, result: 'gameover', level: 2, seconds: 60 });

test('getRanking returns [] and creates nothing before the first submission', () => {
  const s = server();
  assert.equal(JSON.stringify(s.ctx.getRanking()), '[]');
  assert.equal(Object.keys(s.spreadsheets).length, 0);
});

test('submitScore creates the sheet once and returns the rank', () => {
  const s = server();
  let r = s.ctx.submitScore(entry('a', 100));
  assert.equal(r.rank, 1);
  r = s.ctx.submitScore(entry('b', 300));
  assert.equal(r.rank, 1);
  r = s.ctx.submitScore(entry('c', 200));
  assert.equal(r.rank, 2);
  assert.equal(Object.keys(s.spreadsheets).length, 1);
  assert.equal(s.props.RANKING_SHEET_ID, 'sheet0');
  assert.equal(s.spreadsheets.sheet0.sheet.rows[0].join(), 'name,score,result,level,seconds,at');
  assert.equal(s.ctx.getRanking().map((e) => e.name).join(), 'b,c,a');
  assert.equal(s.lock.held, 0, 'lock released');
});

test('formula-like names are stored as text', () => {
  const s = server();
  const appended = [];
  s.ctx.submitScore(entry('ok', 1));
  const sheet = s.spreadsheets.sheet0.sheet;
  const original = sheet.appendRow;
  sheet.appendRow = (row) => { appended.push(row); original(row); };
  s.ctx.submitScore(entry('=IMAGE("x")', 5));
  s.ctx.submitScore(entry('-1+2', 4));
  assert.equal(appended[0][0], '\'=IMAGE("x")');
  assert.equal(appended[1][0], "'-1+2");
  assert.equal(s.ctx.getRanking()[0].name, '=IMAGE("x")');
});

test('invalid input is rejected before touching the sheet, and the lock is not held', () => {
  const s = server();
  assert.throws(() => s.ctx.submitScore(entry('', 1)), /ニックネーム/);
  assert.equal(Object.keys(s.spreadsheets).length, 0);
  assert.equal(s.lock.held, 0);
});
