import React from 'react';
import { Breadcrumb, BreadcrumbItem, ClickableTile } from '@carbon/react';
import { FOUNDATION_SECTIONS } from '../foundations.jsx';
import { RouteLink, navClick } from '../routes.jsx';

function slugOf(id) {
  return id.replace(/^foundations-/, '');
}

// One-line card copy per foundation. Kept free of section-body markers so
// the render-check "no content remains only on the old single page"
// assertion keeps passing: the index links, never duplicates, bodies.
const FOUNDATION_COPY = {
  '2x-grid': 'Responsive columns for page structure.',
  accessibility: 'Keyboard, focus, and contrast essentials.',
  'carbon-for-ai': 'Rules for labelling generated content.',
  color: 'Swatches and themes from the pinned release.',
  content: 'Voice, verbs, and error copy.',
  icons: 'The pinned vector set, searchable.',
  pictograms: 'Large illustration marks, easy to browse.',
  motion: 'Timing and easing values.',
  spacing: 'The 13-step layout scale.',
  themes: 'Surface and text pairs for four modes.',
  typography: 'Fluid and fixed type samples.',
};

// Card grid in the same visual language as the Patterns index/home cards:
// one ClickableTile per foundation, each opening its routed page.
function FoundationCards({ except }) {
  const cards = FOUNDATION_SECTIONS.filter((s) => s.id !== except);
  return (
    <div className="bong-card-grid">
      {cards.map((s) => {
        const to = `/foundations/${slugOf(s.id)}`;
        return (
          <ClickableTile key={s.id} href={to} onClick={navClick(to)}>
            <h3>{s.title}</h3>
            <p>{FOUNDATION_COPY[slugOf(s.id)] || 'Open the foundation page.'}</p>
          </ClickableTile>
        );
      })}
    </div>
  );
}

// One foundation per URL: the matching section inside the shell, with the
// rest of the foundations one click away.
export default function FoundationPage({ slug }) {
  const sections = FOUNDATION_SECTIONS;
  const current = sections.find((s) => slugOf(s.id) === String(slug || '').toLowerCase());
  if (!current) {
    // /foundations is an index, not a single page: every foundation lives
    // on its own routed page, so no content remains only here.
    return (
      <div>
        <Breadcrumb>
          <BreadcrumbItem>
            <RouteLink to="/">Home</RouteLink>
          </BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>Foundations</BreadcrumbItem>
        </Breadcrumb>
        <h1>Foundations</h1>
        {slug ? (
          <div>
            <h2>Foundation not found</h2>
            <p>No foundation named &ldquo;{slug}&rdquo;. Pick one below.</p>
          </div>
        ) : (
          <p>Each foundation below has its own page, driven by the pinned token and icon indexes.</p>
        )}
        <FoundationCards except={null} />
      </div>
    );
  }
  return (
    <div>
      <Breadcrumb>
        <BreadcrumbItem>
          <RouteLink to="/">Home</RouteLink>
        </BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>Foundations</BreadcrumbItem>
      </Breadcrumb>
      <h1>Foundations</h1>
      {(current ? [current] : sections).map((s) => (
        <div key={s.id} id={s.id} className="bong-section">
          <h2>{s.title}</h2>
          {s.body}
        </div>
      ))}
      <FoundationIndex except={current ? current.id : null} />
    </div>
  );
}

function FoundationIndex({ except }) {
  return (
    <div className="bong-section">
      <h2>All foundations</h2>
      <FoundationCards except={except} />
    </div>
  );
}
