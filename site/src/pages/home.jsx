import React from 'react';
import { ClickableTile, InlineNotification, Link, Tile } from '@carbon/react';
import { navClick } from '../routes.jsx';
import index from '../../../data/components.json';

const BLOCKS = [
  {
    title: 'Foundations',
    copy: 'Color, type, motion, spacing and more: the tokens every page is built from.',
    to: '/foundations/color',
  },
  {
    title: 'Components',
    copy: 'Every component in the pinned upstream release, rendered live from your own repo.',
    to: '/components',
  },
  {
    title: 'Patterns',
    copy: 'Reusable solutions for common jobs: empty states, forms, loading, notifications, search.',
    to: null,
  },
  {
    title: 'Data visualization',
    copy: 'Charts live in a separate package and are not vendored here. Color order follows the palettes in Color.',
    to: null,
  },
  {
    title: 'Building experiences',
    copy: 'Start from a working vertical slice, then grow. Keep the design system the source of interface truth.',
    to: null,
  },
];

// Home: hero, Carbon MCP banner, building-blocks cards.
export default function HomePage() {
  return (
    <div>
      <div className="bong-hero">
        <h1>BongDesign</h1>
        <p className="bong-hero-sub">Self-hosted Carbon component library</p>
        <p>
          Self-hosted Carbon component library, pinned to upstream Carbon{' '}
          {index.meta.carbonTag}. {index.components.length} components indexed.
          Source: your own repo, no IBM account needed.
        </p>
      </div>
      <InlineNotification
        kind="info"
        title="Self-hosted, MCP included"
        subtitle="This library renders from your own repo. MCP at /mcp on this host, token required."
        className="bong-mcp-banner"
      />
      <div className="bong-section">
        <h2>Building blocks</h2>
        <div className="bong-card-grid">
          {BLOCKS.map((b) =>
            b.to ? (
              <ClickableTile key={b.title} href={b.to} onClick={navClick(b.to)}>
                <h3>{b.title}</h3>
                <p>{b.copy}</p>
              </ClickableTile>
            ) : (
              <Tile key={b.title}>
                <h3>{b.title}</h3>
                <p>{b.copy}</p>
              </Tile>
            )
          )}
          <Tile>
            <h3>Support</h3>
            <p>
              Repo:{' '}
              <Link href="https://github.com/Bongbetic/bongdesign">Bongbetic/bongdesign</Link>.
              Upstream snapshot, own repo. Health at <code>/health</code>.
            </p>
          </Tile>
        </div>
      </div>
      <div className="bong-footer">
        <p>
          BongDesign {index.meta.carbonTag} · upstream Carbon snapshot, own repo ·
          MCP at <code>/mcp</code> · health at <code>/health</code>
        </p>
        <p>
          Built by <Link href="https://bongbetic.com">Bongbetic</Link>. Free software,
          loud opinions, no warranty (see your licence).
        </p>
      </div>
    </div>
  );
}
