import React, { useEffect } from 'react';
import Shell from './shell.jsx';
import HomePage from './pages/home.jsx';
import { ComponentPage, ComponentsOverview } from './pages/components.jsx';
import FoundationPage from './pages/foundations.jsx';
import { DataVisualizationPage, McpPage, PatternPage, PatternsIndex, SupportPage } from './pages/guidance.jsx';
import NotFoundPage from './pages/notfound.jsx';
import { ROUTES, matchRoute, useRoute } from './routes.jsx';

// eslint-disable-next-line react-refresh/only-export-components

export { ROUTES, matchRoute };

const TITLES = {
  home: 'BongDesign — self-hosted Carbon component library',
  components: 'Components — BongDesign',
  component: 'Component — BongDesign',
  foundations: 'Foundations — BongDesign',
  patterns: 'Patterns — BongDesign',
  pattern: 'Pattern — BongDesign',
  'data-viz': 'Data visualization — BongDesign',
  support: 'Support — BongDesign',
  mcp: 'Connect the MCP — BongDesign',
  notfound: 'Not found — BongDesign',
};

export function PageForRoute({ route }) {
  switch (route.id) {
    case 'home':
      return <HomePage />;
    case 'components':
      return <ComponentsOverview />;
    case 'component':
      return <ComponentPage name={route.params.name} />;
    case 'foundations':
      return <FoundationPage slug={route.params.slug} />;
    case 'patterns':
      return <PatternsIndex />;
    case 'pattern':
      return <PatternPage name={route.params.name} />;
    case 'data-viz':
      return <DataVisualizationPage />;
    case 'support':
      return <SupportPage />;
    case 'mcp':
      return <McpPage />;
    default:
      return <NotFoundPage />;
  }
}

// SSR seam: render any path inside the shell without a browser.
export function AppForPath({ path }) {
  const route = matchRoute(path);
  return (
    <Shell route={route}>
      <PageForRoute route={route} />
    </Shell>
  );
}

export default function App() {
  const { path, route } = useRoute();
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = TITLES[route.id] || TITLES.notfound;
    }
  }, [route.id, path]);
  return (
    <Shell route={route}>
      <PageForRoute route={route} />
    </Shell>
  );
}
