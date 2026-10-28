import React, { useState } from 'react';
import * as Carbon from '@carbon/react';
import IconsLibrary from './icons.jsx';
import { PictogramsLibrary } from './pictograms.jsx';
import tokens from '../../data/tokens.json';

const Link = Carbon.Link;

// Duration and easing values come from the generated token index
// (data/tokens.json), mined from the pinned @carbon/motion package.
const DURATIONS = [
  { key: 'durationFast01', label: 'duration-fast-01', use: 'Micro-interactions: small toggles, snaps' },
  { key: 'durationFast02', label: 'duration-fast-02', use: 'Micro-interactions: small expansion' },
  { key: 'durationModerate01', label: 'duration-moderate-01', use: 'Small expansion: short distances' },
  { key: 'durationModerate02', label: 'duration-moderate-02', use: 'Expansion: system communication' },
  { key: 'durationSlow01', label: 'duration-slow-01', use: 'Large expansion: important updates' },
  { key: 'durationSlow02', label: 'duration-slow-02', use: 'Large expansion: large elements' },
];

const EASINGS = [
  { name: 'productive', value: tokens.motion.easings.standard.productive },
  { name: 'expressive', value: tokens.motion.easings.standard.expressive },
];

function motionMs(key) {
  return parseInt(tokens.motion[key], 10);
}

function MotionSection() {
  const [go, setGo] = useState(false);
  return (
    <div>
      <p>Durations and easings from the pinned token index (data/tokens.json).</p>
      <Carbon.Button kind="tertiary" onClick={() => setGo(!go)}>
        {go ? 'Reset' : 'Play all'}
      </Carbon.Button>
      <Carbon.FlexGrid>
      {EASINGS.map((e) => (
        <Carbon.Row key={e.name}>
          <Carbon.Column>
          <Carbon.Tile>
          <strong>
            {e.name} <code>{e.value}</code>
          </strong>
          {DURATIONS.map((d) => (
            <div key={d.token} style={{ marginTop: '0.5rem' }}>
              <code>
                {d.label} ({motionMs(d.key)}ms) — {d.use}
              </code>
              <div style={{ background: '#e0e0e0', height: '1.25rem', width: '100%', marginTop: '0.25rem' }}>
                <div
                  style={{
                    background: '#0f62fe',
                    height: '100%',
                    width: '2.5rem',
                    transform: go ? 'translateX(calc(100vw / 3))' : 'translateX(0)',
                    transition: `transform ${motionMs(d.key)}ms ${e.value}`,
                  }}
                />
              </div>
            </div>
          ))}
          </Carbon.Tile>
          </Carbon.Column>
        </Carbon.Row>
      ))}
      </Carbon.FlexGrid>
    </div>
  );
}

const PALETTE_FAMILIES = ['blue', 'gray', 'red', 'green', 'yellow', 'orange', 'purple', 'cyan', 'teal', 'magenta'];
const GRADES = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

function ColorSection() {
  return (
    <div>
      <p>Palettes from the pinned token index (data/tokens.json).</p>
      <Carbon.FlexGrid>
      {PALETTE_FAMILIES.map((fam) => (
        <Carbon.Row key={fam}>
          <Carbon.Column>
          <Carbon.Tile>
          <strong style={{ textTransform: 'capitalize' }}>{fam}</strong>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
            {GRADES.map((g) => {
              const hex = tokens.colors[`${fam}${g}`];
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
          </Carbon.Tile>
          </Carbon.Column>
        </Carbon.Row>
      ))}
      </Carbon.FlexGrid>
    </div>
  );
}

const THEME_NAMES = ['white', 'g10', 'g90', 'g100'];

function ThemesSection() {
  return (
    <div>
      <p>Theme tokens from the pinned token index (data/tokens.json).</p>
      <Carbon.FlexGrid>
      {THEME_NAMES.map((t) => {
        const theme = tokens.themes[t];
        if (!theme) return null;
        return (
          <Carbon.Row key={t}>
          <Carbon.Column>
          <div
            style={{
              background: theme.background,
              color: theme.textPrimary,
              padding: '1.5rem',
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
          </Carbon.Column>
          </Carbon.Row>
        );
      })}
      </Carbon.FlexGrid>
    </div>
  );
}

// Spacing steps from the generated token index (data/tokens.json),
// mined from the pinned @carbon/layout package.
const SPACING = Array.from({ length: 13 }, (_, i) => {
  const n = String(i + 1).padStart(2, '0');
  return [`spacing-${n}`, tokens.layout[`spacing${n}`]];
});

function SpacingSection() {
  return (
    <div>
      <p>Carbon spacing scale. Same steps everywhere.</p>
      <Carbon.StructuredListWrapper>
        <Carbon.StructuredListBody>
          {SPACING.map(([token, value]) => (
            <Carbon.StructuredListRow key={token}>
              <Carbon.StructuredListCell>
                <code>{token}</code>
              </Carbon.StructuredListCell>
              <Carbon.StructuredListCell>
                <div style={{ background: '#0f62fe', height: '1rem', width: value }} />
              </Carbon.StructuredListCell>
              <Carbon.StructuredListCell>{value}</Carbon.StructuredListCell>
            </Carbon.StructuredListRow>
          ))}
        </Carbon.StructuredListBody>
      </Carbon.StructuredListWrapper>
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
      <p>Type tokens from the pinned token index (data/tokens.json).</p>
      <Carbon.FlexGrid>
      {TYPE_SAMPLE.map((t) => {
        const s = tokens.type[t];
        if (!s) return null;
        return (
          <Carbon.Row key={t}>
          <Carbon.Column>
          <Carbon.Tile>
            <code>{t}</code>
            <div style={{ fontSize: s.fontSize, lineHeight: s.lineHeight, fontWeight: s.fontWeight, letterSpacing: s.letterSpacing }}>
              Bongbetic builds free software with loud opinions.
            </div>
          </Carbon.Tile>
          </Carbon.Column>
          </Carbon.Row>
        );
      })}
      </Carbon.FlexGrid>
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

function IconsSection() {
  return (
    <div>
      <p>Pinned icon index (data/icons.json). Search filters the full set.</p>
      <IconsLibrary />
    </div>
  );
}

function PictogramsSection() {
  return (
    <div>
      <p>Pinned pictogram index (data/icons.json). Search filters the full set.</p>
      <PictogramsLibrary />
    </div>
  );
}

export const FOUNDATION_SECTIONS = [
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
        <Carbon.UnorderedList>
          <Carbon.ListItem>Every action reachable and operable by keyboard alone.</Carbon.ListItem>
          <Carbon.ListItem>Focus indicator always visible and never clipped.</Carbon.ListItem>
          <Carbon.ListItem>Text contrast 4.5 to 1 or better; large text 3 to 1.</Carbon.ListItem>
          <Carbon.ListItem>Never signal by color alone; pair with text or icon.</Carbon.ListItem>
        </Carbon.UnorderedList>
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
        <Carbon.UnorderedList>
          <Carbon.ListItem>Label AI output with the AI label; provenance is never hidden.</Carbon.ListItem>
          <Carbon.ListItem>Generated text stays editable before it is used.</Carbon.ListItem>
          <Carbon.ListItem>Confidence shown honestly; no fake certainty.</Carbon.ListItem>
          <Carbon.ListItem>A person can always undo, edit, or dismiss.</Carbon.ListItem>
        </Carbon.UnorderedList>
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
        <Carbon.UnorderedList>
          <Carbon.ListItem>Buttons are verbs: Save, Delete, Create.</Carbon.ListItem>
          <Carbon.ListItem>Errors say what broke and how to fix it.</Carbon.ListItem>
          <Carbon.ListItem>One idea per sentence. Cut every spare word.</Carbon.ListItem>
        </Carbon.UnorderedList>
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
