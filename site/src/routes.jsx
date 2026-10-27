import React, { useCallback, useEffect, useState } from 'react';

// Route registry (registry:routes hotspot). One table drives the shell nav,
// the History router, and the render-check SSR assertions. ADR 0001.
export const ROUTES = [
  { id: 'home', path: '/', label: 'Home', section: 'home' },
  { id: 'components', path: '/components', label: 'Components', section: 'components' },
  { id: 'component', path: '/components/:name', label: 'Component', section: 'components' },
  { id: 'foundations', path: '/foundations/:slug', label: 'Foundations', section: 'foundations' },
];

export function normalizePath(pathname) {
  let p = String(pathname == null ? '/' : pathname)
    .split('?')[0]
    .split('#')[0];
  if (!p.startsWith('/')) p = '/' + p;
  if (p.length > 1) p = p.replace(/\/+$/, '');
  return p || '/';
}

export function matchRoute(pathname) {
  const p = normalizePath(pathname);
  if (p === '/') return { id: 'home', params: {} };
  if (p === '/components') return { id: 'components', params: {} };
  let m = p.match(/^\/components\/([^/]+)$/);
  if (m) return { id: 'component', params: { name: decodeURIComponent(m[1]).toLowerCase() } };
  if (p === '/foundations') return { id: 'foundations', params: { slug: '' } };
  m = p.match(/^\/foundations\/([^/]+)$/);
  if (m) return { id: 'foundations', params: { slug: decodeURIComponent(m[1]).toLowerCase() } };
  return { id: 'notfound', params: {} };
}

export function sectionFor(route) {
  const found = ROUTES.find((r) => r.id === (route && route.id));
  return found ? found.section : null;
}

function currentPath() {
  if (typeof window === 'undefined' || !window.location) return '/';
  return normalizePath(window.location.pathname);
}

// History navigation: pushState + a popstate dispatch so the shell re-renders
// without a reload. Browser back/forward deliver real popstate events.
export function navigate(to) {
  const next = normalizePath(to);
  if (typeof window === 'undefined' || !window.history) return next;
  if (normalizePath(window.location.pathname) !== next) {
    window.history.pushState({}, '', next);
    window.dispatchEvent(new PopStateEvent('popstate'));
  } else if (window.scrollTo) {
    window.scrollTo(0, 0);
  }
  return next;
}

export function navClick(to) {
  return (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    navigate(to);
    if (typeof window !== 'undefined' && window.scrollTo) window.scrollTo(0, 0);
  };
}

export function useRoute() {
  const [path, setPath] = useState(currentPath);
  useEffect(() => {
    const onPop = () => {
      setPath(currentPath());
      if (window.scrollTo) window.scrollTo(0, 0);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  const go = useCallback((to) => {
    const next = navigate(to);
    setPath(next);
    if (window.scrollTo) window.scrollTo(0, 0);
  }, []);
  return { path, route: matchRoute(path), navigate: go };
}

// Anchor that keeps the shell mounted: same-tab left clicks route client-side.
export function RouteLink({ to, children, ...rest }) {
  return (
    <a href={to} {...rest} onClick={navClick(to)}>
      {children}
    </a>
  );
}
