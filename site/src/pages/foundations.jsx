import React from 'react';
import { Breadcrumb, BreadcrumbItem } from '@carbon/react';
import { FOUNDATION_SECTIONS } from '../foundations.jsx';
import { RouteLink } from '../routes.jsx';

function slugOf(id) {
  return id.replace(/^foundations-/, '');
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
            <p>No foundation named “{slug}”. Pick one below.</p>
          </div>
        ) : (
          <p>Each foundation below has its own page, driven by the pinned token and icon indexes.</p>
        )}
        <ul>
          {sections.map((s) => (
            <li key={s.id}>
              <RouteLink to={`/foundations/${slugOf(s.id)}`}>{s.title}</RouteLink>
            </li>
          ))}
        </ul>
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
      <ul>
        {FOUNDATION_SECTIONS.filter((s) => s.id !== except).map((s) => (
          <li key={s.id}>
            <RouteLink to={`/foundations/${slugOf(s.id)}`}>{s.title}</RouteLink>
          </li>
        ))}
      </ul>
    </div>
  );
}
