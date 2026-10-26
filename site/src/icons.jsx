import React, { useMemo, useState } from 'react';
import * as Carbon from '@carbon/react';
import * as iconData from '@carbon/icons';

function renderNode(node, key) {
  if (!node) return null;
  if (typeof node === 'string') return node;
  const Tag = node.elem || 'g';
  const kids = (node.content || []).map((c, i) => renderNode(c, `${key}-${i}`));
  return <Tag key={key} {...(node.attrs || {})}>{kids}</Tag>;
}

const BASES = (() => {
  const pick = {};
  for (const name of Object.keys(iconData)) {
    const m = name.match(/^(.*)(16|20|24|32)$/);
    if (!m) continue;
    const base = m[1];
    const size = Number(m[2]);
    if (!pick[base] || (pick[base].size !== 32 && size === 32) || (!pick[base] && true)) {
      pick[base] = { name: base, size, descriptor: iconData[name] };
    }
    if (size === 32) pick[base] = { name: base, size, descriptor: iconData[name] };
  }
  return Object.values(pick).sort((a, b) => a.name.localeCompare(b.name));
})();

function IconGlyph({ descriptor, size }) {
  const d = descriptor;
  if (!d || d.elem !== 'svg') return null;
  return (
    <svg
      {...d.attrs}
      width={size}
      height={size}
      focusable="false"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-hidden="true"
    >
      {(d.content || []).map((c, i) => renderNode(c, i))}
    </svg>
  );
}

export default function IconsLibrary() {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const shown = useMemo(() => {
    const all = q ? BASES.filter((b) => b.name.toLowerCase().includes(q)) : BASES;
    return all.slice(0, q ? 600 : 240);
  }, [q]);
  const total = q ? BASES.filter((b) => b.name.toLowerCase().includes(q)).length : BASES.length;
  return (
    <div>
      <p>
        Every icon in the pinned package, rendered from its own vector data.
        Showing {shown.length} of {total}.
      </p>
      <Carbon.Search
        id="icon-search"
        labelText="Search icons"
        placeholder="e.g. arrow"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(7rem, 1fr))', gap: '1px', background: '#e0e0e0', border: '1px solid #e0e0e0', marginTop: '1rem' }}>
        {shown.map((b) => (
          <div key={b.name} style={{ background: '#fff', padding: '1rem', textAlign: 'center' }}>
            <IconGlyph descriptor={b.descriptor} size={32} />
            <div style={{ marginTop: '0.5rem' }}>
              <code style={{ fontSize: '0.75rem', wordBreak: 'break-all' }}>{b.name}</code>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
