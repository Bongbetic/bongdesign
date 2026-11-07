import * as React from 'react';

export const brandTokens: { accent: string };
export const brandAssets: {
  glyph: string;
  wordmark: { light: string; dark: string };
  wordmark2x: { light: string; dark: string };
  icon192: { light: string; dark: string };
  icon512: { light: string; dark: string };
  favicon: string;
  appleTouchIcon: string;
  manifest: string;
};

export interface BongbeticLogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  variant?: 'wordmark' | 'glyph';
  theme?: 'light' | 'dark';
  height?: number;
}
export function BongbeticLogo(props: BongbeticLogoProps): React.ReactElement;

export interface BongbeticHeaderProps {
  productName?: string;
  href?: string;
  theme?: 'light' | 'dark';
  children?: React.ReactNode;
  [key: string]: unknown;
}
export function BongbeticHeader(props: BongbeticHeaderProps): React.ReactElement;
