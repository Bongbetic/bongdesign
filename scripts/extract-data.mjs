// extract-data.mjs — build-time pipeline: mine carbon-src MDX + TS prop types and
// the pinned @carbon packages into committed data/*.json. Deterministic:
// sorted keys, no timestamps. Run: `node scripts/extract-data.mjs` (repo root).
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const NM = path.join(ROOT, 'site', 'node_modules', '@carbon');
const pkg = (name) => require(path.join(NM, name));

const sortKeys = (v) => {
  if (Array.isArray(v)) return v.map(sortKeys);
  if (v && typeof v === 'object') {
    const out = {};
    for (const k of Object.keys(v).sort()) {
      const val = sortKeys(v[k]);
      if (typeof val !== 'function' && typeof val !== 'undefined') out[k] = val;
    }
    return out;
  }
  return v;
};
const write = (file, obj) =>
  fs.writeFileSync(path.join(ROOT, 'data', file), JSON.stringify(sortKeys(obj), null, 2) + '\n');

const index = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'components.json'), 'utf8'));
const NAMES = new Set(index.components.map((c) => c.name));
const TAG = index.meta.carbonTag;
const sitePkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'site', 'package.json'), 'utf8'));
const pin = (d) => (sitePkg.dependencies && sitePkg.dependencies[d]) || null;
const lowerMap = {};
for (const n of NAMES) lowerMap[n.toLowerCase()] = n;

const SKIP = new Set(['ClassPrefix', 'FeatureFlags', 'IdPrefix', 'Plex', 'Portal', 'ErrorBoundary']);

const compDir = path.join(ROOT, 'carbon-src', 'react', 'components');
const DIRS = fs.readdirSync(compDir).filter((d) =>
  fs.statSync(path.join(compDir, d)).isDirectory()).sort();
const dirFiles = (dir, ext) => {
  const out = [];
  const walk = (p) => {
    for (const f of fs.readdirSync(p).sort()) {
      const full = path.join(p, f);
      if (fs.statSync(full).isDirectory()) { if (f !== '__tests__') walk(full); continue; }
      if (f.endsWith(ext) && !f.includes('.stories.') && !f.includes('.test.')) out.push(full);
    }
  };
  walk(path.join(compDir, dir));
  return out;
};

// ---- MDX: descriptions + runnable examples ----
const clean = (s) =>
  s.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/\s+/g, ' ').trim();
const isPropWord = (w) => /^[a-z][A-Za-z0-9]*$/.test(w) && w !== 'props';
const byComponentMDX = {};
const fileFirstExample = {};
function classify(header) {
  let m = header.match(/^(\S+)\s+(`[^`]+`(?:\s+and\s+`[^`]+`)*)\s*$/);
  if (m && lowerMap[m[1].toLowerCase()]) {
    const props = [...m[2].matchAll(/`([^`]+)`/g)].map((x) => x[1]);
    if (props.length) return { comp: lowerMap[m[1].toLowerCase()], props };
  }
  m = header.match(/^(\S+)\s+(\S+)\s*$/);
  if (m && lowerMap[m[1].toLowerCase()] && isPropWord(m[2])) {
    return { comp: lowerMap[m[1].toLowerCase()], props: [m[2]] };
  }
  return null;
}
for (const dir of DIRS) {
  for (const file of dirFiles(dir, '.mdx')) {
    const text = fs.readFileSync(file, 'utf8');
    const firstJsx = text.match(/```jsx\n([\s\S]*?)```/);
    if (firstJsx && !fileFirstExample[dir]) fileFirstExample[dir] = firstJsx[1].trim();
    const re = /^###\s+(.+?)\s*$/gm;
    let m;
    while ((m = re.exec(text)) !== null) {
      const hit = classify(m[1]);
      if (!hit) continue;
      const start = m.index + m[0].length;
      const next = text.slice(start).search(/^#{2,3}\s/m);
      const body = next === -1 ? text.slice(start) : text.slice(start, start + next);
      const ex = body.match(/```jsx\n([\s\S]*?)```/);
      const desc = clean(body.replace(/```[\s\S]*?```/g, ' '));
      if (!desc) continue;
      for (const prop of hit.props) {
        (byComponentMDX[hit.comp] = byComponentMDX[hit.comp] || []).push({
          name: prop, description: desc.slice(0, 600),
          example: ex ? ex[1].trim().slice(0, 1200) : null,
        });
      }
    }
  }
}

// ---- TS: prop types, required, defaults, enums (the ArgTypes source) ----
function braceMatch(text, openIdx) {
  let depth = 0;
  for (let i = openIdx; i < text.length; i++) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}') { depth--; if (depth === 0) return i; }
  }
  return -1;
}
const cleanDoc = (raw) => {
  const lines = raw.split('\n').map((l) => l.replace(/^\s*\*?\s?/, '').trim());
  const text = lines.join('\n').trim();
  const def = text.match(/@default\s+(.+)/);
  const desc = clean(text.split('@')[0]);
  return { description: desc, default: def ? def[1].trim().slice(0, 200) : null };
};
// dir -> Map(ifaceName -> {extends[], props:[{name, optional, type, description, default}]})
const tsIfcs = {};
const enumConsts = {};
for (const dir of DIRS) {
  for (const file of [...dirFiles(dir, '.tsx'), ...dirFiles(dir, '.ts')]) {
    const text = fs.readFileSync(file, 'utf8');
    for (const m of text.matchAll(/export\s+const\s+(\w+)\s*=\s*\[([\s\S]*?)\]\s*as\s+const/g)) {
      const vals = [...m[2].matchAll(/'([^']+)'/g)].map((x) => x[1]);
      if (vals.length) ((enumConsts[dir] = enumConsts[dir] || new Map())).set(m[1], vals);
    }
    const heads = [
      ...[...text.matchAll(/export\s+interface\s+(\w+)/g)].map((m) => ({ name: m[1], after: m.index + m[0].length })),
      ...[...text.matchAll(/export\s+type\s+(\w+)\s*=/g)].map((m) => ({ name: m[1], after: m.index + m[0].length })),
    ];
    for (const h of heads) {
      const open = text.indexOf('{', h.after);
      if (open === -1 || open - h.after > 400) continue;
      const close = braceMatch(text, open);
      if (close === -1) continue;
      const header = text.slice(h.after, open);
      const ext = header.includes('extends')
        ? header.split('extends')[1].split(',').map((s) => s.split('<')[0].trim()).filter(Boolean)
        : [];
      const props = [];
      for (const seg of text.slice(open + 1, close).split(';')) {
        const dm = seg.match(/\/\*\*([\s\S]*?)\*\//);
        const rest = seg.replace(/\/\*[\s\S]*?\*\//g, '').trim();
        const pm = rest.match(/^([\w$]+)(\?)?:\s*([\s\S]*)$/);
        if (!pm || pm[1].includes('(')) continue;
        const doc = dm ? cleanDoc(dm[1]) : { description: '', default: null };
        props.push({
          name: pm[1], optional: pm[2] === '?',
          type: pm[3].replace(/\s+/g, ' ').trim().slice(0, 300),
          description: doc.description, default: doc.default,
        });
      }
      ((tsIfcs[dir] = tsIfcs[dir] || new Map())).set(h.name, { extends: ext, props });
    }
  }
}
function resolveProps(dir, ifcName, seen = new Set()) {
  if (seen.has(ifcName)) return [];
  seen.add(ifcName);
  const ifc = (tsIfcs[dir] || new Map()).get(ifcName);
  if (!ifc) return [];
  const own = new Set(ifc.props.map((p) => p.name));
  const merged = [...ifc.props.map((p) => ({ ...p, inheritedFrom: null }))];
  for (const base of ifc.extends) {
    for (const p of resolveProps(dir, base, seen)) {
      if (!own.has(p.name)) merged.push({ ...p, inheritedFrom: ifcName });
    }
  }
  return merged;
}
const tsByComponent = {};
for (const dir of DIRS) {
  for (const [ifcName] of (tsIfcs[dir] || new Map())) {
    if (!/Props$/i.test(ifcName)) continue;
    const comp = lowerMap[ifcName.replace(/Props$/i, '').toLowerCase()];
    if (!comp) continue;
    const merged = resolveProps(dir, ifcName);
    const consts = enumConsts[dir] || new Map();
    tsByComponent[comp] = merged.map((p) => {
      let values = null;
      const inline = [...p.type.matchAll(/'([^']+)'/g)].map((x) => x[1]);
      if (p.type.includes('|') && inline.length >= 2) values = [...new Set(inline)];
      if (!values) {
        for (const [cname, vals] of consts) {
          const base = cname.replace(/s$/, '');
          if (new RegExp(`\\b${base}\\b`).test(p.type)) { values = vals; break; }
        }
      }
      return { ...p, ...(values ? { enum: values } : {}) };
    });
  }
}

// ---- merge MDX + TS; write props.json ----
const generic = (n) => `import { ${n} } from '@carbon/react';\n<${n} />`;
const propsOut = {};
for (const name of [...NAMES].sort()) {
  const ts = tsByComponent[name] || [];
  const mdx = byComponentMDX[name] || [];
  const mdxByName = {};
  for (const s of mdx) if (!mdxByName[s.name]) mdxByName[s.name] = s;
  const seen = new Set();
  const props = [];
  for (const p of ts) {
    seen.add(p.name);
    const m = mdxByName[p.name];
    props.push({
      name: p.name, component: name,
      description: p.description || (m && m.description) || `Undocumented in ${TAG} — see source.`,
      ...(p.type ? { type: p.type } : {}),
      required: !p.optional,
      ...(p.default ? { default: p.default } : {}),
      ...(p.enum ? { enum: p.enum } : {}),
      ...(p.inheritedFrom ? { inheritedFrom: p.inheritedFrom } : {}),
      ...(m && m.example ? { example: m.example } : {}),
    });
  }
  for (const s of mdx) {
    if (seen.has(s.name)) continue;
    props.push({ name: s.name, component: name, description: s.description, ...(s.example ? { example: s.example } : {}) });
  }
  const minedEx = (mdx.find((s) => s.example) || {}).example || null;
  const dirExample = (!SKIP.has(name) && fileFirstExample[name]) || null;
  propsOut[name] = {
    props,
    example: minedEx || dirExample || generic(name),
    exampleMined: Boolean(minedEx || dirExample),
    ...(SKIP.has(name) ? { codeOnly: true, note: 'Utility — code only.' } : {}),
    ...(!SKIP.has(name) && props.length === 0 && !dirExample
      ? { note: 'Generic example — no mined example for this pin.' } : {}),
  };
}
write('props.json', { meta: { carbonTag: TAG, source: 'carbon-src MDX + TS' }, components: propsOut });

// ---- tokens ----
const colors = pkg('colors');
const themes = pkg('themes');
const typePkg = pkg('type');
const motion = pkg('motion');
const layout = pkg('layout');
const typeStyles = typePkg.styles || typePkg;
const typeOut = {};
for (const [k, v] of Object.entries(typeStyles)) {
  if (v && typeof v === 'object' && v.fontSize) typeOut[k] = v;
}
const themesOut = {};
for (const t of ['white', 'g10', 'g90', 'g100']) {
  if (!themes[t]) throw new Error(`themes package lacks ${t}`);
  themesOut[t] = themes[t];
}
write('tokens.json', {
  meta: { carbonTag: TAG, source: 'pinned @carbon packages' },
  colors, themes: themesOut, type: typeOut, motion, layout,
});

// ---- icons + pictograms ----
const icons = pkg('icons');
const bases = {};
for (const name of Object.keys(icons)) {
  const m = name.match(/^(.*)(16|20|24|32)$/);
  if (!m) continue;
  (bases[m[1]] = bases[m[1]] || { base: m[1], sizes: [] }).sizes.push(Number(m[2]));
}
const iconBases = Object.values(bases)
  .map((b) => ({ base: b.base, sizes: [...new Set(b.sizes)].sort((a, b2) => a - b2) }))
  .sort((a, b) => a.base.localeCompare(b.base));
const pictos = pkg('pictograms');
const pictoNames = Object.entries(pictos)
  .filter(([n, d]) => /^[A-Z]/.test(n) && d && d.elem === 'svg')
  .map(([n]) => n)
  .sort();
write('icons.json', {
  meta: { carbonTag: TAG, packages: { icons: pin('@carbon/icons'), pictograms: pin('@carbon/pictograms') } },
  icons: { total: Object.keys(icons).length, bases: iconBases, names: Object.keys(icons).sort() },
  pictograms: { total: pictoNames.length, names: pictoNames },
});

const withProps = Object.values(propsOut).filter((e) => e.props.length > 0).length;
console.log(`extract-data: props for ${Object.keys(propsOut).length} components (${withProps} with mined props), tokens + icons written`);
