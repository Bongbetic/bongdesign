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
require(path.join(ROOT, 'scripts', 'validate-data.cjs'))();
const index = require(path.join(ROOT, 'data', 'components.json')).components;
const guidelines = require(path.join(ROOT, 'data', 'guidelines.json'));

const slugs = [...new Set(index.map((c) => c.doc).filter(Boolean))];
const names = [...new Set(index.map((c) => c.name))];
const byDoc = Object.fromEntries(index.map((c) => [c.name, c.doc]));
const noEntry = slugs
  .filter((s) => !guidelines[s])
  .concat(names.filter((n) => !guidelines[n] && !guidelines[byDoc[n]]));
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

// Phase 2 (T05): routed pages — every route renders inside the shell.
// The App entry must export the route registry (ROUTES, matchRoute) and an
// SSR entry (AppForPath) that renders a path inside the Carbon shell.
const appBundle = '/tmp/bongdesign-app.ssr.cjs';
try {
  execSync(
    `${path.join(SITE, 'node_modules', '.bin', 'esbuild')} src/App.jsx --bundle --platform=node --format=cjs --outfile=${appBundle} --external:react --external:react-dom --loader:.scss=empty --loader:.css=empty`,
    { cwd: SITE, stdio: 'pipe' }
  );
} catch (e) {
  console.error('Routes bundle failed: src/App.jsx must export the routed shell.');
  process.exit(1);
}
let app;
try {
  app = require(appBundle);
} catch (e) {
  console.error('Routes bundle unloadable: ' + e.message.split('\n')[0]);
  process.exit(1);
}
const routeFails = [];
function routeCheck(label, ok, detail) {
  if (!ok) routeFails.push(label + (detail ? ' :: ' + detail : ''));
}
routeCheck('matchRoute is exported', typeof app.matchRoute === 'function');
routeCheck('ROUTES registry is exported', Array.isArray(app.ROUTES));
routeCheck('AppForPath SSR entry is exported', typeof app.AppForPath === 'function');
if (typeof app.matchRoute === 'function') {
  const cases = [
    ['/', 'home', {}],
    ['/components', 'components', {}],
    ['/components/button', 'component', { name: 'button' }],
    ['/foundations/color', 'foundations', { slug: 'color' }],
    ['/no-such-page', 'notfound', {}],
  ];
  for (const [p, id, params] of cases) {
    let got;
    try {
      got = app.matchRoute(p);
    } catch (e) {
      got = null;
    }
    routeCheck(
      `matchRoute('${p}') is ${id}`,
      got && got.id === id && Object.entries(params).every(([k, v]) => got.params && got.params[k] === v),
      'got ' + JSON.stringify(got)
    );
  }
  routeCheck(
    "matchRoute strips query and trailing slash",
    (() => {
      const got = app.matchRoute('/components/?q=modal');
      return got && got.id === 'components';
    })()
  );
}
if (Array.isArray(app.ROUTES)) {
  const paths = app.ROUTES.map((r) => r.path);
  for (const p of ['/', '/components', '/components/:name', '/foundations/:slug']) {
    routeCheck(`ROUTES registers '${p}'`, paths.includes(p), 'got ' + JSON.stringify(paths));
  }
}
function ssr(pathname) {
  return renderToString(React.createElement(app.AppForPath, { path: pathname }));
}
if (typeof app.AppForPath === 'function') {
  const pages = [
    ['/', ['bong-masthead', 'pinned to upstream Carbon', '/mcp', 'Building blocks', 'aria-current="page"']],
    ['/components', ['bong-masthead', 'All components', 'Filter components', 'aria-current="page"']],
    ['/foundations/color', ['bong-masthead', 'Palettes', 'aria-current="page"']],
    ['/no-such-page', ['bong-masthead']],
  ];
  for (const [p, markers] of pages) {
    let html;
    try {
      html = ssr(p);
    } catch (e) {
      routeCheck(`SSR renders '${p}'`, false, e.message.split('\n')[0]);
      continue;
    }
    for (const m of markers) {
      routeCheck(`'${p}' renders marker '${m}'`, html.includes(m), 'missing from SSR html');
    }
  }
  let missing;
  try {
    missing = ssr('/no-such-page').toLowerCase();
  } catch (e) {
    missing = '';
  }
  routeCheck("unknown path renders a not-found page", missing.includes('not found'), 'no not-found copy');
}

// Phase 3 (T06): components overview card grid + per-component pages.
// Acceptance: (1) searchable grid where every card opens its component
// page; (2) all 147 component URLs render four tabs + props/code-only;
// (3) Button page matches the prototype screen in layout/flow/copy.
if (typeof app.AppForPath === 'function') {
  let overview = '';
  try {
    overview = ssr('/components');
  } catch (e) {
    routeCheck("overview SSR renders '/components'", false, e.message.split('\n')[0]);
  }
  if (overview) {
    routeCheck('overview has a search filter', /filter components/i.test(overview), 'no filter input');
    const unlinked = index
      .map((c) => c.name)
      .filter((n) => !overview.includes('/components/' + n.toLowerCase()));
    routeCheck(
      'every overview card opens its component page',
      unlinked.length === 0,
      unlinked.length ? 'unlinked: ' + JSON.stringify(unlinked.slice(0, 8)) : ''
    );
  }
  const TAB_MARKERS = ['Guidelines', 'Specifications', 'Code', 'Accessibility'];
  const pageFails = [];
  for (const entry of index) {
    const url = '/components/' + entry.name.toLowerCase();
    let html;
    try {
      html = ssr(url);
    } catch (e) {
      pageFails.push(url + ' SSR threw: ' + e.message.split('\n')[0]);
      continue;
    }
    if (html.includes('Component not found')) {
      pageFails.push(url + ' renders not-found');
      continue;
    }
    for (const t of TAB_MARKERS) {
      if (!html.includes(t)) {
        pageFails.push(url + ' missing tab ' + t);
        break;
      }
    }
    if (!html.includes('Prop') && !html.includes('No documented props')) {
      pageFails.push(url + ' missing props table');
    }
    if (!html.includes('bong-demo-row') && !/code only|see code/i.test(html)) {
      pageFails.push(url + ' neither live demo nor code-only note');
    }
  }
  routeCheck(
    'all ' + index.length + ' component URLs render tabs+props+demo-or-code-only',
    pageFails.length === 0,
    pageFails.slice(0, 10).join('; ')
  );
  let button = '';
  try {
    button = ssr('/components/button');
  } catch (e) {
    routeCheck("SSR renders '/components/button'", false, e.message.split('\n')[0]);
  }
  if (button) {
    const protoMarkers = [
      'Buttons communicate actions users can take',
      'Each page should have only one primary button',
      'Guidelines',
      'Specifications',
      'Code',
      'Accessibility',
      'Primary',
      'Secondary',
      'Tertiary',
      'Real props table (kind, size, disabled, renderIcon',
    ];
    for (const m of protoMarkers) {
      routeCheck(
        'Button page renders prototype copy ' + m.slice(0, 42),
        button.includes(m),
        'missing from SSR html'
      );
    }
  }
}
// Phase 4 (T07): foundations as routed pages from the pinned token/icon
// indexes. Acceptance: (1) every foundation URL renders its page with
// swatches/type equal to data/tokens.json; (2) icon + pictogram libraries
// search the full pinned sets from data/icons.json; (3) no foundation
// content remains only on the old single page (/foundations is an index).
if (typeof app.AppForPath === 'function') {
  const tokens = require(path.join(ROOT, 'data', 'tokens.json'));
  const iconIndex = require(path.join(ROOT, 'data', 'icons.json'));
  const SLUGS = {
    '2x-grid': '2x Grid',
    accessibility: 'Accessibility',
    'carbon-for-ai': 'Carbon for AI',
    color: 'Color',
    content: 'Content',
    icons: 'Icons',
    pictograms: 'Pictograms',
    motion: 'Motion',
    spacing: 'Spacing',
    themes: 'Themes',
    typography: 'Typography',
  };
  const BODY_MARKERS = {
    '2x-grid': 'Full width',
    accessibility: 'Build for everyone',
    'carbon-for-ai': 'Label AI output',
    color: 'Palettes',
    content: 'Write like a person',
    icons: 'Search icons',
    pictograms: 'Search pictograms',
    motion: 'Durations and easings',
    spacing: 'Carbon spacing scale',
    themes: 'Theme tokens',
    typography: 'Type tokens',
  };
  for (const slug of Object.keys(SLUGS)) {
    const title = SLUGS[slug];
    let html;
    try {
      html = ssr('/foundations/' + slug);
    } catch (e) {
      routeCheck("SSR renders '/foundations/" + slug + "'", false, e.message.split('\n')[0]);
      continue;
    }
    routeCheck(
      "'" + slug + "' page renders its title",
      html.includes('>' + title + '</h2>'),
      'title missing from SSR html'
    );
    routeCheck(
      "'" + slug + "' page renders its section body",
      html.includes(BODY_MARKERS[slug]),
      "marker '" + BODY_MARKERS[slug] + "' missing from SSR html"
    );
  }
  let fourohfour = '';
  try {
    fourohfour = ssr('/foundations/nope');
  } catch (e) {
    routeCheck("SSR renders '/foundations/nope'", false, e.message.split('\n')[0]);
  }
  if (fourohfour) {
    routeCheck(
      'unknown foundation slug renders not-found',
      fourohfour.includes('Foundation not found'),
      'no not-found copy'
    );
  }
  let colorHtml = '';
  try {
    colorHtml = ssr('/foundations/color');
  } catch (e) {
    routeCheck("SSR renders '/foundations/color'", false, e.message.split('\n')[0]);
  }
  if (colorHtml) {
    const swatches = ['blue60', 'red60', 'gray100', 'green60'];
    for (const key of swatches) {
      const hex = tokens.colors[key];
      routeCheck(
        'color swatch ' + key + ' equals tokens.json (' + hex + ')',
        Boolean(hex) && colorHtml.includes(hex),
        'hex missing from SSR html'
      );
    }
  }
  let typeHtml = '';
  try {
    typeHtml = ssr('/foundations/typography');
  } catch (e) {
    routeCheck("SSR renders '/foundations/typography'", false, e.message.split('\n')[0]);
  }
  if (typeHtml) {
    const size = tokens.type.body01 && tokens.type.body01.fontSize;
    routeCheck(
      'type sample equals tokens.json body01 (' + size + ')',
      Boolean(size) && typeHtml.includes(size),
      'font-size missing from SSR html'
    );
  }
  let iconsHtml = '';
  try {
    iconsHtml = ssr('/foundations/icons');
  } catch (e) {
    routeCheck("SSR renders '/foundations/icons'", false, e.message.split('\n')[0]);
  }
  if (iconsHtml) {
    const total = 'of ' + iconIndex.icons.bases.length;
    routeCheck(
      'icons library covers the full pinned set',
      iconsHtml.includes(total),
      "expected '" + total + "' in SSR html"
    );
    routeCheck('icons library is searchable', /search icons/i.test(iconsHtml), 'no search input');
  }
  let pictoHtml = '';
  try {
    pictoHtml = ssr('/foundations/pictograms');
  } catch (e) {
    routeCheck("SSR renders '/foundations/pictograms'", false, e.message.split('\n')[0]);
  }
  if (pictoHtml) {
    const total = 'of ' + iconIndex.pictograms.total;
    routeCheck(
      'pictograms library covers the full pinned set',
      pictoHtml.includes(total),
      "expected '" + total + "' in SSR html"
    );
    routeCheck('pictograms library is searchable', /search pictograms/i.test(pictoHtml), 'no search input');
  }
  let indexHtml = '';
  try {
    indexHtml = ssr('/foundations');
  } catch (e) {
    routeCheck("SSR renders '/foundations'", false, e.message.split('\n')[0]);
  }
  if (indexHtml) {
    const unlinked = Object.keys(SLUGS).filter((s) => !indexHtml.includes('/foundations/' + s));
    routeCheck(
      'foundations index links every foundation page',
      unlinked.length === 0,
      unlinked.length ? 'unlinked: ' + JSON.stringify(unlinked) : ''
    );
    const leaked = Object.values(BODY_MARKERS).filter((m) => indexHtml.includes(m));
    routeCheck(
      'no foundation content remains only on the old single page',
      leaked.length === 0,
      leaked.length ? 'single-page bodies leaked: ' + JSON.stringify(leaked) : ''
    );
  }
  const srcFiles = {
    'src/foundations.jsx': 'tokens.json',
    'src/icons.jsx': 'icons.json',
    'src/pictograms.jsx': 'icons.json',
  };
  for (const file of Object.keys(srcFiles)) {
    const want = srcFiles[file];
    let srcText = '';
    try {
      srcText = require('fs').readFileSync(path.join(SITE, file), 'utf8');
    } catch (e) {
      routeCheck(file + ' exists', false, 'missing file');
      continue;
    }
    routeCheck(
      file + ' is driven by the generated ' + want,
      srcText.includes(want),
      'no ' + want + ' import'
    );
  }
}
const fs = require('fs');
let routesSrc = '';
try {
  routesSrc = fs.readFileSync(path.join(SITE, 'src', 'routes.jsx'), 'utf8');
} catch (e) {
  routeCheck('src/routes.jsx registry exists', false, 'missing file');
}
routeCheck('router drives back/forward from popstate', routesSrc.includes('popstate'));
routeCheck('router navigates without reload via pushState', routesSrc.includes('pushState'));
// Phase 5 (T08): patterns, data-visualization and support/MCP pages.
// Acceptance: (1) guidance URLs render inside the shell; (2) the MCP page
// shows a placeholder-token client config plus every tool name the server
// actually exposes (TOOLS in server.py, served over POST /mcp); (3) no page
// tells the user to paste a real secret anywhere.
if (typeof app.AppForPath === 'function') {
  const T08_PAGES = [
    ['/patterns', ['Patterns', '/patterns/empty-state']],
    ['/patterns/empty-state', ['Empty state', 'Patterns']],
    ['/data-visualization', ['Data visualization']],
    ['/support', ['Support', '/mcp']],
    ['/mcp', ['YOUR_BONGDESIGN_TOKEN']],
  ];
  for (const [p, markers] of T08_PAGES) {
    let html;
    try {
      html = ssr(p);
    } catch (e) {
      routeCheck(`SSR renders '${p}'`, false, e.message.split('\n')[0]);
      continue;
    }
    for (const m of markers) {
      routeCheck(`'${p}' renders marker '${m}'`, html.includes(m), 'missing from SSR html');
    }
  }
  let serverSrc = '';
  try {
    serverSrc = fs.readFileSync(path.join(ROOT, 'server.py'), 'utf8');
  } catch (e) {
    routeCheck('server.py is readable for the MCP tool sync check', false, 'missing file');
  }
  const toolNames = [...serverSrc.matchAll(/\{'name': '([a-z_]+)'/g)].map((m) => m[1]);
  routeCheck('server.py exposes at least one MCP tool', toolNames.length > 0, 'no TOOLS entries parsed');
  let mcpHtml = '';
  try {
    mcpHtml = ssr('/mcp');
  } catch (e) {
    routeCheck("SSR renders '/mcp' for the tool sync check", false, e.message.split('\n')[0]);
  }
  if (mcpHtml) {
    for (const name of toolNames) {
      routeCheck(`MCP page lists the server tool '${name}'`, mcpHtml.includes(name), 'missing from SSR html');
    }
    routeCheck('MCP page documents the POST /mcp endpoint', mcpHtml.includes('/mcp'), 'missing from SSR html');
  }
  const SECRET_PHRASES = [
    'paste your token',
    'paste your secret',
    'paste the token',
    'enter your token',
    'enter your secret',
    'your real token',
    'your actual token',
    'production token',
  ];
  const hygieneUrls = ['/patterns', '/patterns/empty-state', '/data-visualization', '/support', '/mcp', '/'];
  for (const p of hygieneUrls) {
    let html;
    try {
      html = ssr(p).toLowerCase();
    } catch (e) {
      routeCheck(`SSR renders '${p}' for the secret-hygiene check`, false, e.message.split('\n')[0]);
      continue;
    }
    const leaked = SECRET_PHRASES.filter((s) => html.includes(s));
    routeCheck(
      `'${p}' never instructs pasting a real secret`,
      leaked.length === 0,
      leaked.length ? 'forbidden copy: ' + JSON.stringify(leaked) : ''
    );
  }
}
if (routeFails.length > 0) {
  console.error('Route failures:\n' + routeFails.join('\n'));
  process.exit(1);
}
console.log(`OK: routed pages render inside the shell (${app.ROUTES.length} routes).`);
