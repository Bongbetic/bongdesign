import React from 'react';
import { RouteLink } from '../routes.jsx';

export default function NotFoundPage() {
  return (
    <div>
      <h1>Page not found</h1>
      <p>
        Nothing lives at this URL. Try the <RouteLink to="/">home page</RouteLink>{' '}
        or the <RouteLink to="/components">component index</RouteLink>.
      </p>
    </div>
  );
}
