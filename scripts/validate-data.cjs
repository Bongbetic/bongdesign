// validate-data.cjs — stdlib-only assertions over the generated data files.
// Required by scripts/render-check.cjs (extends `npm run check:coverage`) and
// runnable standalone: `node scripts/validate-data.cjs` (also the ticket-checks
// red-at-base command — it needs no node_modules).
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const load = (f) => JSON.parse(fs.readFileSync(path.join(ROOT, 'data', f), 'utf8'));

function assert(cond, msg) {
  if (!cond) throw new Error('validate-data: ' + msg);
}

function validate() {
  const index = load('components.json');
  const names = index.components.map((c) => c.name);
  assert(names.length === 147, `expected 147 components, saw ${names.length}`);

  // props.json — mined from carbon-src MDX + TS source.
  const props = load('props.json');
  assert(props.meta && props.meta.carbonTag === index.meta.carbonTag,
    'props.json meta.carbonTag must match components.json');
  assert(props.components, 'props.json needs a components map');
  const missing = names.filter((n) => !props.components[n]);
  assert(missing.length === 0, `props.json missing: ${missing.slice(0, 8).join(',')}`);
  for (const [name, entry] of Object.entries(props.components)) {
    assert(Array.isArray(entry.props), `${name}: props must be an array`);
    for (const p of entry.props) {
      assert(p.name && p.description, `${name}: every prop needs name + description`);
    }
    assert(typeof entry.example === 'string' || entry.codeOnly === true,
      `${name}: needs an example or codeOnly`);
  }
  const button = props.components.Button;
  assert(button && button.props.some((p) => p.name === 'kind' && p.description),
    'Button must document the kind prop with a description');
  assert(Object.values(props.components).filter((e) => (e.props || []).length > 0).length >= 60,
    'at least 60 components must have mined props');

  // tokens.json — pinned @carbon token packages.
  const tokens = load('tokens.json');
  assert(tokens.meta && tokens.meta.carbonTag === index.meta.carbonTag,
    'tokens.json meta.carbonTag must match components.json');
  assert(tokens.colors && tokens.colors.blue60 === '#0f62fe', 'colors.blue60 must be #0f62fe');
  for (const t of ['white', 'g10', 'g90', 'g100']) {
    assert(tokens.themes && tokens.themes[t] && Object.keys(tokens.themes[t]).length > 50,
      `themes.${t} must be a full token map`);
  }
  assert(tokens.type && tokens.type.body01 && tokens.type.body01.fontSize,
    'type.body01 needs fontSize detail');
  assert(tokens.motion && tokens.motion.durationFast01 === '70ms',
    'motion.durationFast01 must be 70ms');

  // icons.json — searchable names + sizes, no vector data.
  const icons = load('icons.json');
  assert(icons.meta && icons.meta.carbonTag === index.meta.carbonTag,
    'icons.json meta.carbonTag must match components.json');
  assert(icons.icons && icons.icons.total > 1000 && icons.icons.names.length > 500,
    'icons index must cover the pinned set');
  assert(icons.icons.names.some((n) => n.startsWith('Add')),
    'icons index must include the Add family');
  assert(icons.pictograms && icons.pictograms.total > 50,
    'pictograms index must cover the pinned set');

  return `props:${names.length} tokens:ok icons:${icons.icons.total}+${icons.pictograms.total}`;
}

if (require.main === module) {
  try {
    console.log('validate-data: ' + validate());
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}

module.exports = validate;
