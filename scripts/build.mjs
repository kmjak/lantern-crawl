// Builds src/ into build/site/index.html: one self-contained static page for GitHub Pages.
// `<!-- include: name.css -->` / `<!-- include: name.js -->` in index.html are replaced
// by the file's contents, wrapped in <style> / <script>.
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, extname, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = join(rootDir, 'src');
const INCLUDE_RE = /[ \t]*<!--\s*include:\s*([\w.-]+)\s*-->/g;

function wrap(file, content) {
  const tag = extname(file) === '.css' ? 'style' : 'script';
  if (content.includes(`</${tag}`)) {
    throw new Error(`${file} must not contain "</${tag}"`);
  }
  return `<${tag}>\n${content}</${tag}>`;
}

export function build(outDir = join(rootDir, 'build')) {
  rmSync(outDir, { recursive: true, force: true });
  const siteDir = join(outDir, 'site');
  mkdirSync(siteDir, { recursive: true });
  const html = readFileSync(join(srcDir, 'index.html'), 'utf8')
    .replace(INCLUDE_RE, (_, file) => wrap(file, readFileSync(join(srcDir, file), 'utf8')));
  writeFileSync(join(siteDir, 'index.html'), html);
  return outDir;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const out = build();
  console.log(`Built ${out}/site/index.html`);
}
