import React from 'react';
import { Button, ClickableTile, InlineNotification, Tile } from '@carbon/react';
import { navClick } from '../routes.jsx';
import index from '../../../data/components.json';

const BLOCKS = [
  {
    title: 'Foundations',
    copy: '2x Grid, color, typography, spacing, motion, themes, icons.',
    to: '/foundations/color',
  },
  {
    title: 'Components',
    copy: '147 components from the pinned Carbon release, each with a live demo.',
    to: '/components',
  },
  {
    title: 'Patterns',
    copy: 'Core patterns for common product moments.',
    to: '/patterns',
  },
  {
    title: 'Data visualization',
    copy: 'Guidance for charts and dashboards.',
    to: '/data-visualization',
  },
];

// Home: hero, Carbon MCP banner, building-blocks cards. Copy aligned with
// the locked prototype (carbon/.heimdall/design/prototype/index.html).
export default function HomePage() {
  return (
    <div>
      <div className="bong-hero">
        <h1>Let&apos;s make together</h1>
        <p className="bong-hero-sub">
          Carbon is an enterprise-ready, open-source design system — self-hosted
          by Bongbetic, pinned and mirrored in our own repository.
        </p>
        <div className="bong-hero-actions">
          <Button href="/components" onClick={navClick('/components')}>
            Get started →
          </Button>
          <Button kind="secondary" href="/mcp">
            Connect the MCP
          </Button>
        </div>
      </div>
      <InlineNotification
        kind="info"
        title="Self-hosted, MCP included"
        subtitle={`Renders from your own repo, pinned to upstream Carbon ${index.meta.carbonTag}. MCP at /mcp on this host, token required.`}
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
        </div>
      </div>
      <div className="bong-footer">
        <p>
          BongDesign — self-hosted Carbon {index.meta.carbonTag} · Carbon ©
          IBM, Apache-2.0 · Bongbetic branding, vendored.
        </p>
      </div>
    </div>
  );
}
