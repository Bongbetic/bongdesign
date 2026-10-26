import React, { useMemo, useState } from 'react';
import * as Carbon from '@carbon/react';
import * as pictoData from '@carbon/pictograms';

function renderNode(node, key) {
  if (!node) return null;
  if (typeof node === 'string') return node;
  const Tag = node.elem || 'g';
  const kids = (node.content || []).map((c, i) => renderNode(c, `${key}-${i}`));
  return <Tag key={key} {...(node.attrs || {})}>{kids}</Tag>;
}

const ALL = Object.entries(pictoData)
  .filter(([name, d]) => /^[A-Z]/.test(name) && d && d.elem === 'svg')
  .map(([name, descriptor]) => ({ name, descriptor }))
  .sort((a, b) => a.name.localeCompare(b.name));

export function PictogramsLibrary() {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const shown = useMemo(() => {
    const all = q ? ALL.filter((p) => p.name.toLowerCase().includes(q)) : ALL;
    return all.slice(0, q ? 600 : 200);
  }, [q]);
  const total = q ? ALL.filter((p) => p.name.toLowerCase().includes(q)).length : ALL.length;
  return (
    <div>
      <p>
        Every pictogram in the pinned package, rendered from its own vector
        data. Showing {shown.length} of {total}.
      </p>
      <Carbon.Search
        id="picto-search"
        labelText="Search pictograms"
        placeholder="e.g. cloud"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(8rem, 1fr))', gap: '1px', background: '#e0e0e0', border: '1px solid #e0e0e0', marginTop: '1rem' }}>
        {shown.map((p) => (
          <div key={p.name} style={{ background: '#fff', padding: '1rem', textAlign: 'center' }}>
            <svg {...p.descriptor.attrs} width={64} height={64} focusable="false" role="img" aria-hidden="true">
              {(p.descriptor.content || []).map((c, i) => renderNode(c, i))}
            </svg>
            <div style={{ marginTop: '0.5rem' }}>
              <code style={{ fontSize: '0.75rem', wordBreak: 'break-all' }}>{p.name}</code>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
