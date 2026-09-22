// Builds src/ into:
//   build/gas/   clasp rootDir. Client .css/.js are wrapped into .html partials,
//                because GAS HtmlService only serves .html files.
//   build/local/ a single self-contained index.html for offline preview,
//                with google.script.run stubbed by localStorage.
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync, copyFileSync } from 'node:fs';
import { join, extname, basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = join(rootDir, 'src');
const INCLUDE_RE = /<\?!=\s*include\('([\w-]+)'\)\s*\?>/g;

function wrap(file, content) {
  const ext = extname(file);
  const tag = ext === '.css' ? 'style' : ext === '.js' ? 'script' : null;
  if (!tag) return content;
  if (content.includes(`</${tag}`)) {
    throw new Error(`${file} must not contain "</${tag}"`);
  }
  return `<${tag}>\n${content}</${tag}>\n`;
}

// name (without extension) -> HTML partial content, for every client file.
function clientPartials() {
  const partials = {};
  for (const file of readdirSync(join(srcDir, 'client'))) {
    const content = readFileSync(join(srcDir, 'client', file), 'utf8');
    partials[basename(file, extname(file))] = wrap(file, content);
  }
  return partials;
}

function buildGas(outDir, partials) {
  mkdirSync(outDir, { recursive: true });
  copyFileSync(join(srcDir, 'appsscript.json'), join(outDir, 'appsscript.json'));
  for (const file of readdirSync(join(srcDir, 'server'))) {
    copyFileSync(join(srcDir, 'server', file), join(outDir, file));
  }
  for (const [name, content] of Object.entries(partials)) {
    writeFileSync(join(outDir, `${name}.html`), content);
  }
}

function buildLocal(outDir, partials) {
  mkdirSync(outDir, { recursive: true });
  // Server-side ranking rules are shared with the stub, so validation matches GAS.
  const stub = wrap('stub.js', [
    readFileSync(join(srcDir, 'server', 'Ranking.js'), 'utf8'),
    readFileSync(join(rootDir, 'scripts', 'local-stub.js'), 'utf8')
  ].join('\n'));
  const head = '<meta name="viewport" content="width=device-width, initial-scale=1">\n' + stub;
  const html = partials.index
    .replace(INCLUDE_RE, (_, name) => {
      if (!(name in partials)) throw new Error(`include('${name}'): no such client file`);
      return partials[name];
    })
    .replace('</head>', `${head}</head>`);
  writeFileSync(join(outDir, 'index.html'), html);
}

export function build(outDir = join(rootDir, 'build')) {
  rmSync(outDir, { recursive: true, force: true });
  const partials = clientPartials();
  buildGas(join(outDir, 'gas'), partials);
  buildLocal(join(outDir, 'local'), partials);
  return outDir;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const out = build();
  console.log(`Built ${out}/gas and ${out}/local/index.html`);
}
