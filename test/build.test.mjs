import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { build } from '../scripts/build.mjs';

const out = build(mkdtempSync(join(tmpdir(), 'lantern-build-')));
const html = readFileSync(join(out, 'site', 'index.html'), 'utf8');

test('the site is a single self-contained page', () => {
  assert.deepEqual(readdirSync(join(out, 'site')), ['index.html']);
  assert.doesNotMatch(html, /<!--\s*include:/, 'every include is resolved');
  assert.match(html, /<style>/);
  assert.match(html, /var Game = \{\}/, 'game logic is inlined');
  assert.match(html, /name="viewport"/);
});

test('client code is inlined in order: logic before UI', () => {
  assert.ok(html.indexOf('var Game = {}') < html.indexOf('DOM rendering'), 'game.js comes before ui.js');
});
