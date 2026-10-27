// Durable coverage check: every component in data/components.json gets a
// gallery card, and every live demo renders without throwing.
// Run: npm run check:coverage (needs site/node_modules installed).
const path = require('path');
const { execSync } = require('child_process');
const util = require('util');

// Phase 8 (T16, issue #31): demo visibility — capture console output from the
// top of this gate, BEFORE componentCards() creates elements (React validates
// propTypes at createElement time, not at render time). The log therefore
// covers every demo creation + render and every route/component page SSR
// below. Passthrough: messages are still printed, only also collected.
const t16Console = [];
for (const method of ['error', 'warn']) {
  const orig = console[method];
  console[method] = (...args) => {
    try {
      t16Console.push(util.format(...args).split('\n')[0]);
    } catch (e) {
      t16Console.push(args.map(String).join(' ').split('\n')[0]);
    }
    return orig.apply(console, args);
  };
}

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

// Phase 7 (T14, issue #27): demo fidelity — every live card must be a
// non-trivial canonical demo, not a bare component with generic/empty props
// (Accordion with no items, closed Modal, DataTable with no rows, ...).
// A live demo passes when ALL hold over its SSR HTML:
//   (a) markup length >= HTML_MIN (bare `<Button>Example</Button>` is tiny),
//   (b) visible text length >= TEXT_MIN (empty/closed renders carry no copy),
//   (c) visible text is not exactly the generic "Example" placeholder,
//   (d) visible text carries no "undefined" fallthrough from missing props.
// Calibrated so the 32 curated demos pass (tightest: Theme markup 94,
// AspectRatio/TreeView/ComboBox/DatePicker/TimePicker text 4) while bare
// renders fail. RED at the T14 test commit (44): AILabel, BreadcrumbItem,
// Button, ButtonSet, CheckboxGroup, Copy, DangerButton, DataTableSkeleton,
// FlexGrid, FluidDatePicker, FluidForm, FluidNumberInput, Form, FormGroup,
// FormItem, FormLabel, Grid, Heading, IconButton, InlineCheckbox, Layer, Link,
// ListItem, Menu, NumberInput, OrderedList, PrimaryButton, RadioTile,
// SecondaryButton, SelectItem, SelectItemGroup, SkeletonIcon,
// SkeletonPlaceholder, SkeletonText, Slider, Stack, Switch, Tab, TabContent,
// Tag, Tile, TileGroup, TimePickerSelect, UnorderedList.
function visibleText(html) {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
const HTML_MIN = 90;
const TEXT_MIN = 4;
const thin = [];
for (const c of cards) {
  if (!c.live) continue;
  let html;
  try {
    html = renderToString(React.createElement(React.Fragment, null, c.demo));
  } catch (e) {
    continue; // already reported as a render failure above
  }
  const text = visibleText(html);
  const reasons = [];
  if (html.length < HTML_MIN) reasons.push(`markup ${html.length}<${HTML_MIN}`);
  if (text.length < TEXT_MIN) reasons.push(`text ${text.length}<${TEXT_MIN}`);
  if (text.toLowerCase() === 'example') reasons.push('generic "Example" placeholder');
  if (/undefined/i.test(text)) reasons.push('missing-prop "undefined" fallthrough');
  if (reasons.length > 0) thin.push(c.name + ' :: ' + reasons.join('; '));
}
if (thin.length > 0) {
  console.error('Thin demos (bare component with generic/empty props):\n' + thin.join('\n'));
  process.exit(1);
}
console.log(
  `OK: ${cards.filter((c) => c.live).length} live demos are non-trivial (markup>=${HTML_MIN}, text>=${TEXT_MIN}, no placeholder copy).`
);
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
// Phase 6 (T13): SC-5 remediation — self-hosted fonts, masthead lockup,
// prototype type/element alignment. Acceptance: (a) index.scss declares
// local @font-face for Carbon's family names with /fonts/ URLs, ships
// woff2 files, and neither SCSS nor built dist CSS references '~@ibm';
// (b) the shell SSR lockup is glyph+text (or a sized img) with explicit
// lockup height in CSS so nothing clips in the 48px masthead; (c) hero h1
// matches the locked prototype (42px/300); (d) masthead top-nav labels
// match the prototype; (e) sidenav active treatment matches the prototype
// (grey bg + 3px blue left bar); (f) card grid is the prototype 2-col
// hairline grid with demo/code box styles on component pages.
const scssText = fs.readFileSync(path.join(SITE, 'src', 'index.scss'), 'utf8');
routeCheck(
  'index.scss declares a local @font-face for "IBM Plex Sans" with /fonts/ URLs',
  scssText.includes('@font-face') &&
    scssText.includes('IBM Plex Sans') &&
    scssText.includes('/fonts/'),
  'no self-hosted @font-face wiring in index.scss'
);
routeCheck(
  'index.scss declares a local @font-face for "IBM Plex Mono" with /fonts/ URLs',
  scssText.includes('@font-face') &&
    scssText.includes('IBM Plex Mono') &&
    scssText.includes('/fonts/'),
  'no self-hosted mono @font-face wiring in index.scss'
);
let fontFiles = [];
try {
  fontFiles = fs.readdirSync(path.join(SITE, 'public', 'fonts')).filter((f) => f.endsWith('.woff2'));
} catch (e) {
  fontFiles = [];
}
routeCheck(
  'site/public/fonts ships self-hosted woff2 files',
  fontFiles.length >= 4 &&
    fontFiles.some((f) => /sans/i.test(f)) &&
    fontFiles.some((f) => /mono/i.test(f)),
  'got ' + JSON.stringify(fontFiles)
);
try {
  const distDir = path.join(SITE, 'dist', 'assets');
  const cssFiles = fs.existsSync(distDir)
    ? fs.readdirSync(distDir).filter((f) => f.endsWith('.css'))
    : [];
  const distCss = cssFiles.map((f) => fs.readFileSync(path.join(distDir, f), 'utf8')).join('\n');
  routeCheck(
    'built dist CSS contains no ~@ibm font URLs',
    !distCss.includes('~@ibm'),
    cssFiles.length ? 'broken tilde URLs survived the build' : 'no dist CSS found — run npm run build first'
  );
} catch (e) {
  routeCheck('built dist CSS contains no ~@ibm font URLs', false, e.message.split('\n')[0]);
}
if (typeof app.AppForPath === 'function') {
  let homeHtml = '';
  try {
    homeHtml = ssr('/');
  } catch (e) {
    routeCheck("SSR renders '/' for the T13 lockup check", false, e.message.split('\n')[0]);
  }
  if (homeHtml) {
    routeCheck(
      'masthead lockup is glyph+text or a sized wordmark img',
      homeHtml.includes('bongbetic-glyph.svg') ||
        homeHtml.includes('bong-lockup') ||
        /<img[^>]*bong-wordmark[^>]*height/.test(homeHtml),
      'no glyph/text lockup or sized wordmark in shell SSR'
    );
    for (const label of ['Foundations', 'Components', 'Patterns', 'Data visualization']) {
      routeCheck(
        `masthead top nav labels '${label}' per the prototype`,
        new RegExp('cds--header__menu-item[\\s\\S]{0,120}?>' + label + '<').test(homeHtml),
        'label missing from the masthead top nav SSR'
      );
    }
  }
}
routeCheck(
  'masthead lockup CSS pins an explicit height (no clipped wordmark)',
  /(bong-lockup|bong-wordmark)[\s\S]{0,200}?height:\s*[\d.]+rem/.test(scssText),
  'no explicit lockup height in index.scss'
);
routeCheck(
  'hero h1 matches the prototype (42px/2.625rem, weight 300)',
  scssText.includes('.bong-hero h1') &&
    /\.bong-hero h1[\s\S]{0,200}?font-size:\s*2\.625rem/.test(scssText) &&
    /\.bong-hero h1[\s\S]{0,200}?font-weight:\s*300/.test(scssText),
  'hero h1 is not 2.625rem/300 in index.scss'
);
routeCheck(
  'sidenav active item has the prototype treatment (grey bg + blue left bar)',
  scssText.includes('.bong-sidenav') &&
    /\.bong-sidenav[\s\S]*?#e0e0e0/.test(scssText) &&
    /\.bong-sidenav[\s\S]*?#0f62fe/.test(scssText),
  'no prototype sidenav active treatment in index.scss'
);
routeCheck(
  'card grid is the prototype 2-col hairline grid',
  scssText.includes('.bong-card-grid') &&
    /\.bong-card-grid[\s\S]{0,400}?grid-template-columns:\s*1fr 1fr/.test(scssText) &&
    /\.bong-card-grid[\s\S]{0,400}?#e0e0e0/.test(scssText),
  'card grid is not the 2-col hairline grid in index.scss'
);
routeCheck(
  'component pages have prototype demo + code box styles',
  /\.bong-demo\s*\{/.test(scssText) && /\.bong-code\s*\{/.test(scssText),
  'no .bong-demo/.bong-code styles in index.scss'
);
// Phase 7 (T15, issue #30): SC-5 round-2 remediation — design-system layout.
// The /foundations index was a bare congested link list (0 Carbon tiles)
// and every component page carried a 147-link plain footer index
// (178 anchors). Acceptance: (a) /foundations SSR renders cds--tile cards;
// (b) a component page anchor count is materially below 178 and its index
// uses a Carbon primitive (cds--structured-list or cds--tile), with no
// .bong-index anchor wall; (c) foundation/material pages lay out on Carbon
// Grid/Tile/StructuredList primitives (token VALUE displays stay custom but
// sit on the Carbon grid); (d) guidance content lists use Carbon list
// primitives. Pinned token/icon values are asserted by the T07 phase above
// and must not change.
if (typeof app.AppForPath === 'function') {
  let foundationsHtml = '';
  try {
    foundationsHtml = ssr('/foundations');
  } catch (e) {
    routeCheck("SSR renders '/foundations' for the T15 tile check", false, e.message.split('\n')[0]);
  }
  if (foundationsHtml) {
    routeCheck(
      '/foundations index renders Carbon tile cards',
      foundationsHtml.includes('cds--tile'),
      'no cds--tile cards in the foundations index SSR'
    );
  }
  let sampleHtml = '';
  try {
    sampleHtml = ssr('/components/button');
  } catch (e) {
    routeCheck("SSR renders '/components/button' for the T15 anchor check", false, e.message.split('\n')[0]);
  }
  if (sampleHtml) {
    const anchors = (sampleHtml.match(/<a\b/g) || []).length;
    routeCheck(
      'component page anchor count is materially below the 178-anchor wall (<100)',
      anchors < 100,
      'got ' + anchors + ' anchors'
    );
    routeCheck(
      'component page index uses a Carbon primitive (structured list or tile)',
      sampleHtml.includes('cds--structured-list') || sampleHtml.includes('cds--tile'),
      'no cds--structured-list or cds--tile index in the component page SSR'
    );
    routeCheck(
      'component page drops the plain .bong-index anchor wall',
      !sampleHtml.includes('bong-index'),
      'plain .bong-index footer still in the component page SSR'
    );
  }
  for (const slug of ['color', 'typography', 'icons']) {
    let html = '';
    try {
      html = ssr('/foundations/' + slug);
    } catch (e) {
      routeCheck("SSR renders '/foundations/" + slug + "' for the T15 grid check", false, e.message.split('\n')[0]);
      continue;
    }
    routeCheck(
      "'" + slug + "' foundation page lays out on Carbon Grid/Tile/StructuredList primitives",
      html.includes('cds--tile') || html.includes('cds--col') || html.includes('cds--structured-list'),
      'no Carbon layout primitive in the ' + slug + ' SSR'
    );
  }
  let patternHtml = '';
  try {
    patternHtml = ssr('/patterns/empty-state');
  } catch (e) {
    routeCheck("SSR renders '/patterns/empty-state' for the T15 list check", false, e.message.split('\n')[0]);
  }
  if (patternHtml) {
    routeCheck(
      'guidance content lists use Carbon list primitives',
      patternHtml.includes('cds--list--unordered') || patternHtml.includes('cds--list--ordered'),
      'no cds--list primitive in the pattern page SSR'
    );
  }
}
// Phase 8 (T16, issue #31): demo visibility ("a lot of components are
// missing"). (a) Zero required-prop noise: re-render every live demo plus
// every route and all 147 component pages under the capture above, then fail
// on any "Failed prop type" / missing-required-prop warning. React dedupes
// repeated warnings, so the collected log already holds the earlier phases;
// the explicit loop keeps the gate honest as demos change. console.error and
// console.warn both log printf-style templates ("Failed %s type"), hence
// the util.format at capture time. (b) Overlays visibly open: each live demo
// SSR must contain its component's defining cds-- marker; overlays must show
// open-state markup (open classes, menu items present), matching the Carbon
// reference instead of a closed trigger. T16_NO_MARKER exempts components
// whose reference render carries no cds-- class at all.
const T16_OPEN_MARKERS = {
  Modal: ['cds--modal'],
  ComposedModal: ['cds--modal'],
  ModalWrapper: ['cds--modal'],
  Popover: ['cds--popover'],
  Menu: ['cds--menu', 'Copy link'],
  MenuButton: ['One', 'Two'],
  ComboButton: ['Publish now'],
  Tooltip: ['cds--popover--open'],
  Toggletip: ['cds--toggletip--open'],
  OverflowMenu: ['cds--overflow-menu--open'],
  OverflowMenuItem: ['cds--overflow-menu--open'],
  MultiSelect: ['Alpha', 'Beta'],
  FluidMultiSelect: ['Design', 'Engineering'],
};
const T16_NO_MARKER = new Set(['Heading']);
const t16Fails = [];
if (typeof app.AppForPath === 'function') {
  const T16_ROUTES = [
    '/',
    '/components',
    '/foundations',
    '/patterns',
    '/patterns/empty-state',
    '/data-visualization',
    '/support',
    '/mcp',
    '/no-such-page',
    ...index.map((c) => '/components/' + c.name.toLowerCase()),
  ];
  for (const p of T16_ROUTES) {
    try {
      ssr(p);
    } catch (e) {
      // Render throws are reported by earlier phases; the warning gate below
      // only cares about console noise.
    }
  }
  for (const c of cards) {
    if (!c.live) continue;
    try {
      renderToString(React.createElement(React.Fragment, null, c.demo));
    } catch (e) {
      // Likewise reported by the render-failure gate above.
    }
  }
}
const t16PropFails = [
  ...new Set(
    t16Console.filter(
      (m) => /failed prop type/i.test(m) || /failed %s type/i.test(m) || /marked as required/i.test(m)
    )
  ),
];
for (const m of t16PropFails) t16Fails.push('prop-type warning :: ' + m.slice(0, 220));
for (const c of cards) {
  if (!c.live || T16_NO_MARKER.has(c.name)) continue;
  let html;
  try {
    html = renderToString(React.createElement(React.Fragment, null, c.demo));
  } catch (e) {
    continue; // reported by the render-failure gate above
  }
  const want = T16_OPEN_MARKERS[c.name];
  if (want) {
    const absent = want.filter((m) => !html.includes(m));
    if (absent.length > 0) {
      t16Fails.push(c.name + ' :: closed/hidden overlay, SSR lacks ' + JSON.stringify(absent));
    }
  } else if (!html.includes('cds--')) {
    t16Fails.push(c.name + ' :: live demo SSR carries no cds-- visual marker');
  }
}
if (t16Fails.length > 0) {
  console.error('Demo visibility failures (T16, issue #31):\n' + t16Fails.join('\n'));
  process.exit(1);
}
console.log(
  `OK: ${cards.filter((c) => c.live).length} live demos carry zero prop-type warnings and open-state overlay markup.`
);
// Phase 9 (T17, issue #34): masthead wordmark invisible. Carbon HeaderName
// wraps children in its own <span>, so flex on the anchor (.bong-lockup)
// alone leaves the wrapper span as a block; the block-level glyph img pushes
// word/suffix to a second line clipped by the 48px header (glyph only in the
// user screenshot). Acceptance: (a) index.scss targets the wrapper with a
// flex row (.bong-lockup > span { display:flex ... }); (b) the SSR header
// segment keeps glyph+word+suffix inside one wrapper span.
routeCheck(
  'masthead lockup wrapper span is a flex row (no clipped wordmark)',
  /\.bong-lockup\s*>\s*span\s*\{[^}]*display:\s*flex/.test(scssText),
  'no .bong-lockup > span { display:flex } wrapper rule in index.scss'
);
if (typeof app.AppForPath === 'function') {
  let t17Html = '';
  try {
    t17Html = ssr('/');
  } catch (e) {
    routeCheck("SSR renders '/' for the T17 lockup check", false, e.message.split('\n')[0]);
  }
  if (t17Html) {
    routeCheck(
      'SSR header keeps glyph+word+suffix in one lockup wrapper',
      /cds--header__name[^>]*><span>[\s\S]*?bong-lockup-glyph[\s\S]*?bong-lockup-word[\s\S]*?bong-lockup-suffix[\s\S]*?<\/span>\s*<\/a>/.test(t17Html),
      'glyph+word+suffix are not in one header wrapper span in the shell SSR'
    );
  }
}
// Phase 10 (T18, issue #36): masthead uses the COLOR wordmark, not the
// monochrome glyph + typed text (wrong asset). Acceptance: (a) the SSR
// header contains the light-background color wordmark img and no glyph img;
// (b) index.scss pins .bong-lockup-logo height (1.75rem, width auto) so the
// ~4.49:1 wordmark fits the 48px masthead on one line; (c) the dark
// (white-text) variant is never used on the white masthead.
routeCheck(
  'masthead lockup logo CSS pins an explicit height (one-line wordmark)',
  /\.bong-lockup-logo\s*\{[^}]*height:\s*1\.75rem/.test(scssText),
  'no .bong-lockup-logo { height:1.75rem } rule in index.scss'
);
if (typeof app.AppForPath === 'function') {
  let t18Html = '';
  try {
    t18Html = ssr('/');
  } catch (e) {
    routeCheck("SSR renders '/' for the T18 logo check", false, e.message.split('\n')[0]);
  }
  if (t18Html) {
    const hm = t18Html.match(/<header[\s\S]*?<\/header>/);
    const headerSeg = hm ? hm[0] : t18Html;
    routeCheck(
      'masthead uses the color wordmark img',
      headerSeg.includes('/branding/bongbetic-wordmark@2x.png'),
      'no color wordmark img in the header SSR'
    );
    routeCheck(
      'masthead carries no monochrome glyph img',
      !headerSeg.includes('bongbetic-glyph'),
      'glyph img still in the header SSR'
    );
    routeCheck(
      'masthead never uses the dark (white-text) wordmark variant',
      !headerSeg.includes('bongbetic-wordmark-dark'),
      'dark wordmark variant in the header SSR'
    );
  }
}
if (routeFails.length > 0) {
  console.error('Route failures:\n' + routeFails.join('\n'));
  process.exit(1);
}
console.log(`OK: routed pages render inside the shell (${app.ROUTES.length} routes).`);
