// Durable coverage check: every component in data/components.json gets a
// card in the gallery, and every live demo renders without throwing.
// Run: npm run check:coverage (needs site/node_modules installed).
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const SITE = path.join(ROOT, 'site');

execSync(
  `${path.join(SITE, 'node_modules', '.bin', 'esbuild')} src/App.jsx --bundle --platform=node --format=cjs --outfile=/tmp/bongdesign-app.ssr.cjs --external:react --external:react-dom --loader:.scss=empty --loader:.css=empty`,
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
const App = require('/tmp/bongdesign-app.ssr.cjs').default;
const index = require(path.join(ROOT, 'data', 'components.json')).components;

const html = renderToString(React.createElement(App));
const names = [...html.matchAll(/data-demo="([^"]+)"/g)].map((m) => m[1]);
const missing = index.map((c) => c.name).filter((n) => !names.includes(n));
if (missing.length > 0) {
  console.error('Missing gallery cards for: ' + JSON.stringify(missing));
  process.exit(1);
}
console.log(`OK: ${names.length} cards, 0 missing, 0 render failures.`);
