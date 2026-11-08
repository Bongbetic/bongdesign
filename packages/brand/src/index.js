import React from 'react';
import { Header, HeaderName } from '@bongbetic/react';

const asset = (name) => new URL(`../assets/${name}`, import.meta.url).href;

// Every shipped file, resolved to a URL the bundler can serve.
export const brandAssets = {
  glyph: asset('b_glyph.svg'),
  wordmark: { light: asset('wordmark-light.png'), dark: asset('wordmark-dark.png') },
  wordmark2x: { light: asset('wordmark-light@2x.png'), dark: asset('wordmark-dark@2x.png') },
  icon192: { light: asset('icon-light-192.png'), dark: asset('icon-dark-192.png') },
  icon512: { light: asset('icon-light-512.png'), dark: asset('icon-dark-512.png') },
  favicon: asset('favicon.ico'),
  appleTouchIcon: asset('apple-touch-icon.png'),
  manifest: asset('site.webmanifest'),
};

export const brandTokens = { accent: '#e11d2a' };

// theme "light" = logo for light backgrounds, "dark" = logo for dark backgrounds.
export function BongbeticLogo({ variant = 'wordmark', theme = 'light', height = 20, alt = 'Bongbetic', ...rest }) {
  const src = variant === 'glyph'
    ? brandAssets.glyph
    : brandAssets.wordmark2x[theme === 'dark' ? 'dark' : 'light'];
  return React.createElement('img', {
    src, alt, height, className: 'bb-logo', style: { height, width: 'auto' }, ...rest,
  });
}

// Carbon UIShell Header with the Bongbetic wordmark, plus the red accent rule.
// The rule is an accent only: it never fills a control. Pass nav as children.
export function BongbeticHeader({ productName = '', href = '/', theme = 'light', children, ...rest }) {
  return React.createElement(
    React.Fragment,
    null,
    React.createElement(
      Header,
      { 'aria-label': productName || 'Bongbetic', className: 'bb-header', ...rest },
      React.createElement(
        HeaderName,
        { href, prefix: '', className: 'bb-header__name' },
        React.createElement(BongbeticLogo, { theme }),
        productName ? React.createElement('span', { className: 'bb-header__product' }, productName) : null,
      ),
      children,
    ),
    React.createElement('div', { className: 'bb-red-rule', 'aria-hidden': 'true' }),
  );
}
