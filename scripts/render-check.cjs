// Durable coverage check: every component in data/components.json gets a
// gallery card, and every live demo renders without throwing.
// Run: npm run check:coverage (needs site/node_modules installed).
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const SITE = path.join(ROOT, 'site');

execSync(
  `${path.join(SITE, 'node_modules', '.bin', 'esbuild')} src/explorer.jsx --bundle --platform=node --format=cjs --outfile=/tmp/bongdesign-explorer.ssr.cjs --external:react --external:react-dom --loader:.scss=empty --loader:.css=empty`,
  { cwd: SITE, stdio: 'pipe' }
);

process.env.NODE_PATH = path.join(SITE, 'node_modules');
require('module').Module._initPaths();
const React = require(path.join(SITE, 'node_modules', 'react', 'index.js'));
const { renderToString } = require(path.join(
  SITE,
  'node_modules',
  'react-dom',
  'server.node.js'
));
const { componentCards } = require('/tmp/bongdesign-explorer.ssr.cjs');
const index = require(path.join(ROOT, 'data', 'components.json')).components;
const guidelines = require(path.join(ROOT, 'data', 'guidelines.json'));

const slugs = [...new Set(index.map((c) => c.doc).filter(Boolean))];
const noEntry = slugs.filter((s) => !guidelines[s]);
if (noEntry.length > 0) {
  console.error('Missing guidelines entries for: ' + JSON.stringify(noEntry));
  process.exit(1);
}

const { cards } = componentCards();
const missing = index.map((c) => c.name).filter((n) => !cards.some((c) => c.name === n));
if (missing.length > 0) {
  console.error('Missing gallery cards for: ' + JSON.stringify(missing));
  process.exit(1);
}

const bad = [];
for (const c of cards) {
  if (!c.live) continue;
  try {
    renderToString(React.createElement(React.Fragment, null, c.demo));
  } catch (e) {
    bad.push(c.name + ' :: ' + e.message.split('\n')[0]);
  }
}
if (bad.length > 0) {
  console.error('Render failures:\n' + bad.join('\n'));
  process.exit(1);
}
console.log(
  `OK: ${cards.length} cards, ${cards.filter((c) => c.live).length} live demos, 0 missing, 0 render failures.`
);
