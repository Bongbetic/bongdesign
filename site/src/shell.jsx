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
        <HeaderName href="/" prefix="" onClick={navClick('/')}>
          <img
            src="/branding/bongbetic-wordmark@2x.png"
            alt="Bongbetic"
            width="125"
            height="28"
            className="bong-wordmark"
          />
          BongDesign
        </HeaderName>
        <HeaderNavigation aria-label="Site">
          <HeaderMenuItem
            href="/"
            onClick={navClick('/')}
            aria-current={active('home') ? 'page' : undefined}
          >
            Home
          </HeaderMenuItem>
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
          </SideNavItems>
        </SideNav>
        <Content className="bong-content">{children}</Content>
      </div>
    </>
  );
}
