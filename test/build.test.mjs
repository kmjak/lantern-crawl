import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { build } from '../scripts/build.mjs';

const out = build(mkdtempSync(join(tmpdir(), 'lantern-build-')));

test('gas build has manifest, server code and html partials only', () => {
  const files = readdirSync(join(out, 'gas')).sort();
  assert.deepEqual(files, ['Code.js', 'Ranking.js', 'appsscript.json', 'game.html', 'index.html', 'style.html', 'ui.html']);
  assert.match(readFileSync(join(out, 'gas', 'style.html'), 'utf8'), /^<style>/);
  assert.match(readFileSync(join(out, 'gas', 'game.html'), 'utf8'), /^<script>/);
  assert.match(readFileSync(join(out, 'gas', 'index.html'), 'utf8'), /include\('game'\)/);
});

test('local build is one self-contained html file', () => {
  const html = readFileSync(join(out, 'local', 'index.html'), 'utf8');
  assert.doesNotMatch(html, /<\?/);
  assert.match(html, /name="viewport"/);
  assert.match(html, /window\.google = /);
  assert.ok(html.indexOf('window.google = ') < html.indexOf('var Game = {}'), 'stub loads before client code');
});
