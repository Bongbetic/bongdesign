import React, { useMemo, useState } from 'react';
import * as Carbon from '@carbon/react';
import iconIndex from '../../data/icons.json';
import * as iconData from '@carbon/icons';

function renderNode(node, key) {
  if (!node) return null;
  if (typeof node === 'string') return node;
  const Tag = node.elem || 'g';
  const kids = (node.content || []).map((c, i) => renderNode(c, `${key}-${i}`));
  return <Tag key={key} {...(node.attrs || {})}>{kids}</Tag>;
}

// Search space is the generated icon index (data/icons.json), mined from
// the pinned @carbon/icons package. Vectors still render from the pinned
// package itself, so documented names and artwork always agree.
const BASES = iconIndex.icons.bases
  .map(({ base, sizes }) => {
    const size = sizes.includes(32) ? 32 : sizes[sizes.length - 1];
    return { name: base, size, descriptor: iconData[base + size] };
  })
  .filter((b) => b.descriptor);

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
        {'Every icon in the pinned index (data/icons.json), rendered from its own vector data. Showing ' + shown.length + ' of ' + total + '.'}
      </p>
      <Carbon.Search
        id="icon-search"
        labelText="Search icons"
        placeholder="e.g. arrow"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <Carbon.FlexGrid>
        <Carbon.Row>
          {shown.map((b) => (
            <Carbon.Column key={b.name} sm={2} md={4} lg={4}>
              <Carbon.Tile>
                <IconGlyph descriptor={b.descriptor} size={32} />
                <div>
                  <code style={{ fontSize: '0.75rem', wordBreak: 'break-all' }}>{b.name}</code>
                </div>
              </Carbon.Tile>
            </Carbon.Column>
          ))}
        </Carbon.Row>
      </Carbon.FlexGrid>
    </div>
  );
}
