import React from 'react';
import {
  Content,
  Header,
  HeaderMenuItem,
  HeaderName,
  HeaderNavigation,
  SideNav,
  SideNavItems,
  SideNavMenu,
  SideNavMenuItem,
} from '@carbon/react';
import { navClick, sectionFor } from './routes.jsx';
import { FOUNDATION_SECTIONS } from './foundations.jsx';
import { PATTERNS } from './pages/guidance.jsx';

function slugOf(id) {
  return id.replace(/^foundations-/, '');
}

// Carbon Header + SideNav shell. White masthead with the vendored Bongbetic
// wordmark, 3px red rule, Carbon blue interactive. Every page mounts here;
// client-side nav swaps only the Content, never the shell. ADR 0005.
export default function Shell({ route, children }) {
  const section = sectionFor(route);
  const active = (name) => section === name;
  return (
    <>
      <Header aria-label="BongDesign" className="bong-masthead">
        <HeaderName href="/" prefix="" onClick={navClick('/')} className="bong-lockup">
          <img
            src="/branding/bongbetic-wordmark@2x.png"
            alt="Bongbetic"
            className="bong-lockup-logo"
          />
          <span className="bong-lockup-suffix">BongDesign</span>
        </HeaderName>
        <HeaderNavigation aria-label="Site">
          <HeaderMenuItem
            href="/foundations/color"
            onClick={navClick('/foundations/color')}
            aria-current={active('foundations') ? 'page' : undefined}
          >
            Foundations
          </HeaderMenuItem>
          <HeaderMenuItem
            href="/components"
            onClick={navClick('/components')}
            aria-current={active('components') ? 'page' : undefined}
          >
            Components
          </HeaderMenuItem>
          <HeaderMenuItem
            href="/patterns"
            onClick={navClick('/patterns')}
            aria-current={active('patterns') ? 'page' : undefined}
          >
            Patterns
          </HeaderMenuItem>
          <HeaderMenuItem
            href="/data-visualization"
            onClick={navClick('/data-visualization')}
            aria-current={active('data-viz') ? 'page' : undefined}
          >
            Data visualization
          </HeaderMenuItem>
        </HeaderNavigation>
        <a className="bong-login-link" href="/login">
          Log in
        </a>
      </Header>
      <div className="bong-red-rule" aria-hidden="true" />
      <div className="bong-shell-body">
        <SideNav
          aria-label="Documentation"
          expanded
          isPersistent
          isChildOfHeader={false}
          className="bong-sidenav"
        >
          <SideNavItems>
            <SideNavMenu renderIcon={() => null} title="Getting started" defaultExpanded>
              <SideNavMenuItem
                href="/"
                onClick={navClick('/')}
                isActive={active('home')}
                aria-current={active('home') ? 'page' : undefined}
              >
                Home
              </SideNavMenuItem>
            </SideNavMenu>
            <SideNavMenu renderIcon={() => null} title="Foundations" defaultExpanded={active('foundations')}>
              {FOUNDATION_SECTIONS.map((s) => {
                const to = `/foundations/${slugOf(s.id)}`;
                const on = active('foundations') && route.params && route.params.slug === slugOf(s.id);
                return (
                  <SideNavMenuItem
                    key={s.id}
                    href={to}
                    onClick={navClick(to)}
                    isActive={on}
                    aria-current={on ? 'page' : undefined}
                  >
                    {s.title}
                  </SideNavMenuItem>
                );
              })}
            </SideNavMenu>
            <SideNavMenu renderIcon={() => null} title="Components" defaultExpanded={active('components')}>
              <SideNavMenuItem
                href="/components"
                onClick={navClick('/components')}
                isActive={active('components')}
                aria-current={active('components') ? 'page' : undefined}
              >
                Overview
              </SideNavMenuItem>
            </SideNavMenu>
            <SideNavMenu renderIcon={() => null} title="Patterns" defaultExpanded={active('patterns')}>
              <SideNavMenuItem
                href="/patterns"
                onClick={navClick('/patterns')}
                isActive={active('patterns') && !(route.params && route.params.name)}
                aria-current={active('patterns') && !(route.params && route.params.name) ? 'page' : undefined}
              >
                Overview
              </SideNavMenuItem>
              {PATTERNS.map((p) => {
                const to = '/patterns/' + p.slug;
                const on = active('patterns') && route.params && route.params.name === p.slug;
                return (
                  <SideNavMenuItem
                    key={p.slug}
                    href={to}
                    onClick={navClick(to)}
                    isActive={on}
                    aria-current={on ? 'page' : undefined}
                  >
                    {p.title}
                  </SideNavMenuItem>
                );
              })}
            </SideNavMenu>
            <SideNavMenu renderIcon={() => null} title="Data visualization" defaultExpanded={active('data-viz')}>
              <SideNavMenuItem
                href="/data-visualization"
                onClick={navClick('/data-visualization')}
                isActive={active('data-viz')}
                aria-current={active('data-viz') ? 'page' : undefined}
              >
                Guidance
              </SideNavMenuItem>
            </SideNavMenu>
            <SideNavMenu renderIcon={() => null} title="Support" defaultExpanded={active('support')}>
              <SideNavMenuItem
                href="/support"
                onClick={navClick('/support')}
                isActive={route.id === 'support'}
                aria-current={route.id === 'support' ? 'page' : undefined}
              >
                Support home
              </SideNavMenuItem>
              <SideNavMenuItem
                href="/mcp"
                onClick={navClick('/mcp')}
                isActive={route.id === 'mcp'}
                aria-current={route.id === 'mcp' ? 'page' : undefined}
              >
                Connect the MCP
              </SideNavMenuItem>
            </SideNavMenu>
          </SideNavItems>
        </SideNav>
        <Content className="bong-content">{children}</Content>
      </div>
    </>
  );
}
