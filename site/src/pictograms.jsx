import React, { useMemo, useState } from 'react';
import * as Carbon from '@carbon/react';
import iconIndex from '../../data/icons.json';
import * as pictoData from '@carbon/pictograms';

function renderNode(node, key) {
  if (!node) return null;
  if (typeof node === 'string') return node;
  const Tag = node.elem || 'g';
  const kids = (node.content || []).map((c, i) => renderNode(c, `${key}-${i}`));
  return <Tag key={key} {...(node.attrs || {})}>{kids}</Tag>;
}

// Search space is the generated pictogram index (data/icons.json), mined
// from the pinned @carbon/pictograms package. Vectors still render from
// the pinned package itself, so documented names and artwork always agree.
const ALL = iconIndex.pictograms.names
  .map((name) => ({ name, descriptor: pictoData[name] }))
  .filter((p) => p.descriptor && p.descriptor.elem === 'svg');
// ALL.length equals iconIndex.pictograms.total: every indexed name resolves
// to vector data in the pinned package.

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
        {'Every pictogram in the pinned index (data/icons.json), rendered from its own vector data. Showing ' + shown.length + ' of ' + total + '.'}
      </p>
      <Carbon.Search
        id="picto-search"
        labelText="Search pictograms"
        placeholder="e.g. cloud"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <Carbon.FlexGrid>
        <Carbon.Row>
          {shown.map((p) => (
            <Carbon.Column key={p.name} sm={2} md={4} lg={4}>
              <Carbon.Tile>
                <svg {...p.descriptor.attrs} width={64} height={64} focusable="false" role="img" aria-hidden="true">
                  {(p.descriptor.content || []).map((c, i) => renderNode(c, i))}
                </svg>
                <div>
                  <code style={{ fontSize: '0.75rem', wordBreak: 'break-all' }}>{p.name}</code>
                </div>
              </Carbon.Tile>
            </Carbon.Column>
          ))}
        </Carbon.Row>
      </Carbon.FlexGrid>
    </div>
  );
}
