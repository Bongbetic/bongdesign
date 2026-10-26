import React, { useState } from 'react';
import * as Carbon from '@carbon/react';
import * as Icons from '@carbon/icons-react';
import * as typeTokens from '@carbon/type';

const Link = Carbon.Link;

const DURATIONS = [
  { token: 'duration-fast-01', ms: 70, use: 'Micro-interactions: small toggles, snaps' },
  { token: 'duration-fast-02', ms: 110, use: 'Micro-interactions: small expansion' },
  { token: 'duration-moderate-01', ms: 150, use: 'Small expansion: short distances' },
  { token: 'duration-moderate-02', ms: 240, use: 'Expansion: system communication' },
  { token: 'duration-slow-01', ms: 400, use: 'Large expansion: important updates' },
  { token: 'duration-slow-02', ms: 700, use: 'Large expansion: large elements' },
];

const EASINGS = [
  { name: 'productive', value: 'cubic-bezier(0.2, 0, 0.38, 0.9)' },
  { name: 'expressive', value: 'cubic-bezier(0.4, 0.14, 0.3, 1)' },
];

function MotionDemo() {
  const [go, setGo] = useState(false);
  return (
    <div>
      <Carbon.Button kind="tertiary" onClick={() => setGo(!go)}>
        {go ? 'Reset' : 'Play all'}
      </Carbon.Button>
      {EASINGS.map((e) => (
        <div key={e.name} style={{ marginTop: '1rem' }}>
          <strong>
            {e.name} <code>{e.value}</code>
          </strong>
          {DURATIONS.map((d) => (
            <div key={d.token} style={{ marginTop: '0.5rem' }}>
              <code>
                {d.token} ({d.ms}ms) — {d.use}
              </code>
              <div style={{ background: '#e0e0e0', height: '1.25rem', width: '100%', marginTop: '0.25rem' }}>
                <div
                  style={{
                    background: '#0f62fe',
                    height: '100%',
                    width: '2.5rem',
                    transform: go ? 'translateX(calc(100vw / 3))' : 'translateX(0)',
                    transition: `transform ${d.ms}ms ${e.value}`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

const SPACING = [
  ['spacing-01', '0.125rem'],
  ['spacing-02', '0.25rem'],
  ['spacing-03', '0.5rem'],
  ['spacing-04', '0.75rem'],
  ['spacing-05', '1rem'],
  ['spacing-06', '1.5rem'],
  ['spacing-07', '2rem'],
  ['spacing-08', '2.5rem'],
  ['spacing-09', '3rem'],
  ['spacing-10', '4rem'],
  ['spacing-11', '5rem'],
  ['spacing-12', '6rem'],
  ['spacing-13', '10rem'],
];

const TYPE_SAMPLE = [
  'fluidDisplay03',
  'display01',
  'heading07',
  'heading03',
  'body02',
  'body01',
  'caption01',
  'code01',
  'label01',
  'helperText01',
];

const ICON_SAMPLE = ['Add', 'Search', 'Settings', 'User', 'Warning', 'Checkmark', 'ArrowRight'];

export default function Foundations() {
  return (
    <div>
      <div className="bong-section">
        <h2>Motion</h2>
        <p>Durations and easings from the pinned @carbon/motion tokens.</p>
        <MotionDemo />
      </div>

      <div className="bong-section">
        <h2>Typography</h2>
        <p>Type tokens from the pinned @carbon/type package.</p>
        {TYPE_SAMPLE.map((t) => {
          const s = typeTokens.styles ? typeTokens.styles[t] : typeTokens[t];
          if (!s) return null;
          return (
            <div key={t} style={{ marginTop: '1rem', borderTop: '1px solid #e0e0e0', paddingTop: '1rem' }}>
              <code>{t}</code>
              <div style={{ fontSize: s.fontSize, lineHeight: s.lineHeight, fontWeight: s.fontWeight, letterSpacing: s.letterSpacing }}>
                Bongbetic builds free software with loud opinions.
              </div>
            </div>
          );
        })}
      </div>

      <div className="bong-section">
        <h2>Spacing</h2>
        <p>Carbon spacing scale. Same steps on every screen.</p>
        {SPACING.map(([token, value]) => (
          <div key={token} style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
            <code style={{ width: '7rem' }}>{token}</code>
            <div style={{ background: '#0f62fe', height: '1rem', width: value }} />
            <span>{value}</span>
          </div>
        ))}
      </div>

      <div className="bong-section">
        <h2>2x grid</h2>
        <p>Carbon grid at 2x. Resize the window: columns hold.</p>
        <Carbon.FlexGrid>
          <Carbon.Row>
            <Carbon.Column sm={4} md={8} lg={16}>
              <div style={{ background: '#161616', color: '#fff', padding: '1rem' }}>Full width</div>
            </Carbon.Column>
          </Carbon.Row>
          <Carbon.Row style={{ marginTop: '1rem' }}>
            <Carbon.Column sm={2} md={4} lg={8}>
              <div style={{ background: '#e0e0e0', padding: '1rem' }}>Half</div>
            </Carbon.Column>
            <Carbon.Column sm={2} md={4} lg={8}>
              <div style={{ background: '#e0e0e0', padding: '1rem' }}>Half</div>
            </Carbon.Column>
          </Carbon.Row>
          <Carbon.Row style={{ marginTop: '1rem' }}>
            {[1, 2, 3, 4].map((i) => (
              <Carbon.Column key={i} sm={1} md={2} lg={4}>
                <div style={{ background: '#f4f4f4', padding: '1rem' }}>{`Quarter ${i}`}</div>
              </Carbon.Column>
            ))}
          </Carbon.Row>
        </Carbon.FlexGrid>
      </div>

      <div className="bong-section">
        <h2>Icons</h2>
        <p>Pinned @carbon/icons-react. Same glyphs everywhere.</p>
        <div className="bong-demo-row">
          {ICON_SAMPLE.map((name) => {
            const Icon = Icons[name];
            if (!Icon) return null;
            return (
              <span key={name} style={{ display: 'inline-block', textAlign: 'center', width: '5rem' }}>
                <Icon size={32} />
                <br />
                <code>{name}</code>
              </span>
            );
          })}
        </div>
        <p>
          <Link href="https://www.carbondesignsystem.com/guidelines/icons/library">Upstream icon library</Link>
        </p>
      </div>
    </div>
  );
}
