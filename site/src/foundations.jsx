import React, { useState } from 'react';
import * as Carbon from '@carbon/react';
import * as Icons from '@carbon/icons-react';
import * as Pictograms from '@carbon/pictograms-react';
import * as typeTokens from '@carbon/type';
import * as colorTokens from '@carbon/colors';
import * as themeTokens from '@carbon/themes';

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

function MotionSection() {
  const [go, setGo] = useState(false);
  return (
    <div>
      <p>Durations and easings from the pinned @carbon/motion tokens.</p>
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

const PALETTE_FAMILIES = ['blue', 'gray', 'red', 'green', 'yellow', 'orange', 'purple', 'cyan', 'teal', 'magenta'];
const GRADES = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

function ColorSection() {
  return (
    <div>
      <p>Palettes from the pinned @carbon/colors package.</p>
      {PALETTE_FAMILIES.map((fam) => (
        <div key={fam} style={{ marginTop: '1.5rem' }}>
          <strong style={{ textTransform: 'capitalize' }}>{fam}</strong>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
            {GRADES.map((g) => {
              const hex = colorTokens[`${fam}${g}`];
              if (!hex) return null;
              return (
                <span key={g} style={{ width: '5.5rem', textAlign: 'center' }}>
                  <span
                    style={{
                      display: 'block',
                      height: '3rem',
                      background: hex,
                      border: hex === '#ffffff' ? '1px solid #e0e0e0' : 'none',
                    }}
                  />
                  <code>
                    {fam} {g}
                    <br />
                    {hex}
                  </code>
                </span>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

const THEME_NAMES = ['white', 'g10', 'g90', 'g100'];

function ThemesSection() {
  return (
    <div>
      <p>Theme tokens from the pinned @carbon/themes package.</p>
      {THEME_NAMES.map((t) => {
        const theme = themeTokens[t];
        if (!theme) return null;
        return (
          <div
            key={t}
            style={{
              background: theme.background,
              color: theme.textPrimary,
              padding: '1.5rem',
              marginTop: '1.5rem',
            }}
          >
            <strong>
              {theme.name || t} theme
            </strong>
            <p style={{ color: theme.textSecondary }}>Secondary text on the same surface.</p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <span>
                <code>background</code>
                <br />
                {theme.background}
              </span>
              <span>
                <code>textPrimary</code>
                <br />
                {theme.textPrimary}
              </span>
              <span>
                <code>interactive</code>
                <br />
                {theme.interactive}
              </span>
            </div>
          </div>
        );
      })}
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

function SpacingSection() {
  return (
    <div>
      <p>Carbon spacing scale. Same steps everywhere.</p>
      {SPACING.map(([token, value]) => (
        <div key={token} style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
          <code style={{ width: '7rem' }}>{token}</code>
          <div style={{ background: '#0f62fe', height: '1rem', width: value }} />
          <span>{value}</span>
        </div>
      ))}
    </div>
  );
}

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

function TypographySection() {
  return (
    <div>
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
  );
}

function GridSection() {
  return (
    <div>
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
  );
}

const ICON_SAMPLE = ['Add', 'Search', 'Settings', 'User', 'Warning', 'Checkmark', 'ArrowRight'];
const PICTO_SAMPLE = ['Accessibility', 'Advocate', 'AiEthics', 'Api', 'AppConnector', 'Automation'];

function IconsSection() {
  return (
    <div>
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
    </div>
  );
}

function PictogramsSection() {
  return (
    <div>
      <p>Pinned @carbon/pictograms-react, 1577 pictograms.</p>
      <div className="bong-demo-row">
        {PICTO_SAMPLE.map((name) => {
          const P = Pictograms[name];
          if (!P) return null;
          return (
            <span key={name} style={{ display: 'inline-block', textAlign: 'center', width: '6rem' }}>
              <P width={48} height={48} />
              <br />
              <code>{name}</code>
            </span>
          );
        })}
      </div>
    </div>
  );
}

const FOUNDATION_SECTIONS = [
  { id: 'foundations-2x-grid', title: '2x Grid', body: <GridSection /> },
  {
    id: 'foundations-accessibility',
    title: 'Accessibility',
    body: (
      <div>
        <p>
          Build for everyone from the start. Keyboard-first navigation,
          visible focus, and sufficient contrast are part of every component
          here, not an afterthought.
        </p>
        <ul>
          <li>Every action reachable and operable by keyboard alone.</li>
          <li>Focus indicator always visible and never clipped.</li>
          <li>Text contrast 4.5 to 1 or better; large text 3 to 1.</li>
          <li>Never signal by color alone; pair with text or icon.</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'foundations-carbon-for-ai',
    title: 'Carbon for AI',
    body: (
      <div>
        <p>
          AI surfaces need the same clarity as any other UI. Generated content
          gets labelled, machine output stays editable, and people stay in
          control.
        </p>
        <ul>
          <li>Label AI output with the AI label; provenance is never hidden.</li>
          <li>Generated text stays editable before it is used.</li>
          <li>Confidence shown honestly; no fake certainty.</li>
          <li>A person can always undo, edit, or dismiss.</li>
        </ul>
      </div>
    ),
  },
  { id: 'foundations-color', title: 'Color', body: <ColorSection /> },
  {
    id: 'foundations-content',
    title: 'Content',
    body: (
      <div>
        <p>
          Write like a person speaking to a person. Short sentences, plain
          words, action-first labels. The interface is a conversation.
        </p>
        <ul>
          <li>Buttons are verbs: Save, Delete, Create.</li>
          <li>Errors say what broke and how to fix it.</li>
          <li>One idea per sentence. Cut every spare word.</li>
        </ul>
      </div>
    ),
  },
  { id: 'foundations-icons', title: 'Icons', body: <IconsSection /> },
  { id: 'foundations-pictograms', title: 'Pictograms', body: <PictogramsSection /> },
  { id: 'foundations-motion', title: 'Motion', body: <MotionSection /> },
  { id: 'foundations-spacing', title: 'Spacing', body: <SpacingSection /> },
  { id: 'foundations-themes', title: 'Themes', body: <ThemesSection /> },
  { id: 'foundations-typography', title: 'Typography', body: <TypographySection /> },
];

export default function Foundations() {
  return (
    <div>
      {FOUNDATION_SECTIONS.map((s) => (
        <div key={s.id} id={s.id} className="bong-section">
          <h2>{s.title}</h2>
          {s.body}
        </div>
      ))}
    </div>
  );
}
